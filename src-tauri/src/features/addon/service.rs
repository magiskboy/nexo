use crate::features::addon::models::AddonIndex;

/// Service to manage addon configuration
/// Returns hardcoded default configuration
pub struct IndexConfigService;

impl IndexConfigService {
    pub const fn new() -> Self {
        Self
    }

    /// Get addon config (returns default hardcoded values)
    pub fn get_config(&self) -> AddonIndex {
        AddonIndex::default()
    }
}

impl Default for IndexConfigService {
    fn default() -> Self {
        Self::new()
    }
}
