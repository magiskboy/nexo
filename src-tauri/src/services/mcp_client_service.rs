use crate::error::AppError;
use crate::models::mcp_tool::MCPTool;
use crate::models::AddonIndex;
use crate::services::PythonRuntime;
use rust_mcp_sdk::{
    mcp_client::{client_runtime, ClientHandler, ClientRuntime},
    schema::{
        CallToolRequestParams, ClientCapabilities, Implementation, InitializeRequestParams,
        LATEST_PROTOCOL_VERSION,
    },
    McpClient,
};
use rust_mcp_transport::{
    ClientSseTransport, ClientSseTransportOptions, RequestOptions, StdioTransport,
    StreamableTransportOptions, TransportOptions,
};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Manager};

// Simple client handler - we don't need to handle any server messages for this use case
struct SimpleClientHandler;

#[async_trait::async_trait]
impl ClientHandler for SimpleClientHandler {
    // Empty implementation - we only need to list tools, not handle server messages
}

pub struct MCPClientService;

impl MCPClientService {
    /// Parse headers/env vars from JSON string
    fn parse_json_map(json_str: &Option<String>) -> Option<HashMap<String, String>> {
        if let Some(s) = json_str {
            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(s) {
                if let Some(obj) = parsed.as_object() {
                    let mut map = HashMap::new();
                    for (key, value) in obj {
                        if let Some(val_str) = value.as_str() {
                            map.insert(key.clone(), val_str.to_string());
                        }
                    }
                    if !map.is_empty() {
                        return Some(map);
                    }
                }
            }
        }
        None
    }

    /// Create client details for MCP initialization
    fn create_client_details() -> InitializeRequestParams {
        InitializeRequestParams {
            capabilities: ClientCapabilities::default(),
            client_info: Implementation {
                name: "nexo".to_string(),
                title: None,
                version: "0.1.0".to_string(),
            },
            protocol_version: LATEST_PROTOCOL_VERSION.to_string(),
        }
    }

    /// Create and start MCP client based on transport type
    pub async fn create_and_start_client(
        app: &AppHandle,
        url: String,
        r#type: String,
        headers: Option<String>,
        env_vars_json: Option<String>,
        runtime_path: Option<String>,
    ) -> Result<Arc<ClientRuntime>, AppError> {
        // Validate transport type
        if r#type != "sse" && r#type != "http-streamable" && r#type != "stdio" {
            return Err(AppError::Validation(format!(
                "Unsupported transport type: {}. Only 'sse', 'http-streamable', and 'stdio' are supported.",
                r#type
            )));
        }

        let custom_headers = Self::parse_json_map(&headers);
        let mut env_vars = Self::parse_json_map(&env_vars_json);

