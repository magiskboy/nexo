import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  stopStreaming,
  setStreamingError,
  clearStreamingError,
  setStreamingStartTime,
  clearStreamingStartTime,
} from '../state/messages';
import { showError } from '@/store/slices/notificationSlice';
import { useGetMessagesQuery } from '../state/messagesApi';

import { useTranslation } from 'react-i18next';
import { invokeCommand, TauriCommands } from '@/lib/tauri';

const STREAMING_TIMEOUT = 60000; // 60 seconds

/**
 * Hook to access and manage messages
 */
export function useMessages(selectedChatId: string | null) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation('chat');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // RTK Query for messages
  const { data: messages = [] } = useGetMessagesQuery(selectedChatId || '', {
    skip: !selectedChatId,
  });

  // Selectors for UI state (streaming status)
  const streamingMessageId = useAppSelector(
    (state) => state.messages.streamingMessageId
  );
  const streamingByChatId = useAppSelector(
    (state) => state.messages.streamingByChatId
  );
  const pausedStreaming = useAppSelector(
    (state) => state.messages.pausedStreaming
  );
  const streamingErrors = useAppSelector(
    (state) => state.messages.streamingErrors
  );
  const streamingStartTimes = useAppSelector(
    (state) => state.messages.streamingStartTimes
  );

  // Check if current chat is streaming
  const isStreaming = selectedChatId
    ? !!streamingByChatId[selectedChatId]
    : false;

  // Get streaming error for current chat
  const streamingError = selectedChatId
    ? streamingErrors[selectedChatId]
    : undefined;

  // Timeout mechanism for streaming
  useEffect(() => {
    if (!selectedChatId) return;

    const currentStreamingMessageId = streamingByChatId[selectedChatId];

    // If not streaming for this chat, return early
    if (!currentStreamingMessageId) {
      return;
    }

    const startTime = streamingStartTimes[selectedChatId];

    // Set initial start time if not already set (recovering state)
    if (!startTime) {
      dispatch(
        setStreamingStartTime({ chatId: selectedChatId, timestamp: Date.now() })
      );
      return;
    }

    // Timeout timer
    const timeoutId = setTimeout(() => {
      // Still streaming after timeout -> trigger error
      if (streamingByChatId[selectedChatId]) {
        // Show error notification
        dispatch(
          showError(
            t('streamingTimeout') || 'Streaming timeout. Please try again.'
          )
        );

        // Set streaming error state
        dispatch(
          setStreamingError({
            chatId: selectedChatId,
            messageId: currentStreamingMessageId,
            error: 'timeout',
            canRetry: true,
          })
        );

        // Stop streaming
        dispatch(stopStreaming(selectedChatId));

        // Clear start time
        dispatch(clearStreamingStartTime(selectedChatId));
      }
    }, STREAMING_TIMEOUT);

    // Cleanup on streaming complete or chat switch
    return () => {
      clearTimeout(timeoutId);
    };
  }, [selectedChatId, streamingByChatId, streamingStartTimes, dispatch, t]);

  // Separate effect for countdown display (runs every second)
  useEffect(() => {
    if (!selectedChatId) return;

    const startTime = streamingStartTimes[selectedChatId];
    const isCurrentlyStreaming = !!streamingByChatId[selectedChatId];

    if (!isCurrentlyStreaming || !startTime) return;

    // Update countdown
    const updateCountdown = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, STREAMING_TIMEOUT - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));
    };

    // Set initial value immediately
    updateCountdown();

    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [selectedChatId, streamingByChatId, streamingStartTimes]);

  // Clear error when chat changes or streaming starts again
  useEffect(() => {
    if (selectedChatId && streamingError && isStreaming) {
      dispatch(clearStreamingError(selectedChatId));
    }
  }, [selectedChatId, streamingError, isStreaming, dispatch]);

  // Check if streaming message is an agent card
  const isAgentStreaming =
    messages.some((m) => {
      if (m.id !== streamingByChatId[selectedChatId || '']) return false;
      if (!m.metadata) return false;
      try {
        const parsed = JSON.parse(m.metadata);
        return parsed.type === 'agent_card' && parsed.status === 'running';
      } catch {
        return false;
      }
    }) && isStreaming;

  // Handlers
  const handleStopStreaming = () => {
    if (selectedChatId) {
      dispatch(stopStreaming(selectedChatId));
      dispatch(clearStreamingStartTime(selectedChatId));
      setTimeLeft(null);

      // Cancel backend request
      invokeCommand(TauriCommands.CANCEL_MESSAGE, {
        chatId: selectedChatId,
      }).catch((error) => {
        console.error('[useMessages] CANCEL_MESSAGE failed:', error);
      });
    } else {
      dispatch(stopStreaming());
    }
  };

  const handleRetryStreaming = () => {
    if (selectedChatId && streamingError) {
      dispatch(clearStreamingError(selectedChatId));
      // Retry logic will be handled by user re-sending the message
    }
  };

  return {
    messages,
    streamingMessageId,
    streamingByChatId,
    pausedStreaming,
    isStreaming,
    isAgentStreaming,
    streamingError,
    timeLeft: isStreaming ? timeLeft : null,
    handleStopStreaming,
    handleRetryStreaming,
  };
}
