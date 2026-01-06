import { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { invokeCommand, TauriCommands } from '@/lib/tauri';
import { ScrollArea } from '@/ui/atoms/scroll-area';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { editAndResendMessage, addMessage } from '@/store/slices/messages';
import { removePermissionRequest } from '@/store/slices/toolPermissionSlice';
import { setLoading } from '@/store/slices/chatInputSlice';
import { showError } from '@/store/slices/notificationSlice';
import { setAgentChatHistoryDrawerOpen } from '@/store/slices/uiSlice';
import { MessageList } from '@/ui/organisms/chat/MessageList';
import type { Message } from '@/store/types';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  streamingMessageId: string | null;
}

export function ChatMessages({
  messages,
  isLoading,
  streamingMessageId,
}: ChatMessagesProps) {
  const { t } = useTranslation('chat');
  const { userMode } = useAppSettings();
  const dispatch = useAppDispatch();
  const selectedChatId = useAppSelector((state) => state.chats.selectedChatId);
  const pendingRequests = useAppSelector(
    (state) => state.toolPermission.pendingRequests
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Track if user is at the bottom of the chat to handle auto-scrolling
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastSelectedChatIdRef = useRef<string | null>(selectedChatId);

  const scrollToBottom = useCallback((instant = false) => {
    if (messagesEndRef.current && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        '[data-slot="scroll-area-viewport"]'
      ) as HTMLElement;

      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: instant ? 'auto' : 'smooth',
        });
        return;
      }

      messagesEndRef.current.scrollIntoView({
        behavior: instant ? 'auto' : 'smooth',
      });
    }
  }, []);

  // Intersection Observer to detect if user is at bottom
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const viewport = scrollArea.querySelector(
      '[data-slot="scroll-area-viewport"]'
    );

    if (!viewport || !messagesEndRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
      },
      {
        root: viewport,
        threshold: 0,
        rootMargin: '100px', // Allow 100px tolerance
      }
    );

    observer.observe(messagesEndRef.current);

    return () => observer.disconnect();
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    // 1. Handle Chat Switch
    if (
      selectedChatId !== lastSelectedChatIdRef.current &&
      selectedChatId !== null
    ) {
      lastSelectedChatIdRef.current = selectedChatId;
      // Force instant scroll when switching chats
      // Small timeout to ensure content renders
      setTimeout(() => scrollToBottom(true), 50);
      return;
    }

    // 2. Handle Messages Update / Streaming
    const lastMessage = messages[messages.length - 1];

    // If I sent the message, always scroll
    if (lastMessage?.role === 'user') {
      scrollToBottom();
      return;
    }

    // If streaming or receiving new message, scroll only if sticky at bottom
    if (isAtBottom) {
      scrollToBottom(true); // Instant scroll prevents jitter during streaming
    }
  }, [messages, selectedChatId, isAtBottom, scrollToBottom]);

  const handlePermissionRespond = useCallback(
    async (
      messageId: string,
      toolId: string,
      toolName: string,
      approved: boolean
    ) => {
      try {
        await invokeCommand(TauriCommands.RESPOND_TOOL_PERMISSION, {
          messageId,
          approved,
          allowedToolIds: approved ? [toolId] : [],
        });

        if (!approved && selectedChatId) {
          const content = `🚫 **System Notification:** Tool \`${toolName}\` denied by user. Flow cancelled.`;
          const id = crypto.randomUUID();
          const timestamp = Date.now();

          // Persist message to backend
          await invokeCommand(TauriCommands.CREATE_MESSAGE, {
            id,
            chatId: selectedChatId,
            role: 'assistant',
            content,
            timestamp,
            assistantMessageId: null,
            toolCallId: null,
          });

          // Update Redux state
          dispatch(
            addMessage({
              chatId: selectedChatId,
              message: {
                id,
                role: 'assistant',
                content,
                timestamp,
              },
            })
          );
        }

        dispatch(removePermissionRequest(messageId));
      } catch (error) {
        console.error('Failed to respond to tool permission:', error);
      }
    },
    [dispatch, selectedChatId]
  );

  // Timeout for pending permissions
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const TIMEOUT_MS = 60000; // 60s

      if (pendingRequests) {
        Object.values(pendingRequests).forEach((req) => {
          if (req.timestamp && now - req.timestamp > TIMEOUT_MS) {
            // Reject all tools in the request
            req.toolCalls.forEach((tc) => {
              handlePermissionRespond(req.messageId, tc.id, tc.name, false);
            });

            dispatch(
              showError(
                t('toolPermissionTimeout', { ns: 'chat' }) ||
                  'Tool permission request timed out'
              )
            );
          }
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingRequests, handlePermissionRespond, dispatch, t]);

  const handleViewAgentDetails = useCallback(
    (sessionId: string, agentId: string) => {
      dispatch(
        setAgentChatHistoryDrawerOpen({
          open: true,
          sessionId,
          agentId,
        })
      );
    },
    [dispatch]
  );

  const handleSaveEdit = useCallback(
    async (messageId: string, content: string) => {
      if (!selectedChatId) return;

      if (!content.trim()) {
        dispatch(
          showError(t('messageCannotBeEmpty') || 'Message cannot be empty')
        );
        return;
      }

      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      dispatch(setLoading(true));
      try {
        if (message.role === 'user') {
          // For user messages: edit and resend
          await dispatch(
            editAndResendMessage({
              chatId: selectedChatId,
              messageId,
              newContent: content,
            })
          ).unwrap();
        } else if (message.role === 'assistant') {
          // For assistant messages: just update the content
          await invokeCommand(TauriCommands.UPDATE_MESSAGE, {
            id: messageId,
            content,
            reasoning: message.reasoning || null,
            timestamp: null, // Keep original timestamp
          });

          // Refresh messages to show updated content
          const { fetchMessages } = await import('@/store/slices/messages');
          await dispatch(fetchMessages(selectedChatId));
        }
      } catch (error: unknown) {
        console.error('Error editing message:', error);
        dispatch(
          showError(
            error instanceof Error
              ? error.message
              : t('errorEditingMessage') || 'Error editing message'
          )
        );
      } finally {
        dispatch(setLoading(false));
      }
    },
    [selectedChatId, dispatch, t, messages]
  );

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 gap-2 grid">
        <MessageList
          messages={messages}
          enableStreaming={true}
          enableThinkingItem={true}
          enablePendingPermissions={true}
          streamingMessageId={streamingMessageId}
          pendingRequests={pendingRequests}
          onSaveEdit={handleSaveEdit}
          onPermissionRespond={handlePermissionRespond}
          onViewAgentDetails={handleViewAgentDetails}
          userMode={userMode}
          t={t}
          isLoading={isLoading && !streamingMessageId}
        />
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
