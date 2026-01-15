import { describe, it, expect, vi, beforeEach } from 'vitest';
import mcpConnectionsReducer, {
  setMCPConnections,
  fetchMCPConnections,
  addMCPConnection,
  connectMCPConnection,
  updateMCPConnection,
  disconnectMCPConnection,
  removeMCPConnection,
} from './slice';
import { invokeCommand } from '@/lib/tauri';
import type { MCPServerConnection } from '../types';

vi.mock('@/lib/tauri', () => ({
  invokeCommand: vi.fn(),
  TauriCommands: {
    GET_MCP_SERVER_CONNECTIONS: 'get_mcp_server_connections',
    CREATE_MCP_SERVER_CONNECTION: 'create_mcp_server_connection',
    UPDATE_MCP_SERVER_CONNECTION: 'update_mcp_server_connection',
    UPDATE_MCP_SERVER_STATUS: 'update_mcp_server_status',
    DELETE_MCP_SERVER_CONNECTION: 'delete_mcp_server_connection',
    CONNECT_MCP_SERVER_AND_FETCH_TOOLS: 'connect_mcp_server_and_fetch_tools',
  },
}));

describe('mcpConnectionsSlice', () => {
  const initialState = {
    mcpConnections: [],
    loading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Reducers', () => {
    it('should return the initial state', () => {
      expect(mcpConnectionsReducer(undefined, { type: 'unknown' })).toEqual(
        initialState
      );
    });

    it('should handle setMCPConnections', () => {
      const connections: MCPServerConnection[] = [
        {
          id: '1',
          name: 'Test MCP',
          url: 'http://localhost:3000',
          type: 'sse',
          status: 'connected',
        },
      ];

      const state = mcpConnectionsReducer(
        initialState,
        setMCPConnections(connections)
      );

      expect(state.mcpConnections).toEqual(connections);
    });
  });

  describe('fetchMCPConnections', () => {
    it('should handle fetchMCPConnections.pending', () => {
      const action = { type: fetchMCPConnections.pending.type };
      const state = mcpConnectionsReducer(initialState, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle fetchMCPConnections.fulfilled', async () => {
      const mockDbConnections = [
        {
          id: '1',
          name: 'Test MCP',
          url: 'http://localhost:3000',
          type: 'sse',
          headers: '{}',
          runtime_path: null,
          status: 'connected',
          tools_json: JSON.stringify([
            { name: 'test_tool', description: 'Test tool' },
          ]),
          error_message: null,
          created_at: 1000,
          updated_at: 2000,
        },
      ];

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDbConnections
      );

      const dispatch = vi.fn();
      const thunk = fetchMCPConnections();
      const result = await thunk(dispatch, () => ({}), {});

      const state = mcpConnectionsReducer(initialState, result);

      expect(state.loading).toBe(false);
      expect(state.mcpConnections).toHaveLength(1);
      expect(state.mcpConnections[0].name).toBe('Test MCP');
      expect(state.mcpConnections[0].tools).toBeDefined();
    });

    it('should handle fetchMCPConnections.rejected', () => {
      const action = {
        type: fetchMCPConnections.rejected.type,
        error: { message: 'Network error' },
      };
      const state = mcpConnectionsReducer(initialState, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('addMCPConnection', () => {
    it('should handle addMCPConnection.fulfilled', async () => {
      const newConnection: Omit<MCPServerConnection, 'id'> = {
        name: 'New MCP',
        url: 'http://localhost:4000',
        type: 'stdio',
      };

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const dispatch = vi.fn();
      const thunk = addMCPConnection(newConnection);
      const result = await thunk(dispatch, () => ({}), {});

      const state = mcpConnectionsReducer(initialState, result);

      expect(state.mcpConnections).toHaveLength(1);
      expect(state.mcpConnections[0].name).toBe('New MCP');
      expect(state.mcpConnections[0].status).toBe('connecting');
      expect(state.mcpConnections[0].id).toBeDefined();
    });
  });

  describe('connectMCPConnection', () => {
    it('should handle connectMCPConnection.pending', () => {
      const stateWithConnection = {
        ...initialState,
        mcpConnections: [
          {
            id: '1',
            name: 'Test',
            url: 'http://localhost:3000',
            type: 'sse' as const,
            status: 'disconnected' as const,
          },
        ],
      };

      const action = {
        type: connectMCPConnection.pending.type,
        meta: { arg: { id: '1', url: 'http://localhost:3000', type: 'sse' } },
      };

      const state = mcpConnectionsReducer(stateWithConnection, action);

      expect(state.mcpConnections[0].status).toBe('connecting');
    });

    it('should handle connectMCPConnection.fulfilled with success', async () => {
      const stateWithConnection = {
        ...initialState,
        mcpConnections: [
          {
            id: '1',
            name: 'Test',
            url: 'http://localhost:3000',
            type: 'sse' as const,
            status: 'connecting' as const,
          },
        ],
      };

      const mockTools = [
        {
          name: 'test_tool',
          description: 'Test tool',
          input_schema: JSON.stringify({ type: 'object' }),
        },
      ];

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(mockTools);

      const dispatch = vi.fn();
      const thunk = connectMCPConnection({
        id: '1',
        url: 'http://localhost:3000',
        type: 'sse',
      });
      const result = await thunk(dispatch, () => ({}), {});

      const state = mcpConnectionsReducer(stateWithConnection, result);

      expect(state.mcpConnections[0].status).toBe('connected');
      expect(state.mcpConnections[0].tools).toBeDefined();
      expect(state.mcpConnections[0].tools).toHaveLength(1);
      expect(state.mcpConnections[0].errorMessage).toBeUndefined();
    });

    it('should handle connectMCPConnection.fulfilled with error', async () => {
      const stateWithConnection = {
        ...initialState,
        mcpConnections: [
          {
            id: '1',
            name: 'Test',
            url: 'http://localhost:3000',
            type: 'sse' as const,
            status: 'connecting' as const,
          },
        ],
      };

      (invokeCommand as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Connection failed')
      );

      const dispatch = vi.fn();
      const thunk = connectMCPConnection({
        id: '1',
        url: 'http://localhost:3000',
        type: 'sse',
      });
      const result = await thunk(dispatch, () => ({}), {});

      const state = mcpConnectionsReducer(stateWithConnection, result);

      expect(state.mcpConnections[0].status).toBe('disconnected');
      expect(state.mcpConnections[0].errorMessage).toBe('Connection failed');
    });

    it('should handle connectMCPConnection.rejected', () => {
      const stateWithConnection = {
        ...initialState,
        mcpConnections: [
          {
            id: '1',
            name: 'Test',
            url: 'http://localhost:3000',
            type: 'sse' as const,
            status: 'connecting' as const,
          },
        ],
      };

      const action = {
        type: connectMCPConnection.rejected.type,
        meta: { arg: { id: '1', url: 'http://localhost:3000', type: 'sse' } },
        error: { message: 'Failed to connect' },
      };

      const state = mcpConnectionsReducer(stateWithConnection, action);

      expect(state.mcpConnections[0].status).toBe('disconnected');
      expect(state.mcpConnections[0].errorMessage).toBe('Failed to connect');
    });
  });

  describe('updateMCPConnection', () => {
    it('should handle updateMCPConnection.fulfilled without reconnect', async () => {
      const stateWithConnection = {
        ...initialState,
        mcpConnections: [
          {
            id: '1',
            name: 'Old Name',
            url: 'http://localhost:3000',
            type: 'sse' as const,
            status: 'connected' as const,
          },
        ],
      };

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const dispatch = vi.fn();
      const thunk = updateMCPConnection({
        id: '1',
        connection: { name: 'New Name' },
      });
      const result = await thunk(dispatch, () => ({}), {});

      const state = mcpConnectionsReducer(stateWithConnection, result);

      expect(state.mcpConnections[0].name).toBe('New Name');
      expect(state.mcpConnections[0].status).toBe('connected');
    });

    it('should handle updateMCPConnection.fulfilled with reconnect', async () => {
      const stateWithConnection = {
        ...initialState,
        mcpConnections: [
          {
            id: '1',
            name: 'Test',
            url: 'http://localhost:3000',
            type: 'sse' as const,
            status: 'connected' as const,
          },
        ],
      };

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const dispatch = vi.fn();
      const thunk = updateMCPConnection({
        id: '1',
        connection: { url: 'http://localhost:4000' },
      });
      const result = await thunk(dispatch, () => ({}), {});

      const state = mcpConnectionsReducer(stateWithConnection, result);

      expect(state.mcpConnections[0].url).toBe('http://localhost:4000');
      expect(state.mcpConnections[0].status).toBe('connecting');
    });
  });

  describe('disconnectMCPConnection', () => {
    it('should handle disconnectMCPConnection.fulfilled', async () => {
      const stateWithConnection = {
        ...initialState,
        mcpConnections: [
          {
            id: '1',
            name: 'Test',
            url: 'http://localhost:3000',
            type: 'sse' as const,
            status: 'connected' as const,
            tools: [{ name: 'tool1', description: 'Tool 1' }],
          },
        ],
      };

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const dispatch = vi.fn();
      const thunk = disconnectMCPConnection('1');
      const result = await thunk(dispatch, () => ({}), {});

      const state = mcpConnectionsReducer(stateWithConnection, result);

      expect(state.mcpConnections[0].status).toBe('disconnected');
      expect(state.mcpConnections[0].tools).toBeUndefined();
      expect(state.mcpConnections[0].errorMessage).toBeUndefined();
    });
  });

  describe('removeMCPConnection', () => {
    it('should handle removeMCPConnection.fulfilled', async () => {
      const stateWithConnections = {
        ...initialState,
        mcpConnections: [
          {
            id: '1',
            name: 'Connection 1',
            url: 'http://localhost:3000',
            type: 'sse' as const,
            status: 'connected' as const,
          },
          {
            id: '2',
            name: 'Connection 2',
            url: 'http://localhost:4000',
            type: 'stdio' as const,
            status: 'disconnected' as const,
          },
        ],
      };

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const dispatch = vi.fn();
      const thunk = removeMCPConnection('1');
      const result = await thunk(dispatch, () => ({}), {});

      const state = mcpConnectionsReducer(stateWithConnections, result);

      expect(state.mcpConnections).toHaveLength(1);
      expect(state.mcpConnections[0].id).toBe('2');
    });
  });

  describe('DB to Frontend conversion', () => {
    it('should parse tools_json correctly', async () => {
      const mockDbConnections = [
        {
          id: '1',
          name: 'Test',
          url: 'http://localhost:3000',
          type: 'sse',
          headers: '{}',
          runtime_path: null,
          status: 'connected',
          tools_json: JSON.stringify([
            {
              name: 'tool1',
              description: 'Tool 1',
              inputSchema: { type: 'object' },
            },
          ]),
          error_message: null,
          created_at: 1000,
          updated_at: 2000,
        },
      ];

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDbConnections
      );

      const dispatch = vi.fn();
      const thunk = fetchMCPConnections();
      const result = await thunk(dispatch, () => ({}), {});

      const state = mcpConnectionsReducer(initialState, result);

      expect(state.mcpConnections[0].tools).toBeDefined();
      expect(state.mcpConnections[0].tools).toHaveLength(1);
    });

    it('should handle invalid tools_json gracefully', async () => {
      const mockDbConnections = [
        {
          id: '1',
          name: 'Test',
          url: 'http://localhost:3000',
          type: 'sse',
          headers: '{}',
          runtime_path: null,
          status: 'connected',
          tools_json: 'invalid json',
          error_message: null,
          created_at: 1000,
          updated_at: 2000,
        },
      ];

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDbConnections
      );

      const dispatch = vi.fn();
      const thunk = fetchMCPConnections();
      const result = await thunk(dispatch, () => ({}), {});

      const state = mcpConnectionsReducer(initialState, result);

      expect(state.mcpConnections[0].tools).toBeUndefined();
    });
  });
});
