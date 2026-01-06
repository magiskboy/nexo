/**
 * Sentry utility functions for frontend tracking
 * Provides consistent patterns for tracking user actions and performance
 */

import * as Sentry from '@sentry/react';

/**
 * Track a user action with context
 */
export function trackUserAction(
  action: string,
  category: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category: `user.${category}`,
    message: action,
    level: 'info',
    data: {
      ...data,
      timestamp: Date.now(),
    },
  });
}

/**
 * Track workspace context
 */
export function setWorkspaceContext(
  workspaceId: string,
  workspaceName?: string
) {
  Sentry.setTag('workspace.id', workspaceId);
  if (workspaceName) {
    Sentry.setContext('workspace', {
      id: workspaceId,
      name: workspaceName,
    });
  }
}

/**
 * Track chat context
 */
export function setChatContext(chatId: string, chatTitle?: string) {
  Sentry.setTag('chat.id', chatId);
  if (chatTitle) {
    Sentry.setContext('chat', {
      id: chatId,
      title: chatTitle,
    });
  }
}

/**
 * Track LLM provider context
 */
export function setLLMContext(provider: string, model: string) {
  Sentry.setTag('llm.provider', provider);
  Sentry.setTag('llm.model', model);
  Sentry.setContext('llm', {
    provider,
    model,
  });
}

/**
 * Track API call performance
 */
export function trackAPICall(
  endpoint: string,
  method: string,
  duration: number,
  success: boolean,
  statusCode?: number
) {
  Sentry.addBreadcrumb({
    category: 'api',
    message: `${method} ${endpoint}`,
    level: success ? 'info' : 'error',
    data: {
      method,
      endpoint,
      duration,
      success,
      statusCode,
    },
  });

  // Track slow API calls
  if (duration > 3000) {
    Sentry.captureMessage(`Slow API call: ${method} ${endpoint}`, {
      level: 'warning',
      extra: {
        duration,
        endpoint,
        method,
      },
    });
  }
}

/**
 * Track message send operation
 */
export function trackMessageSend(
  chatId: string,
  messageLength: number,
  hasAttachments: boolean
) {
  trackUserAction('Send message', 'chat', {
    chatId,
    messageLength,
    hasAttachments,
  });

  // Track long messages
  if (messageLength > 5000) {
    Sentry.addBreadcrumb({
      category: 'chat.message',
      message: 'Long message sent',
      level: 'info',
      data: {
        messageLength,
      },
    });
  }
}

/**
 * Track streaming performance
 */
export function trackStreamingPerformance(
  chatId: string,
  totalDuration: number,
  chunkCount: number,
  tokenCount?: number
) {
  Sentry.addBreadcrumb({
    category: 'chat.streaming',
    message: 'Streaming completed',
    level: 'info',
    data: {
      chatId,
      totalDuration,
      chunkCount,
      tokenCount,
      avgChunkTime: totalDuration / chunkCount,
    },
  });

  // Track slow streaming
  if (totalDuration > 30000) {
    Sentry.captureMessage('Slow streaming response', {
      level: 'warning',
      extra: {
        chatId,
        totalDuration,
        chunkCount,
      },
    });
  }
}

/**
 * Track tool execution
 */
export function trackToolExecution(
  toolName: string,
  duration: number,
  success: boolean,
  error?: string
) {
  Sentry.addBreadcrumb({
    category: 'mcp.tool',
    message: `Tool: ${toolName}`,
    level: success ? 'info' : 'error',
    data: {
      toolName,
      duration,
      success,
      error,
    },
  });

  if (!success && error) {
    Sentry.captureMessage(`Tool execution failed: ${toolName}`, {
      level: 'error',
      extra: {
        toolName,
        error,
        duration,
      },
    });
  }
}

/**
 * Track workspace operations
 */
export function trackWorkspaceOperation(
  operation: 'create' | 'update' | 'delete' | 'switch',
  workspaceId: string
) {
  trackUserAction(`Workspace ${operation}`, 'workspace', {
    workspaceId,
    operation,
  });
}

/**
 * Track connection operations
 */
export function trackConnectionOperation(
  type: 'llm' | 'mcp',
  operation: 'create' | 'update' | 'delete' | 'test',
  connectionId: string,
  success: boolean,
  error?: string
) {
  trackUserAction(
    `${type.toUpperCase()} connection ${operation}`,
    'connection',
    {
      type,
      operation,
      connectionId,
      success,
      error,
    }
  );

  if (!success && error) {
    Sentry.captureMessage(`Connection ${operation} failed`, {
      level: 'error',
      extra: {
        type,
        operation,
        connectionId,
        error,
      },
    });
  }
}

/**
 * Track component render performance
 */
export function trackComponentPerformance(
  componentName: string,
  renderTime: number,
  props?: Record<string, unknown>
) {
  // Only track slow renders
  if (renderTime > 100) {
    Sentry.addBreadcrumb({
      category: 'ui.performance',
      message: `Slow render: ${componentName}`,
      level: 'warning',
      data: {
        componentName,
        renderTime,
        props,
      },
    });
  }
}

/**
 * Track navigation
 */
export function trackNavigation(from: string, to: string) {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigate: ${from} → ${to}`,
    level: 'info',
    data: {
      from,
      to,
    },
  });
}

/**
 * Track file operations
 */
export function trackFileOperation(
  operation: 'upload' | 'download' | 'delete',
  fileType: string,
  fileSize?: number
) {
  trackUserAction(`File ${operation}`, 'file', {
    operation,
    fileType,
    fileSize,
  });
}

/**
 * Track agent operations
 */
export function trackAgentOperation(
  operation: 'install' | 'uninstall' | 'execute',
  agentId: string,
  success: boolean,
  error?: string
) {
  trackUserAction(`Agent ${operation}`, 'agent', {
    operation,
    agentId,
    success,
    error,
  });

  if (!success && error) {
    Sentry.captureMessage(`Agent ${operation} failed`, {
      level: 'error',
      extra: {
        operation,
        agentId,
        error,
      },
    });
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
  Sentry.setTag('workspace.id', '');
  Sentry.setTag('chat.id', '');
}

/**
 * Track error with context
 */
export function trackError(
  error: Error,
  context: {
    component?: string;
    action?: string;
    extra?: Record<string, unknown>;
  }
) {
  Sentry.withScope((scope) => {
    if (context.component) {
      scope.setTag('component', context.component);
    }
    if (context.action) {
      scope.setTag('action', context.action);
    }
    if (context.extra) {
      scope.setContext('error_context', context.extra);
    }
    Sentry.captureException(error);
  });
}
