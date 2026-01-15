import { describe, it, expect, vi, beforeEach } from 'vitest';
import llmConnectionsReducer, {
  setLLMConnections,
  fetchLLMConnections,
  refreshLLMConnections,
  addLLMConnection,
  updateLLMConnection,
  removeLLMConnection,
} from './slice';
import { invokeCommand } from '@/lib/tauri';
import type { LLMConnection } from '../types';

vi.mock('@/lib/tauri', () => ({
  invokeCommand: vi.fn(),
  TauriCommands: {
    GET_LLM_CONNECTIONS: 'get_llm_connections',
    CREATE_LLM_CONNECTION: 'create_llm_connection',
    UPDATE_LLM_CONNECTION: 'update_llm_connection',
    DELETE_LLM_CONNECTION: 'delete_llm_connection',
  },
}));

describe('llmConnectionsSlice', () => {
  const initialState = {
    llmConnections: [],
    loading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Reducers', () => {
    it('should return the initial state', () => {
      expect(llmConnectionsReducer(undefined, { type: 'unknown' })).toEqual(
        initialState
      );
    });

    it('should handle setLLMConnections', () => {
      const connections: LLMConnection[] = [
        {
          id: '1',
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com',
          provider: 'openai',
          apiKey: 'key1',
          enabled: true,
        },
      ];

      const state = llmConnectionsReducer(
        initialState,
        setLLMConnections(connections)
      );

      expect(state.llmConnections).toEqual(connections);
    });
  });

  describe('Async Thunks', () => {
    describe('fetchLLMConnections', () => {
      it('should handle fetchLLMConnections.pending', () => {
        const action = { type: fetchLLMConnections.pending.type };
        const state = llmConnectionsReducer(initialState, action);

        expect(state.loading).toBe(true);
        expect(state.error).toBe(null);
      });

      it('should handle fetchLLMConnections.fulfilled', async () => {
        const mockDbConnections = [
          {
            id: '1',
            name: 'OpenAI',
            base_url: 'https://api.openai.com',
            provider: 'openai',
            api_key: 'key1',
            models_json: JSON.stringify([
              { id: 'gpt-4', name: 'GPT-4', supportsTools: true },
            ]),
            default_model: null,
            enabled: true,
            created_at: 1000,
            updated_at: 2000,
          },
        ];

        (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(
          mockDbConnections
        );

        const dispatch = vi.fn();
        const thunk = fetchLLMConnections();
        const result = await thunk(dispatch, () => ({}), {});

        const state = llmConnectionsReducer(initialState, result);

        expect(state.loading).toBe(false);
        expect(state.llmConnections).toHaveLength(1);
        expect(state.llmConnections[0].name).toBe('OpenAI');
        expect(state.llmConnections[0].baseUrl).toBe('https://api.openai.com');
      });

      it('should handle fetchLLMConnections.rejected', () => {
        const action = {
          type: fetchLLMConnections.rejected.type,
          error: { message: 'Network error' },
        };
        const state = llmConnectionsReducer(initialState, action);

        expect(state.loading).toBe(false);
        expect(state.error).toBe('Network error');
      });
    });

    describe('refreshLLMConnections', () => {
      it('should handle refreshLLMConnections.fulfilled', async () => {
        const mockDbConnections = [
          {
            id: '2',
            name: 'Ollama',
            base_url: 'http://localhost:11434',
            provider: 'ollama',
            api_key: '',
            models_json: null,
            default_model: null,
            enabled: true,
            created_at: 1000,
            updated_at: 2000,
          },
        ];

        (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(
          mockDbConnections
        );

        const dispatch = vi.fn();
        const thunk = refreshLLMConnections();
        const result = await thunk(dispatch, () => ({}), {});

        const state = llmConnectionsReducer(initialState, result);

        expect(state.loading).toBe(false);
        expect(state.llmConnections).toHaveLength(1);
        expect(state.llmConnections[0].provider).toBe('ollama');
      });
    });

    describe('addLLMConnection', () => {
      it('should handle addLLMConnection.fulfilled', async () => {
        const newConnection: Omit<LLMConnection, 'id'> = {
          name: 'New LLM',
          baseUrl: 'https://api.example.com',
          provider: 'openai',
          apiKey: 'new-key',
          enabled: true,
        };

        (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const dispatch = vi.fn();
        const thunk = addLLMConnection(newConnection);
        const result = await thunk(dispatch, () => ({}), {});

        const state = llmConnectionsReducer(initialState, result);

        expect(state.llmConnections).toHaveLength(1);
        expect(state.llmConnections[0].name).toBe('New LLM');
        expect(state.llmConnections[0].id).toBeDefined();
      });

      it('should handle addLLMConnection with models', async () => {
        const newConnection: Omit<LLMConnection, 'id'> = {
          name: 'LLM with models',
          baseUrl: 'https://api.example.com',
          provider: 'openai',
          apiKey: 'key',
          models: [
            {
              id: 'model-1',
              name: 'Model 1',
              supportsTools: true,
              supportsThinking: false,
              supportsImageGeneration: false,
            },
          ],
          enabled: true,
        };

        (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const dispatch = vi.fn();
        const thunk = addLLMConnection(newConnection);
        const result = await thunk(dispatch, () => ({}), {});

        const state = llmConnectionsReducer(initialState, result);

        expect(state.llmConnections[0].models).toBeDefined();
        expect(state.llmConnections[0].models).toHaveLength(1);
      });
    });

    describe('updateLLMConnection', () => {
      it('should handle updateLLMConnection.fulfilled', async () => {
        const stateWithConnection = {
          ...initialState,
          llmConnections: [
            {
              id: '1',
              name: 'Old Name',
              baseUrl: 'https://old.com',
              provider: 'openai' as const,
              apiKey: 'old-key',
              enabled: true,
            },
          ],
        };

        (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const dispatch = vi.fn();
        const thunk = updateLLMConnection({
          id: '1',
          connection: { name: 'New Name', enabled: false },
        });
        const result = await thunk(dispatch, () => ({}), {});

        const state = llmConnectionsReducer(stateWithConnection, result);

        expect(state.llmConnections[0].name).toBe('New Name');
        expect(state.llmConnections[0].enabled).toBe(false);
        expect(state.llmConnections[0].baseUrl).toBe('https://old.com');
      });

      it('should not update if connection not found', async () => {
        (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const dispatch = vi.fn();
        const thunk = updateLLMConnection({
          id: 'non-existent',
          connection: { name: 'New Name' },
        });
        const result = await thunk(dispatch, () => ({}), {});

        const state = llmConnectionsReducer(initialState, result);

        expect(state.llmConnections).toHaveLength(0);
      });
    });

    describe('removeLLMConnection', () => {
      it('should handle removeLLMConnection.fulfilled', async () => {
        const stateWithConnections = {
          ...initialState,
          llmConnections: [
            {
              id: '1',
              name: 'Connection 1',
              baseUrl: 'https://api1.com',
              provider: 'openai' as const,
              apiKey: 'key1',
              enabled: true,
            },
            {
              id: '2',
              name: 'Connection 2',
              baseUrl: 'https://api2.com',
              provider: 'ollama' as const,
              apiKey: 'key2',
              enabled: true,
            },
          ],
        };

        (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const dispatch = vi.fn();
        const thunk = removeLLMConnection('1');
        const result = await thunk(dispatch, () => ({}), {});

        const state = llmConnectionsReducer(stateWithConnections, result);

        expect(state.llmConnections).toHaveLength(1);
        expect(state.llmConnections[0].id).toBe('2');
      });
    });
  });

  describe('DB to Frontend conversion', () => {
    it('should parse models_json correctly', async () => {
      const mockDbConnections = [
        {
          id: '1',
          name: 'Test',
          base_url: 'https://api.test.com',
          provider: 'openai',
          api_key: 'key',
          models_json: JSON.stringify([
            {
              id: 'model-1',
              name: 'Model 1',
              supportsTools: true,
              supportsThinking: false,
              supportsImageGeneration: false,
            },
          ]),
          default_model: null,
          enabled: true,
          created_at: 1000,
          updated_at: 2000,
        },
      ];

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDbConnections
      );

      const dispatch = vi.fn();
      const thunk = fetchLLMConnections();
      const result = await thunk(dispatch, () => ({}), {});

      const state = llmConnectionsReducer(initialState, result);

      expect(state.llmConnections[0].models).toBeDefined();
      expect(state.llmConnections[0].models).toHaveLength(1);
      expect(state.llmConnections[0].models?.[0].id).toBe('model-1');
    });

    it('should handle invalid models_json gracefully', async () => {
      const mockDbConnections = [
        {
          id: '1',
          name: 'Test',
          base_url: 'https://api.test.com',
          provider: 'openai',
          api_key: 'key',
          models_json: 'invalid json',
          default_model: null,
          enabled: true,
          created_at: 1000,
          updated_at: 2000,
        },
      ];

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDbConnections
      );

      const dispatch = vi.fn();
      const thunk = fetchLLMConnections();
      const result = await thunk(dispatch, () => ({}), {});

      const state = llmConnectionsReducer(initialState, result);

      expect(state.llmConnections[0].models).toBeUndefined();
    });

    it('should default to openai for invalid provider', async () => {
      const mockDbConnections = [
        {
          id: '1',
          name: 'Test',
          base_url: 'https://api.test.com',
          provider: 'invalid-provider',
          api_key: 'key',
          models_json: null,
          default_model: null,
          enabled: true,
          created_at: 1000,
          updated_at: 2000,
        },
      ];

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDbConnections
      );

      const dispatch = vi.fn();
      const thunk = fetchLLMConnections();
      const result = await thunk(dispatch, () => ({}), {});

      const state = llmConnectionsReducer(initialState, result);

      expect(state.llmConnections[0].provider).toBe('openai');
    });
  });
});
