import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/ui/atoms/dialog';
import { ScrollArea } from '@/ui/atoms/scroll-area';
import { MessageItem } from '@/ui/organisms/MessageItem';
import { ToolCallItem } from '@/ui/organisms/ToolCallItem';
import { useAppSettings } from '@/hooks/useAppSettings';
import type { Message } from '@/store/types';
import { invokeCommand, TauriCommands } from '@/lib/tauri';

interface AgentChatHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  agentId: string | null;
}

export function AgentChatHistoryDialog({
  open,
  onOpenChange,
  sessionId,
  agentId,
}: AgentChatHistoryDialogProps) {
  const { t: tChat } = useTranslation('chat');
  const { userMode } = useAppSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [markdownEnabled, setMarkdownEnabled] = useState<
    Record<string, boolean>
  >({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [expandedToolCalls, setExpandedToolCalls] = useState<
    Record<string, boolean>
  >({});
  const [agentName, setAgentName] = useState<string | null>(null);

  // Fetch agent name when agentId changes
  useEffect(() => {
    if (!agentId) {
      setAgentName(null);
      return;
    }

    const fetchAgentName = async () => {
      try {
        const agents = await invokeCommand<
          Array<{
            manifest: {
              id: string;
              name: string;
              description: string;
              author: string;
              schema_version: number;
            };
            path: string;
          }>
        >(TauriCommands.GET_INSTALLED_AGENTS);
        const agent = agents.find((a) => a.manifest.id === agentId);
        if (agent) {
          setAgentName(agent.manifest.name);
        }
      } catch (error) {
        console.error('Failed to fetch agent name:', error);
      }
    };

    fetchAgentName();
  }, [agentId]);

  // Fetch messages when dialog opens and sessionId changes
  useEffect(() => {
    if (!open || !sessionId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoading(true);
      try {
        // Fetch messages using the same approach as useMessages
        const dbMessages = await invokeCommand<
          Array<{
            id: string;
            role: string;
            content: string;
            timestamp: number;
            assistant_message_id: string | null;
            reasoning: string | null;
            metadata: string | null;
          }>
        >(TauriCommands.GET_MESSAGES, { chatId: sessionId });

        // Transform to Message format
        const transformedMessages: Message[] = dbMessages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'tool' | 'tool_call',
          content: m.content,
          timestamp: m.timestamp * 1000, // Convert to milliseconds
          assistantMessageId: m.assistant_message_id ?? undefined,
          reasoning: m.reasoning ?? undefined,
          metadata: m.metadata ?? undefined,
        }));

        setMessages(transformedMessages);
      } catch (error) {
        console.error('Failed to load agent chat history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [open, sessionId]);

  const handleToggleMarkdown = (messageId: string) => {
    setMarkdownEnabled((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleCopy = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setEditingMessageId(messageId);
      setEditingContent(message.content);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleEditContentChange = (content: string) => {
    setEditingContent(content);
  };

  const handleSaveEdit = async (messageId: string, content: string) => {
    if (!sessionId) return;

    try {
      await invokeCommand(TauriCommands.UPDATE_MESSAGE, {
        messageId,
        content,
      });

      // Update local state
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content } : m))
      );
      setEditingMessageId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Failed to update message:', error);
    }
  };

  const toggleToolCall = (id: string) => {
    setExpandedToolCalls((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter out tool messages for display (tool results are shown within tool_call messages)
  const displayMessages = messages.filter((m) => m.role !== 'tool');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl sm:max-w-5xl w-full h-[85vh] max-h-[85vh] flex flex-col p-0"
        showCloseButton={true}
      >
        <DialogHeader className="px-6 py-3 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base">
                {agentName || agentId || 'Agent Chat History'}
              </DialogTitle>
              {agentName && agentId && (
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {agentId}
                </p>
              )}
            </div>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
            )}
          </div>
        </DialogHeader>

        <DialogBody className="flex-1 overflow-hidden px-0 py-0">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No messages in this chat</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="px-6 py-4">
                <div className="mx-auto w-full flex flex-col gap-4">
                  {displayMessages.map((message) => {
                    // Handle tool_call messages separately
                    if (message.role === 'tool_call') {
                      return (
                        <ToolCallItem
                          key={message.id}
                          message={message}
                          isExpanded={expandedToolCalls[message.id] || false}
                          onToggle={toggleToolCall}
                          t={tChat}
                          userMode={userMode}
                        />
                      );
                    }

                    // Regular messages (user/assistant)
                    const isMarkdownEnabled =
                      markdownEnabled[message.id] !== false;
                    const isEditing = editingMessageId === message.id;

                    return (
                      <MessageItem
                        key={message.id}
                        message={message}
                        userMode={userMode}
                        markdownEnabled={isMarkdownEnabled}
                        isCopied={copiedId === message.id}
                        isEditing={isEditing}
                        editingContent={editingContent}
                        isStreaming={false}
                        onToggleMarkdown={handleToggleMarkdown}
                        onCopy={handleCopy}
                        onEdit={handleEdit}
                        onCancelEdit={handleCancelEdit}
                        onEditContentChange={handleEditContentChange}
                        onSaveEdit={handleSaveEdit}
                        t={tChat}
                      />
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
