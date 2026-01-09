// Shared types for Redux store

export type { LLMModel, LLMConnection } from '@/features/llm/types';

// Re-export MCP types from mcp module for backward compatibility
export type {
  MCPToolType as MCPTool,
  MCPServerConnection,
} from '@/features/mcp/types';

export type { Workspace, WorkspaceSettings } from '@/features/workspace/types';

export type {
  ChatItem,
  ToolCall,
  TokenUsage,
  CodeBlock,
  Message,
} from '@/features/chat/types';

export interface Prompt {
  id: string;
  name: string;
  content: string;
  created_at: number;
  updated_at: number;
}

export type {
  AgentManifest,
  InstalledAgent,
  AgentSource,
  InstallInfo,
} from '@/features/agent/types';
