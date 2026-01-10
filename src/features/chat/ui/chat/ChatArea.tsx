import { useState } from 'react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { AgentChatHistoryDialog } from '@/features/agent';
import { ImagePreviewDialog } from '@/ui/molecules/ImagePreviewDialog';
import { useMessages } from '../../hooks/useMessages';
import { useWorkspaces } from '@/features/workspace';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { MAX_MESSAGE_LENGTH } from '@/lib/constants';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { sendMessage, editAndResendMessage } from '../../state/messages';
import {
  setLoading,
  clearInput,
  setInput,
  setAttachedFiles,
} from '../../state/chatInputSlice';
import { showError } from '@/features/notifications/state/notificationSlice';
import { setAgentChatHistoryDrawerOpen } from '@/features/ui/state/uiSlice';
import { invokeCommand, TauriCommands } from '@/lib/tauri';
import { messagesApi } from '../../state/messagesApi';
import { useGetLLMConnectionsQuery } from '@/features/llm';

export function ChatArea() {
  const { t } = useTranslation(['common', 'settings']);
  const dispatch = useAppDispatch();

  // Use workspaces hook to get selectedWorkspaceId and selectedLLMConnectionId
  const { selectedWorkspace, selectedWorkspaceId, workspaceSettings } =
    useWorkspaces();

  // Get selectedChatId from Redux state
  const selectedChatId = useAppSelector((state) => state.chats.selectedChatId);

  // Get agent chat history drawer state
  const agentChatHistoryDrawerOpen = useAppSelector(
    (state) => state.ui.agentChatHistoryDrawerOpen
  );
  const agentChatHistorySessionId = useAppSelector(
    (state) => state.ui.agentChatHistorySessionId
  );
  const agentChatHistoryAgentId = useAppSelector(
    (state) => state.ui.agentChatHistoryAgentId
  );

  const selectedLLMConnectionId = selectedWorkspace
    ? workspaceSettings[selectedWorkspace.id]?.llmConnectionId
    : undefined;

  // Get chat input state for handleSend
  const input = useAppSelector((state) => state.chatInput.input);
  const selectedModel = useAppSelector(
    (state) => state.chatInput.selectedModel
  );
  const attachedFiles = useAppSelector(
    (state) => state.chatInput.attachedFiles
  );

  const { data: llmConnections = [] } = useGetLLMConnectionsQuery();

  // Use messages hook
  const {
    messages,
    pausedStreaming,
    isStreaming,
    isAgentStreaming,
    streamingMessageId,
    streamingError,
    timeLeft,
    handleStopStreaming,
    handleRetryStreaming,
  } = useMessages(selectedChatId);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const handleEditMessage = (messageId: string | null) => {
    if (!messageId) {
      setEditingMessageId(null);
      dispatch(clearInput());
      dispatch(setAttachedFiles([]));
      return;
    }
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setEditingMessageId(messageId);
      dispatch(setInput(message.content));

      // Restore images if available
      try {
        if (message.metadata) {
          const parsed = JSON.parse(message.metadata);
          if (Array.isArray(parsed.images) && parsed.images.length > 0) {
            const promises = parsed.images.map(
              async (dataUrlOrPath: string, index: number) => {
                try {
                  let blob: Blob;
                  let mimeType = 'image/png';
                  let extension = 'png';

                  if (dataUrlOrPath.startsWith('data:')) {
                    // Handle data URL (Legacy)
                    const mimeMatch = dataUrlOrPath.match(/data:(.*?);/);
                    mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
                    extension = mimeType.split('/')[1] || 'png';

                    const byteString = atob(dataUrlOrPath.split(',')[1]);
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) {
                      ia[i] = byteString.charCodeAt(i);
                    }
                    blob = new Blob([ab], { type: mimeType });
                  } else {
                    // Handle file path (New)
                    const { readFile } = await import('@tauri-apps/plugin-fs');
                    const bytes = await readFile(dataUrlOrPath);

                    const ext =
                      dataUrlOrPath.split('.').pop()?.toLowerCase() || 'png';
                    mimeType = (() => {
                      switch (ext) {
                        case 'jpg':
                        case 'jpeg':
                          return 'image/jpeg';
                        case 'png':
                          return 'image/png';
                        case 'webp':
                          return 'image/webp';
                        case 'gif':
                          return 'image/gif';
                        case 'svg':
                          return 'image/svg+xml';
                        default:
                          return 'image/png';
                      }
                    })();
                    extension = ext;
                    blob = new Blob([bytes], { type: mimeType });
                  }

                  return new File([blob], `image-${index}.${extension}`, {
                    type: mimeType,
                  });
                } catch (e) {
                  console.error('Failed to restore image', e);
                  return null;
                }
              }
            );

            Promise.all(promises).then((results) => {
              const validFiles = results.filter((f): f is File => f !== null);
              if (validFiles.length > 0) {
                dispatch(setAttachedFiles(validFiles));
              } else {
                dispatch(setAttachedFiles([]));
              }
            });
          } else {
            dispatch(setAttachedFiles([]));
          }
        } else {
          dispatch(setAttachedFiles([]));
        }
      } catch (e) {
        console.error('Failed to restore images for editing', e);
        dispatch(setAttachedFiles([]));
      }
    }
  };

  const handleSend = async (overrideContent?: string, images?: string[]) => {
    // If overrideContent is provided, use it. Otherwise use state input.
    const contentToSend =
      overrideContent !== undefined ? overrideContent : input;

    const hasImages = images && images.length > 0;

    if (
      (!contentToSend.trim() && !hasImages) ||
      !selectedWorkspace ||
      !selectedChatId
    ) {
      return;
    }

    if (contentToSend.length > MAX_MESSAGE_LENGTH) {
      dispatch(
        showError(
          t('messageTooLong', {
            length: contentToSend.length,
            max: MAX_MESSAGE_LENGTH,
            ns: 'chat',
          })
        )
      );
      return;
    }

    const workspaceSetting = workspaceSettings[selectedWorkspace.id];
    let llmConnectionId = workspaceSetting?.llmConnectionId;
    let modelId = selectedModel;

    if (selectedModel?.includes('::')) {
      const [connId, ...modelIdParts] = selectedModel.split('::');
      llmConnectionId = connId;
      modelId = modelIdParts.join('::');
    }

    if (!llmConnectionId) {
      dispatch(showError(t('pleaseSelectLLMConnection', { ns: 'settings' })));
      return;
    }

    const llmConnection = llmConnections.find(
      (conn) => conn.id === llmConnectionId
    );
    if (!llmConnection) {
      dispatch(showError(t('llmConnectionNotFound', { ns: 'settings' })));
      return;
    }

    if (!modelId) {
      dispatch(showError(t('pleaseSelectModel', { ns: 'settings' })));
      return;
    }

    // Track message send
    const { trackMessageSend, setLLMContext, setChatContext } =
      await import('@/lib/sentry-utils');
    trackMessageSend(
      selectedChatId,
      contentToSend.trim().length,
      hasImages || attachedFiles.length > 0
    );
    setLLMContext(llmConnection.provider, modelId);
    setChatContext(selectedChatId);

    const userInput = contentToSend.trim();

    // Clear input immediately for better UX
    dispatch(clearInput());
    dispatch(setLoading(true));

    try {
      // Send message with streaming support (streaming handled via Tauri events)
      if (editingMessageId) {
        const message = messages.find((m) => m.id === editingMessageId);
        if (message) {
          if (message.role === 'user') {
            await dispatch(
              editAndResendMessage({
                chatId: selectedChatId,
                messageId: editingMessageId,
                newContent: userInput,
                images, // Pass updated images
              })
            ).unwrap();
          } else if (message.role === 'assistant') {
            await invokeCommand(TauriCommands.UPDATE_MESSAGE, {
              id: editingMessageId,
              content: userInput,
              reasoning: message.reasoning || null,
              timestamp: null,
            });
            dispatch(
              messagesApi.util.invalidateTags([
                { type: 'Message', id: `LIST_${selectedChatId}` },
              ])
            );
          }
        }
        setEditingMessageId(null);
      } else {
        await dispatch(
          sendMessage({
            chatId: selectedChatId,
            content: userInput,
            images,
          })
        ).unwrap();
      }

      // Note: Chat last message is updated by Rust core after message completion
      // Events will handle content updates, so we don't need to update it here
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      // Error message is already handled in the thunk
      // Note: Input is already cleared, which is fine for UX
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (messages.length === 0) {
    // Empty state: Show slogan and center the input
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Sparkles className="size-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t('chatSlogan', { ns: 'common' })}
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {t('chatSloganDescription', { ns: 'common' })}
          </p>
        </div>
        <div className="w-full max-w-3xl px-4">
          <ChatInput
            selectedWorkspaceId={selectedWorkspaceId}
            selectedChatId={selectedChatId}
            selectedLLMConnectionId={selectedLLMConnectionId}
            onSend={handleSend}
            disabled={false}
            timeLeft={timeLeft}
            streamingError={selectedChatId ? streamingError : undefined}
            onRetryStreaming={handleRetryStreaming}
            isEditing={!!editingMessageId}
            onCancelEdit={() => handleEditMessage(null)}
          />
        </div>
      </div>
    );
  }

  // Has messages: Normal layout
  return (
    <>
      {/* Messages Area */}
      <ChatMessages
        messages={messages}
        isLoading={
          isStreaming &&
          !pausedStreaming[selectedChatId || ''] &&
          !isAgentStreaming
        }
        streamingMessageId={streamingMessageId}
        onCancelToolExecution={handleStopStreaming}
        onEditMessage={handleEditMessage}
      />

      {/* Input Area */}
      <ChatInput
        selectedWorkspaceId={selectedWorkspaceId}
        selectedChatId={selectedChatId}
        selectedLLMConnectionId={selectedLLMConnectionId}
        onSend={handleSend}
        disabled={false}
        dropdownDirection="up"
        timeLeft={timeLeft}
        streamingError={selectedChatId ? streamingError : undefined}
        onRetryStreaming={handleRetryStreaming}
        isEditing={!!editingMessageId}
        onCancelEdit={() => handleEditMessage(null)}
      />

      {/* Agent Chat History Dialog */}
      <AgentChatHistoryDialog
        open={agentChatHistoryDrawerOpen}
        onOpenChange={(open) =>
          dispatch(
            setAgentChatHistoryDrawerOpen({
              open,
              sessionId: null,
              agentId: null,
            })
          )
        }
        sessionId={agentChatHistorySessionId}
        agentId={agentChatHistoryAgentId}
      />
      <ImagePreviewDialog />
    </>
  );
}