        // Fallback: If it's stdio and headers are provided but env_vars are not, use headers as env_vars (legacy support)
        if r#type == "stdio" && env_vars.is_none() && custom_headers.is_some() {
            env_vars = custom_headers.clone();
        }

        let client_details = Self::create_client_details();
        let handler = SimpleClientHandler {};

        let client = if r#type == "sse" {
            // Create SSE transport with custom headers if provided
            let sse_options = ClientSseTransportOptions {
                custom_headers,
                ..ClientSseTransportOptions::default()
            };
            let transport = match ClientSseTransport::new(&url, sse_options) {
                Ok(t) => t,
                Err(e) => {
                    let err_msg = format!("Failed to create SSE transport for {}: {}", url, e);
                    eprintln!("{}", err_msg);
                    return Err(AppError::Generic(err_msg));
                }
            };
            client_runtime::create_client(client_details, transport, handler)
        } else if r#type == "http-streamable" {
            // Create http-streamable transport with options
            let request_options = RequestOptions {
                custom_headers,
                ..RequestOptions::default()
            };
            let transport_options = StreamableTransportOptions {
                mcp_url: url.clone(),
                request_options,
            };
            client_runtime::with_transport_options(client_details, transport_options, handler)
        } else {
            // Create stdio transport
            // Parse URL: for stdio, URL format can be:
            // - "command" (just the command)
            // - "command arg1 arg2" (command with space-separated arguments)
            // - "/path/to/command" (absolute path)
            // Use shell-words to parse command and arguments, respecting quotes
            let parts = match shell_words::split(&url) {
                Ok(p) => p,
                Err(e) => {
                    let err_msg = format!("Invalid stdio URL '{}': parse error: {}", url, e);
                    eprintln!("{}", err_msg);
                    return Err(AppError::Validation(err_msg));
                }
            };

            if parts.is_empty() {
                let err_msg = format!("Invalid stdio URL '{}': command cannot be empty", url);
                eprintln!("{}", err_msg);
                return Err(AppError::Validation(err_msg));
            }

            let mut command = parts[0].clone();
            let args: Vec<String> = parts[1..].to_vec();

            // Handle runtime configuration
            if let Some(rt_path) = runtime_path {
                if !rt_path.is_empty() && rt_path != "default" {
                    if command == "uv" {
                        // For uv, keep 'uv' as command but set UV_PYTHON
                        // Try to find bundled uv first
                        let config = AddonIndex::default();
                        let installed = PythonRuntime::list_installed(app).unwrap_or_default();
                        for full_version in config.addons.python.versions.iter().rev() {
                            if installed.contains_key(full_version) {
                                if let Ok(rt) = PythonRuntime::detect(app, full_version) {
                                    command = rt.uv_path.to_string_lossy().to_string();
                                    break;
                                }
                            }
                        }

                        // Set UV_PYTHON
                        if let Some(vars) = &mut env_vars {
                            vars.insert("UV_PYTHON".to_string(), rt_path);
                        } else {
                            let mut vars = HashMap::new();
                            vars.insert("UV_PYTHON".to_string(), rt_path);
                            env_vars = Some(vars);
                        }
                    } else if command == "python"
                        || command == "python3"
                        || command == "node"
                        || command == "npm"
                    {
                        // For generic python/node commands, replace with the specific runtime path
                        command = rt_path;
                    }
                }
            }

            // If command is still generic and we haven't set a specific runtime (or we want to fallback), try auto-detection
            if (command == "python" || command == "python3" || command == "uv")
                && env_vars.as_ref().and_then(|v| v.get("UV_PYTHON")).is_none()
            {
                // Try to use bundled Python runtime
                let config = AddonIndex::default();

                let mut runtime = None;
                let installed = PythonRuntime::list_installed(app).unwrap_or_default();
                for full_version in config.addons.python.versions.iter().rev() {
                    if installed.contains_key(full_version) {
                        if let Ok(rt) = PythonRuntime::detect(app, full_version) {
                            runtime = Some(rt);
                            break;
                        }
                    }
                }

                if let Some(rt) = runtime {
                    if command == "python" || command == "python3" {
                        command = rt.python_path.to_string_lossy().to_string();
                    } else if command == "uv" {
                        command = rt.uv_path.to_string_lossy().to_string();

                        // Set UV_PYTHON environment variable so uv uses our bundled python
                        let python_path = rt.python_path.to_string_lossy().to_string();
                        if let Some(vars) = &mut env_vars {
                            vars.insert("UV_PYTHON".to_string(), python_path);
                        } else {
                            let mut vars = HashMap::new();
                            vars.insert("UV_PYTHON".to_string(), python_path);
                            env_vars = Some(vars);
                        }
                    }
                }
            }

            // Set UV_CACHE_DIR for isolation if command is uv or if we've already set UV_PYTHON (likely uv usage)
            if command.ends_with("uv")
                || command.ends_with("uv.exe")
                || env_vars.as_ref().and_then(|v| v.get("UV_PYTHON")).is_some()
            {
                if let Ok(cache_dir) = app.path().app_cache_dir() {
                    let uv_cache = cache_dir.join("uv_cache");
                    let _ = std::fs::create_dir_all(&uv_cache);
                    let uv_cache_str = uv_cache.to_string_lossy().to_string();

                    if let Some(vars) = &mut env_vars {
                        vars.insert("UV_CACHE_DIR".to_string(), uv_cache_str);
                    } else {
                        let mut vars = HashMap::new();
                        vars.insert("UV_CACHE_DIR".to_string(), uv_cache_str);
                        env_vars = Some(vars);
                    }
                }
            }

            // Use environment variables
            let transport = match StdioTransport::create_with_server_launch(
                &command,
                args.clone(),
                env_vars,
                TransportOptions::default(),
            ) {
                Ok(t) => t,
                Err(e) => {
                    let err_msg = format!(
                        "Failed to create stdio transport for command '{}' with args {:?}: {}",
                        command, args, e
                    );
                    eprintln!("{}", err_msg);
                    return Err(AppError::Generic(err_msg));
                }
            };

            client_runtime::create_client(client_details, transport, handler)
        };

        // Start the client
        if let Err(e) = client.clone().start().await {
            let err_msg = format!("Failed to start MCP client for {}: {}", url, e);
            eprintln!("{}", err_msg);
            return Err(AppError::Generic(err_msg));
        }

        Ok(client)
    }

    /// Test MCP connection and fetch tools
    pub async fn test_connection_and_fetch_tools(
        app: &AppHandle,
        url: String,
        r#type: String,
        headers: Option<String>,
        env_vars_json: Option<String>,
        runtime_path: Option<String>,
    ) -> Result<Vec<MCPTool>, AppError> {
        let client = Self::create_and_start_client(
            app,
            url.clone(),
            r#type,
            headers,
            env_vars_json,
            runtime_path,
        )
        .await?;

        // List tools from the server
        let tools_result = match client.list_tools(None).await {
            Ok(r) => r,
            Err(e) => {
                let err_msg = format!(
                    "Failed to list tools from MCP server {}: {}",
                    url.clone(),
                    e
                );
                eprintln!("{}", err_msg);
                return Err(AppError::Generic(err_msg));
            }
        };

        // Convert tools to our MCPTool format
        let tools: Vec<MCPTool> = tools_result
            .tools
            .into_iter()
            .map(|tool| {
                // Serialize input_schema to JSON string
                let input_schema = serde_json::to_string(&tool.input_schema).ok();
                MCPTool {
                    name: tool.name,
                    description: tool.description,
                    input_schema,
                }
            })
            .collect();

        // Clean up - shut down the client connection
        client
            .shut_down()
            .await
            .map_err(|e| AppError::Generic(format!("Failed to close connection: {e}")))?;

        Ok(tools)
    }

    /// Call a tool using MCP client
    pub async fn call_tool(
        app: &AppHandle,
        url: String,
        r#type: String,
        headers: Option<String>,
        env_vars_json: Option<String>,
        tool_name: String,
        arguments: serde_json::Value,
        runtime_path: Option<String>,
    ) -> Result<String, AppError> {
        let client = Self::create_and_start_client(
            app,
            url.clone(),
            r#type,
            headers,
            env_vars_json,
            runtime_path,
        )
        .await?;

        // Call the tool
        // Convert arguments from Value to Map if it's an object
        let arguments_map = match arguments {
            serde_json::Value::Object(map) => Some(map),
            _ => None,
        };
        let params = CallToolRequestParams {
            name: tool_name.clone(),
            arguments: arguments_map,
        };
        let result = match client.call_tool(params).await {
            Ok(r) => r,
            Err(e) => {
                let err_msg = format!(
                    "Failed to call tool {} on MCP server {}: {}",
                    tool_name.clone(),
                    url.clone(),
                    e
                );
                eprintln!("{}", err_msg);
                return Err(AppError::Generic(err_msg));
            }
        };

        // Serialize result to JSON string
        let result_json = serde_json::to_string(&result.content)
            .map_err(|e| AppError::Generic(format!("Failed to serialize result: {e}")))?;

        // Clean up - shut down the client connection
        let _ = client.shut_down().await;

        Ok(result_json)
    }
}
