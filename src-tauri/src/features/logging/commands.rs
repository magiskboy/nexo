use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrontendLogEntry {
    pub timestamp: String,
    pub level: String,
    pub message: String,
    pub context: Option<serde_json::Value>,
    pub data: Option<serde_json::Value>,
}

/// Write frontend logs to file
/// Frontend gửi batch logs để reduce IPC overhead
#[tauri::command]
pub async fn write_frontend_logs(logs: Vec<FrontendLogEntry>) -> Result<(), String> {
    for log in logs {
        match log.level.as_str() {
            "TRACE" => tracing::trace!(
                target: "frontend",
                timestamp = %log.timestamp,
                context = ?log.context,
                data = ?log.data,
                "{}", log.message
            ),
            "DEBUG" => tracing::debug!(
                target: "frontend",
                timestamp = %log.timestamp,
                context = ?log.context,
                data = ?log.data,
                "{}", log.message
            ),
            "INFO" => tracing::info!(
                target: "frontend",
                timestamp = %log.timestamp,
                context = ?log.context,
                data = ?log.data,
                "{}", log.message
            ),
            "WARN" => tracing::warn!(
                target: "frontend",
                timestamp = %log.timestamp,
                context = ?log.context,
                data = ?log.data,
                "{}", log.message
            ),
            "ERROR" => tracing::error!(
                target: "frontend",
                timestamp = %log.timestamp,
                context = ?log.context,
                data = ?log.data,
                "{}", log.message
            ),
            _ => tracing::info!(
                target: "frontend",
                timestamp = %log.timestamp,
                context = ?log.context,
                data = ?log.data,
                "{}", log.message
            ),
        }
    }

    Ok(())
}
