use crate::error::AppError;
use crate::features::hub::models::HubMCPServerConfig;
use regex::Regex;
use std::collections::HashMap;

/// Service to parse and process MCP server configuration from hub
pub struct MCPConfigService;

impl MCPConfigService {
    pub fn new() -> Self {
        Self
    }

    /// Replace variables in config with provided values
    /// If a variable is not provided, convert {variable_name} to {{variable_name}} format
    /// so users know they need to edit it
    pub fn replace_variables_in_config(
        &self,
        config: &HubMCPServerConfig,
        variables: &HashMap<String, String>,
    ) -> Result<HubMCPServerConfig, AppError> {
        let mut new_config = config.clone();
        let variable_regex = Regex::new(r"\{(\w+)\}")
            .map_err(|e| AppError::Hub(format!("Failed to compile variable regex: {e}")))?;

        // Helper function to process a string: replace provided variables, convert others to {{...}} format
        let process_string = |text: &str| -> String {
            // Use regex to find all variables and process them
            variable_regex
                .replace_all(text, |caps: &regex::Captures| {
                    if let Some(var_name_match) = caps.get(1) {
                        let var_name = var_name_match.as_str();
                        // If variable is provided, replace it with the value
                        if let Some(value) = variables.get(var_name) {
                            value.clone()
                        } else {
                            // Otherwise, convert to {{variable_name}} format
                            format!("{{{{{var_name}}}}}")
                        }
                    } else {
                        // Should not happen, but return original match if it does
                        caps.get(0)
                            .map(|m| m.as_str().to_string())
                            .unwrap_or_default()
                    }
                })
                .to_string()
        };

        // Replace in args
        if let Some(args) = &new_config.args {
            let mut new_args = Vec::new();
            for arg in args {
                new_args.push(process_string(arg));
            }
            new_config.args = Some(new_args);
        }

        // Replace in env
        if let Some(env) = &new_config.env {
            if let Some(env_map) = env.as_object() {
                let mut new_env = serde_json::Map::new();
                for (key, value) in env_map {
                    let mut new_value = value.clone();
                    if let Some(value_str) = value.as_str() {
                        new_value = serde_json::Value::String(process_string(value_str));
                    }
                    new_env.insert(key.clone(), new_value);
                }
                new_config.env = Some(serde_json::Value::Object(new_env));
            }
        }

        // Replace in headers
        if let Some(headers) = &new_config.headers {
            if let Some(headers_map) = headers.as_object() {
                let mut new_headers = serde_json::Map::new();
                for (key, value) in headers_map {
                    let mut new_value = value.clone();
                    if let Some(value_str) = value.as_str() {
                        new_value = serde_json::Value::String(process_string(value_str));
                    }
                    new_headers.insert(key.clone(), new_value);
                }
                new_config.headers = Some(serde_json::Value::Object(new_headers));
            }
        }

        // Replace in command
        if let Some(command) = &new_config.command {
            new_config.command = Some(process_string(command));
        }

        // Replace in url
        if let Some(url) = &new_config.url {
            new_config.url = Some(process_string(url));
        }

        Ok(new_config)
    }

    /// Build MCP connection config from hub config
    /// Converts hub config format to MCPServerConnection format
    /// Returns (url, headers, env_vars, runtime_path)
    pub fn build_mcp_connection_config(
        &self,
        config: &HubMCPServerConfig,
        server_type: &str,
    ) -> Result<(String, String, Option<String>, Option<String>), AppError> {
        match server_type {
            "stdio" => {
                // For stdio: combine command + args into url
                let mut url_parts = Vec::new();

                if let Some(command) = &config.command {
                    url_parts.push(command.clone());
                }

                if let Some(args) = &config.args {
                    url_parts.extend(args.clone());
                }

                let url = url_parts.join(" ");

                // Convert env to JSON string for env_vars
                let env_vars = if let Some(env) = &config.env {
                    Some(serde_json::to_string(env).map_err(|e| {
                        AppError::Hub(format!("Failed to serialize env to JSON: {e}"))
                    })?)
                } else {
                    None
                };

                // Headers are empty for stdio
                Ok((url, "{}".to_string(), env_vars, None))
            }
            "sse" | "http-streamable" | "streamable-http" => {
                // For sse/http-streamable: url is direct, headers is JSON string
                let url = config.url.clone().ok_or_else(|| {
                    AppError::Hub(format!(
                        "Missing 'url' in {} MCP server config",
                        server_type
                    ))
                })?;

                let headers = if let Some(headers_obj) = &config.headers {
                    serde_json::to_string(headers_obj).map_err(|e| {
                        AppError::Hub(format!("Failed to serialize headers to JSON: {e}"))
                    })?
                } else {
                    "{}".to_string()
                };

                Ok((url, headers, None, None))
            }
            _ => Err(AppError::Hub(format!(
                "Unsupported MCP server type: {server_type}"
            ))),
        }
    }
}

impl Default for MCPConfigService {
    fn default() -> Self {
        Self::new()
    }
}
