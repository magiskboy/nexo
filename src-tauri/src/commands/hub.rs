use crate::error::AppError;
use crate::models::{
    HubMCPServer, HubPrompt, MCPServerConnection, ParsedPromptTemplate, Prompt,
};
use crate::services::{HubService, MCPConfigService, PromptTemplateService};
use crate::state::AppState;
use serde::Deserialize;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;

#[derive(Deserialize)]
pub struct InstallPromptFromHubPayload {
    #[serde(rename = "promptId")]
    pub prompt_id: String,
    pub name: String,
    pub path: String,
}

#[derive(Deserialize)]
pub struct InstallMCPServerFromHubPayload {
    #[serde(rename = "serverId")]
    pub server_id: String,
    pub name: String,
    pub server_type: String,
    pub config: crate::models::HubMCPServerConfig,
    pub variables: HashMap<String, String>,
}

#[tauri::command]
pub async fn fetch_hub_prompts() -> Result<Vec<HubPrompt>, AppError> {
    let hub_service = Arc::new(HubService::new());
    hub_service.get_prompts().await
}

#[tauri::command]
pub async fn fetch_prompt_template(
    path: String,
) -> Result<ParsedPromptTemplate, AppError> {
    let template_service = Arc::new(PromptTemplateService::new());
    
    // Fetch markdown from GitHub
    let markdown = template_service.fetch_prompt_template(&path).await?;
    
    // Parse markdown to extract title, description, content, and variables
    template_service.parse_markdown_template(&markdown)
}

#[tauri::command]
pub async fn install_prompt_from_hub(
    payload: InstallPromptFromHubPayload,
    state: State<'_, AppState>,
) -> Result<Prompt, AppError> {
    let template_service = Arc::new(PromptTemplateService::new());
    
    // Fetch and parse template
    let markdown = template_service.fetch_prompt_template(&payload.path).await?;
    let parsed = template_service.parse_markdown_template(&markdown)?;
    
    // Keep content with variables intact (variables will be filled when used in chat)
    let content = parsed.content;
    
    // Create prompt with hub id
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    
    let prompt = Prompt {
        id: payload.prompt_id,
        name: payload.name,
        content,
        created_at: now,
        updated_at: now,
    };
    
    // Save to database
    state
        .prompt_service
        .create(prompt.id.clone(), prompt.name.clone(), prompt.content.clone())
        .map_err(|e| AppError::Prompt(e.to_string()))?;
    
    Ok(prompt)
}

#[tauri::command]
pub async fn fetch_hub_mcp_servers() -> Result<Vec<HubMCPServer>, AppError> {
    let hub_service = Arc::new(HubService::new());
    hub_service.get_mcp_servers().await
}

#[tauri::command]
pub async fn refresh_hub_index() -> Result<(), AppError> {
    let hub_service = Arc::new(HubService::new());
    hub_service.refresh_index().await?;
    Ok(())
}

#[tauri::command]
pub async fn install_mcp_server_from_hub(
    payload: InstallMCPServerFromHubPayload,
    state: State<'_, AppState>,
) -> Result<MCPServerConnection, AppError> {
    let config_service = Arc::new(MCPConfigService::new());

    // Replace variables in config
    let config_with_vars = config_service
        .replace_variables_in_config(&payload.config, &payload.variables)?;

    // Build MCP connection config
    let (url, headers, runtime_path) = config_service
        .build_mcp_connection_config(&config_with_vars, &payload.server_type)?;

    // Create MCP connection
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let connection = MCPServerConnection {
        id: payload.server_id,
        name: payload.name,
        url,
        r#type: payload.server_type,
        headers,
        runtime_path,
        status: "disconnected".to_string(),
        tools_json: None,
        error_message: None,
        created_at: now,
        updated_at: now,
    };

    // Save to database
    state
        .mcp_connection_service
        .create(
            connection.id.clone(),
            connection.name.clone(),
            connection.url.clone(),
            connection.r#type.clone(),
            connection.headers.clone(),
            connection.runtime_path.clone(),
        )
        .map_err(|e| AppError::Mcp(e.to_string()))?;

    Ok(connection)
}
