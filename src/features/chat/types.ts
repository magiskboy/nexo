import type { Node, Edge } from '@xyflow/react';

export interface FlowData {
  nodes: Node[];
  edges: Edge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface ChatItem {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp?: number; // Unix timestamp in milliseconds
  agentId?: string;
  parentId?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: unknown;
  result?: unknown;
  error?: string;
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  tokensPerSecond?: number;
  responseTimeMs?: number;
  responseTimeMs_?: number;
}

export interface CodeBlock {
  id: string;
  content: string;
  language: string; // "python" | "mermaid" | "javascript" | etc.
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'tool_call';
  content: string;
  reasoning?: string; // Content of the thinking/reasoning process
  timestamp: number; // Unix timestamp in milliseconds
  toolCalls?: ToolCall[];
  toolCallId?: string; // For tool result messages
  assistantMessageId?: string; // For tool_call messages: ID of the assistant message that contains these tool calls
  tokenUsage?: TokenUsage; // Token usage information for assistant messages
  codeBlocks?: CodeBlock[]; // Extracted code blocks (python, mermaid, etc.)
  metadata?: string; // JSON metadata string (e.g. for agent cards)
  // For tool_call messages, content is JSON string with: { name, arguments, result?, error?, status: "calling" | "completed" | "error" }
}
