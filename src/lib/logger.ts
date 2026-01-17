/* eslint-disable no-console */
import * as Sentry from '@sentry/react';

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

interface LogContext {
  workspaceId?: string;
  chatId?: string;
  userId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private context: LogContext = {};
  private level: LogLevel = import.meta.env.DEV
    ? LogLevel.DEBUG
    : LogLevel.INFO;

  // Batch logs và gửi xuống backend
  private logBuffer: Array<{
    timestamp: string;
    level: string;
    message: string;
    context: LogContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
  }> = [];
  private flushTimer?: number;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setContext(context: Partial<LogContext>) {
    this.context = { ...this.context, ...context };
  }

  clearContext() {
    this.context = {};
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sanitize(data: any): any {
    // Remove sensitive fields
    const sensitive = ['apiKey', 'api_key', 'password', 'token', 'secret'];
    if (typeof data === 'object' && data !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sanitized = { ...(data as any) };
      for (const key of sensitive) {
        if (key in sanitized) {
          sanitized[key] = '[REDACTED]';
        }
      }
      return sanitized;
    }
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async persistLog(logData: any) {
    // Chỉ persist từ INFO level trở lên trong production
    const shouldPersist = import.meta.env.PROD
      ? logData.level !== 'TRACE' && logData.level !== 'DEBUG'
      : true;

    if (!shouldPersist) return;

    this.logBuffer.push(logData);

    // Flush nếu buffer đầy
    if (this.logBuffer.length >= this.BATCH_SIZE) {
      await this.flush();
    } else {
      // Schedule flush sau FLUSH_INTERVAL
      if (this.flushTimer) {
        window.clearTimeout(this.flushTimer);
      }
      this.flushTimer = window.setTimeout(
        () => this.flush(),
        this.FLUSH_INTERVAL
      );
    }
  }

  private async flush() {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Sử dụng dynamic import để tránh lỗi SSR hoặc test env nếu không có tauri
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('write_frontend_logs', { logs: logsToSend });
    } catch (error) {
      // Fallback to console nếu Tauri command fails
      if (import.meta.env.DEV) {
        console.error('Failed to persist logs:', error);
      }
    }
  }

  // Expose flush method để có thể gọi manually (e.g., trước khi app close)
  async flushLogs() {
    await this.flush();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private log(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level: LogLevel[level],
      message,
      context: this.context,
      data: data ? this.sanitize(data) : undefined,
    };

    // Console output
    const consoleMethod = this.getConsoleMethod(level);
    if (import.meta.env.DEV) {
      consoleMethod(`[${LogLevel[level]}] ${message}`, logData);
    } else {
      // In prod, maybe don't log everything to console to avoid noise, but for now stick to proposal

      consoleMethod(JSON.stringify(logData));
    }

    // Sentry breadcrumb
    if (level >= LogLevel.WARN) {
      Sentry.addBreadcrumb({
        message,
        level: level === LogLevel.WARN ? 'warning' : 'error',
        data: logData,
      });
    }

    // Capture error in Sentry
    if (level === LogLevel.ERROR) {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: logData,
      });
    }

    // Persist to file via Tauri IPC (async, non-blocking)
    this.persistLog(logData);
  }

  private getConsoleMethod(level: LogLevel) {
    switch (level) {
      case LogLevel.ERROR:
        return console.error;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.INFO:
        return console.info;
      default:
        return console.log;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trace(message: string, data?: any) {
    this.log(LogLevel.TRACE, message, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data);
  }
}

export const logger = Logger.getInstance();

// Flush logs trước khi window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    logger.flushLogs();
  });
}
