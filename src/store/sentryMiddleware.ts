/**
 * Redux middleware for Sentry integration
 * Tracks Redux actions as breadcrumbs and monitors performance
 */

import * as Sentry from '@sentry/react';
import { Middleware } from '@reduxjs/toolkit';

// Actions that should not be tracked (too noisy or contain sensitive data)
const IGNORED_ACTIONS = [
  // Streaming actions (too frequent)
  'messages/appendToMessage',
  'messages/appendToThinking',

  // UI state changes (too frequent)
  'ui/setLoading',
  'ui/setTheme',

  // Sensitive data
  'llmConnections/setApiKey',
];

// Actions that indicate errors
const ERROR_ACTIONS = [
  'messages/setStreamingError',
  'notification/showError',
  'llmConnections/testConnectionFailure',
  'mcpConnections/connectionError',
];

// Actions that should be tracked with high priority
const CRITICAL_ACTIONS = [
  'messages/sendMessage',
  'chats/createChat',
  'workspaces/createWorkspace',
  'llmConnections/createConnection',
  'mcpConnections/createConnection',
];

/**
 * Sanitize action payload to remove sensitive data
 */
function sanitizePayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const sanitized = { ...payload } as Record<string, unknown>;

  // Remove sensitive fields
  const sensitiveFields = [
    'apiKey',
    'api_key',
    'password',
    'token',
    'secret',
    'authorization',
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Redux middleware for Sentry tracking
 */
export const sentryMiddleware: Middleware = () => (next) => (action) => {
  // Check if action should be ignored
  if (IGNORED_ACTIONS.some((ignored) => action.type.includes(ignored))) {
    return next(action);
  }

  // Track action as breadcrumb
  const isError = ERROR_ACTIONS.some((error) => action.type.includes(error));
  const isCritical = CRITICAL_ACTIONS.some((critical) =>
    action.type.includes(critical)
  );

  Sentry.addBreadcrumb({
    category: 'redux.action',
    message: action.type,
    level: isError ? 'error' : isCritical ? 'info' : 'debug',
    data: {
      payload: sanitizePayload(action.payload),
      timestamp: Date.now(),
    },
  });

  // For critical actions, add tags
  if (isCritical) {
    Sentry.setTag('last_critical_action', action.type);
  }

  // For error actions, capture as Sentry event
  if (isError && action.payload) {
    Sentry.captureMessage(`Redux Error: ${action.type}`, {
      level: 'error',
      extra: {
        payload: sanitizePayload(action.payload),
      },
    });
  }

  // Execute action
  const startTime = performance.now();
  const result = next(action);
  const duration = performance.now() - startTime;

  // Track slow actions (> 100ms)
  if (duration > 100) {
    Sentry.addBreadcrumb({
      category: 'redux.performance',
      message: `Slow action: ${action.type}`,
      level: 'warning',
      data: {
        duration: `${duration.toFixed(2)}ms`,
      },
    });
  }

  return result;
};
