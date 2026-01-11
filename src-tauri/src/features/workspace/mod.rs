pub mod management;
pub mod settings;
use std::sync::Arc;

pub struct WorkspaceFeature {
    pub service: Arc<management::WorkspaceService>,
    pub settings_service: Arc<settings::WorkspaceSettingsService>,
}

impl WorkspaceFeature {
    pub fn new(
        service: Arc<management::WorkspaceService>,
        settings_service: Arc<settings::WorkspaceSettingsService>,
    ) -> Self {
        Self {
            service,
            settings_service,
        }
    }
}
