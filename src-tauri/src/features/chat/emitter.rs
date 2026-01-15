use crate::constants::TauriEvents;
use crate::error::AppError;
use crate::events::ChatUpdatedEvent;
use tauri::{AppHandle, Emitter};

pub struct ChatEmitter {
    app: AppHandle,
}

impl ChatEmitter {
    pub const fn new(app: AppHandle) -> Self {
        Self { app }
    }

    pub fn emit_chat_updated(&self, chat_id: String, title: String) -> Result<(), AppError> {
        self.app
            .emit(
                TauriEvents::CHAT_UPDATED,
                ChatUpdatedEvent { chat_id, title },
            )
            .map_err(|e| AppError::Generic(format!("Failed to emit chat-updated event: {e}")))
    }
}
