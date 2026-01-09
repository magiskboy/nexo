import type { Message } from '../../types';

export interface StreamingError {
  messageId: string;
  error: 'timeout' | 'network' | 'unknown';
  canRetry: boolean;
}

export interface MessagesState {
  messagesByChatId: Record<string, Message[]>;
  loading: boolean;
  error: string | null;
  streamingMessageId: string | null; // Track which message is currently streaming (deprecated, use streamingByChatId)
  streamingByChatId: Record<string, string | null>; // Track streaming messageId per chatId
  pausedStreaming: Record<string, boolean>; // Track which chatIds have paused streaming
  streamingErrors: Record<string, StreamingError>; // Track streaming errors per chatId
  streamingStartTimes: Record<string, number>; // Track streaming start timestamp per chatId
}

export const initialState: MessagesState = {
  messagesByChatId: {},
  loading: false,
  error: null,
  streamingMessageId: null,
  streamingByChatId: {},
  pausedStreaming: {},
  streamingErrors: {},
  streamingStartTimes: {},
};
