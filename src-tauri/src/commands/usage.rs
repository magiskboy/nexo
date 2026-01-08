use crate::error::AppError;
use crate::models::usage::{UsageChartPoint, UsageFilter, UsageStat, UsageSummary};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_usage_summary(
    filter: UsageFilter,
    state: State<'_, AppState>,
) -> Result<UsageSummary, AppError> {
    state
        .usage_service
        .get_summary(filter)
        .map_err(|e| AppError::Generic(e.to_string()))
}

#[tauri::command]
pub fn get_usage_chart(
    filter: UsageFilter,
    interval: String,
    state: State<'_, AppState>,
) -> Result<Vec<UsageChartPoint>, AppError> {
    state
        .usage_service
        .get_chart_data(filter, &interval)
        .map_err(|e| AppError::Generic(e.to_string()))
}

#[tauri::command]
pub fn get_usage_logs(
    filter: UsageFilter,
    page: u32,
    limit: u32,
    state: State<'_, AppState>,
) -> Result<Vec<UsageStat>, AppError> {
    state
        .usage_service
        .get_logs(filter, page, limit)
        .map_err(|e| AppError::Generic(e.to_string()))
}

#[tauri::command]
pub fn clear_usage(state: State<'_, AppState>) -> Result<(), AppError> {
    state
        .usage_service
        .clear_usage()
        .map_err(|e| AppError::Generic(e.to_string()))
}
