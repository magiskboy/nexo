use tauri::Manager;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter, Layer};

pub fn init_logging(app_handle: &tauri::AppHandle) -> Result<(), anyhow::Error> {
    let log_dir = app_handle.path().app_log_dir()?;

    // Tạo thư mục log nếu chưa tồn tại
    if !log_dir.exists() {
        std::fs::create_dir_all(&log_dir)?;
    }

    // Console layer - pretty trong dev, compact trong prod
    let console_layer = fmt::layer()
        .with_target(true)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true);

    // File layer - rotating logs (app.log)
    let file_appender = tracing_appender::rolling::daily(&log_dir, "app.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);
    // Lưu ý: _guard cần được giữ lại để logging hoạt động, nhưng ở đây chúng ta init global subscriber
    // nên việc drop guard sẽ làm mất log file logging.
    // Tuy nhiên, tracing_subscriber::init() set global default.
    // Vấn đề là _guard của non_blocking appender cần sống suốt đời app.
    // Ta cần return guard hoặc leak nó. Leak là giải pháp đơn giản cho app sống lâu.
    let _ = Box::leak(Box::new(_guard));

    let file_layer = fmt::layer().with_writer(non_blocking).json(); // JSON format cho dễ parse

    // Error-only file (error.log)
    let error_appender = tracing_appender::rolling::daily(&log_dir, "error.log");
    let (error_non_blocking, _error_guard) = tracing_appender::non_blocking(error_appender);
    let _ = Box::leak(Box::new(_error_guard));

    let error_layer = fmt::layer()
        .with_writer(error_non_blocking)
        .json()
        .with_filter(EnvFilter::new("error"));

    // Frontend-only file layer (frontend.log)
    let frontend_appender = tracing_appender::rolling::daily(&log_dir, "frontend.log");
    let (frontend_non_blocking, _frontend_guard) =
        tracing_appender::non_blocking(frontend_appender);
    let _ = Box::leak(Box::new(_frontend_guard));

    let frontend_layer = fmt::layer()
        .with_writer(frontend_non_blocking)
        .json()
        .with_filter(EnvFilter::new("frontend")); // Only logs với target="frontend"

    // Sentry layer (only for WARN and ERROR)
    let sentry_layer = sentry_tracing::layer().with_filter(EnvFilter::new("warn"));

    // Environment filter
    // Default to "info" if RUST_LOG is not set
    let env_filter = EnvFilter::try_from_default_env().or_else(|_| {
        EnvFilter::try_new(if cfg!(debug_assertions) {
            "debug"
        } else {
            "info"
        })
    })?;

    // Combine all layers
    tracing_subscriber::registry()
        .with(env_filter)
        .with(console_layer)
        .with(file_layer)
        .with(error_layer)
        .with(frontend_layer)
        .with(sentry_layer)
        .init();

    Ok(())
}
