use serde::Serializer;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("[Database] {0}")]
    Database(#[from] rusqlite::Error),

    #[error("[Not Found] {0}")]
    NotFound(String),

    #[error("[Validation] {0}")]
    Validation(String),

    #[error("[IO] {0}")]
    Io(#[from] std::io::Error),

    #[error("[Serialization] {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("[Tauri] {0}")]
    Tauri(#[from] tauri::Error),

    #[error("[Network] {0}")]
    Http(#[from] reqwest::Error),

    #[error("[LLM] {0}")]
    Llm(String),

    #[error("[Python] {0}")]
    Python(String),

    #[error("[Node] {0}")]
    Node(String),

    #[error("[MCP] {0}")]
    Mcp(String),

    #[error("[Zip] {0}")]
    Zip(#[from] zip::result::ZipError),

    #[error("[Addon] {0}")]
    Addon(String),

    #[error("[Prompt] {0}")]
    Prompt(String),

    #[error("[Error] {0}")]
    Generic(String),
}

// Manual Serialize implementation to ensure Tauri receives a proper JSON error object
// or just a string. Tauri commands usually expect the error to be serializable.
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_str())
    }
}
