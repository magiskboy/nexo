import { useEffect } from 'react';
import { useAppSelector } from '@/app/hooks';
import { logger } from '@/lib/logger';

/**
 * Hook to automatically set logger context based on current workspace and chat.
 * Use this hook in components that need automatic context tracking.
 *
 * For logging, import `logger` directly from '@/lib/logger' instead of using this hook.
 *
 * @example
 * ```tsx
 * import { logger } from '@/lib/logger';
 * import { useLoggerContext } from '@/hooks/useLogger';
 *
 * function MyComponent() {
 *   useLoggerContext(); // Auto-set context
 *
 *   const handleClick = () => {
 *     logger.info('Button clicked'); // Use logger directly
 *   };
 * }
 * ```
 */
export function useLoggerContext() {
  const workspaceId = useAppSelector(
    (state) => state.workspaces?.selectedWorkspaceId ?? null
  );
  const chatId = useAppSelector((state) => state.chats?.selectedChatId ?? null);

  useEffect(() => {
    logger.setContext({
      workspaceId: workspaceId || undefined,
      chatId: chatId || undefined,
    });

    return () => {
      // Optional: clear context on unmount if needed
      // logger.clearContext();
    };
  }, [workspaceId, chatId]);
}

/**
 * @deprecated Use `logger` from '@/lib/logger' directly and `useLoggerContext()` for context.
 * This hook is kept for backward compatibility but will be removed in the future.
 */
export function useLogger() {
  useLoggerContext();
  return logger;
}
