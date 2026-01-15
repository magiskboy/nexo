import { describe, it, expect, vi, beforeEach } from 'vitest';
import workspaceSettingsReducer, {
  setWorkspaceSettings,
  updateWorkspaceSettings,
  fetchWorkspaceSettings,
  saveWorkspaceSettings,
  WorkspaceSettingsState,
} from './workspaceSettingsSlice';
import { invokeCommand } from '@/lib/tauri';
import type { WorkspaceSettings } from '../types';

vi.mock('@/lib/tauri', () => ({
  invokeCommand: vi.fn(),
  TauriCommands: {
    GET_WORKSPACE_SETTINGS: 'get_workspace_settings',
    SAVE_WORKSPACE_SETTINGS: 'save_workspace_settings',
  },
}));

describe('workspaceSettingsSlice', () => {
  const initialState: WorkspaceSettingsState = {
    settingsByWorkspaceId: {},
    loading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Reducers', () => {
    it('should return the initial state', () => {
      expect(workspaceSettingsReducer(undefined, { type: 'unknown' })).toEqual(
        initialState
      );
    });

    it('should handle setWorkspaceSettings', () => {
      const settings: WorkspaceSettings = {
        id: 'ws1',
        name: 'Workspace 1',
        systemMessage: 'Test message',
        llmConnectionId: 'llm1',
      };

      const state = workspaceSettingsReducer(
        initialState,
        setWorkspaceSettings({ workspaceId: 'ws1', settings })
      );

      expect(state.settingsByWorkspaceId['ws1']).toEqual(settings);
    });

    it('should handle updateWorkspaceSettings', () => {
      const stateWithSettings = {
        ...initialState,
        settingsByWorkspaceId: {
          ws1: {
            id: 'ws1',
            name: 'Workspace 1',
            systemMessage: 'Old message',
            llmConnectionId: 'llm1',
          },
        },
      };

      const state = workspaceSettingsReducer(
        stateWithSettings,
        updateWorkspaceSettings({
          workspaceId: 'ws1',
          settings: { systemMessage: 'New message' },
        })
      );

      expect(state.settingsByWorkspaceId['ws1'].systemMessage).toBe(
        'New message'
      );
      expect(state.settingsByWorkspaceId['ws1'].llmConnectionId).toBe('llm1');
    });

    it('should not update if workspace settings do not exist', () => {
      const state = workspaceSettingsReducer(
        initialState,
        updateWorkspaceSettings({
          workspaceId: 'non-existent',
          settings: { systemMessage: 'New message' },
        })
      );

      expect(state.settingsByWorkspaceId['non-existent']).toBeUndefined();
    });
  });

  describe('fetchWorkspaceSettings', () => {
    it('should handle fetchWorkspaceSettings.pending', () => {
      const action = { type: fetchWorkspaceSettings.pending.type };
      const state = workspaceSettingsReducer(initialState, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle fetchWorkspaceSettings.fulfilled', async () => {
      const mockDbSettings = {
        workspace_id: 'ws1',
        llm_connection_id: 'llm1',
        system_message: 'Test message',
        mcp_tool_ids: JSON.stringify({ tool1: 'mcp1' }),
        stream_enabled: 1,
        default_model: 'gpt-4',
        tool_permission_config: JSON.stringify({ tool1: 'auto' }),
        created_at: 1000,
        updated_at: 2000,
      };

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDbSettings
      );

      const dispatch = vi.fn();
      const thunk = fetchWorkspaceSettings({
        workspaceId: 'ws1',
        workspaceName: 'Workspace 1',
      });
      const result = await thunk(dispatch, () => ({}), {});

      const state = workspaceSettingsReducer(initialState, result);

      expect(state.loading).toBe(false);
      expect(state.settingsByWorkspaceId['ws1']).toBeDefined();
      expect(state.settingsByWorkspaceId['ws1'].systemMessage).toBe(
        'Test message'
      );
      expect(state.settingsByWorkspaceId['ws1'].streamEnabled).toBe(true);
      expect(state.settingsByWorkspaceId['ws1'].mcpToolIds).toEqual({
        tool1: 'mcp1',
      });
    });

    it('should handle fetchWorkspaceSettings.fulfilled with null result', async () => {
      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const dispatch = vi.fn();
      const thunk = fetchWorkspaceSettings({
        workspaceId: 'ws1',
        workspaceName: 'Workspace 1',
      });
      const result = await thunk(dispatch, () => ({}), {});

      const state = workspaceSettingsReducer(initialState, result);

      expect(state.loading).toBe(false);
      expect(state.settingsByWorkspaceId['ws1']).toBeUndefined();
    });

    it('should handle fetchWorkspaceSettings.rejected', () => {
      const action = {
        type: fetchWorkspaceSettings.rejected.type,
        error: { message: 'Database error' },
      };
      const state = workspaceSettingsReducer(initialState, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Database error');
    });

    it('should handle stream_enabled conversion correctly', async () => {
      const mockDbSettings = {
        workspace_id: 'ws1',
        llm_connection_id: null,
        system_message: null,
        mcp_tool_ids: null,
        stream_enabled: 0,
        default_model: null,
        tool_permission_config: null,
        created_at: 1000,
        updated_at: 2000,
      };

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDbSettings
      );

      const dispatch = vi.fn();
      const thunk = fetchWorkspaceSettings({
        workspaceId: 'ws1',
        workspaceName: 'Workspace 1',
      });
      const result = await thunk(dispatch, () => ({}), {});

      const state = workspaceSettingsReducer(initialState, result);

      expect(state.settingsByWorkspaceId['ws1'].streamEnabled).toBe(false);
    });

    it('should handle stream_enabled as undefined when null', async () => {
      const mockDbSettings = {
        workspace_id: 'ws1',
        llm_connection_id: null,
        system_message: null,
        mcp_tool_ids: null,
        stream_enabled: null,
        default_model: null,
        tool_permission_config: null,
        created_at: 1000,
        updated_at: 2000,
      };

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDbSettings
      );

      const dispatch = vi.fn();
      const thunk = fetchWorkspaceSettings({
        workspaceId: 'ws1',
        workspaceName: 'Workspace 1',
      });
      const result = await thunk(dispatch, () => ({}), {});

      const state = workspaceSettingsReducer(initialState, result);

      expect(state.settingsByWorkspaceId['ws1'].streamEnabled).toBeUndefined();
    });

    it('should handle invalid JSON gracefully', async () => {
      const mockDbSettings = {
        workspace_id: 'ws1',
        llm_connection_id: null,
        system_message: null,
        mcp_tool_ids: 'invalid json',
        stream_enabled: null,
        default_model: null,
        tool_permission_config: 'invalid json',
        created_at: 1000,
        updated_at: 2000,
      };

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDbSettings
      );

      const dispatch = vi.fn();
      const thunk = fetchWorkspaceSettings({
        workspaceId: 'ws1',
        workspaceName: 'Workspace 1',
      });
      const result = await thunk(dispatch, () => ({}), {});

      const state = workspaceSettingsReducer(initialState, result);

      expect(state.settingsByWorkspaceId['ws1'].mcpToolIds).toBeUndefined();
      expect(
        state.settingsByWorkspaceId['ws1'].toolPermissionConfig
      ).toBeUndefined();
    });
  });

  describe('saveWorkspaceSettings', () => {
    it('should handle saveWorkspaceSettings.fulfilled', async () => {
      const settings: WorkspaceSettings = {
        id: 'ws1',
        name: 'Workspace 1',
        systemMessage: 'New message',
        llmConnectionId: 'llm1',
        mcpToolIds: { tool1: 'mcp1' },
        streamEnabled: true,
        defaultModel: 'gpt-4',
        toolPermissionConfig: { tool1: 'auto' },
      };

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const dispatch = vi.fn();
      const thunk = saveWorkspaceSettings({
        workspaceId: 'ws1',
        settings,
      });
      const result = await thunk(dispatch, () => ({}), {});

      const state = workspaceSettingsReducer(initialState, result);

      expect(state.settingsByWorkspaceId['ws1']).toEqual(settings);
    });

    it('should handle saveWorkspaceSettings with minimal settings', async () => {
      const settings: WorkspaceSettings = {
        id: 'ws1',
        name: 'Workspace 1',
        systemMessage: '',
      };

      (invokeCommand as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const dispatch = vi.fn();
      const thunk = saveWorkspaceSettings({
        workspaceId: 'ws1',
        settings,
      });
      const result = await thunk(dispatch, () => ({}), {});

      const state = workspaceSettingsReducer(initialState, result);

      expect(state.settingsByWorkspaceId['ws1']).toEqual(settings);
    });
  });

  describe('Multiple workspaces', () => {
    it('should handle settings for multiple workspaces', () => {
      let state = initialState;

      const settings1: WorkspaceSettings = {
        id: 'ws1',
        name: 'Workspace 1',
        systemMessage: 'Message 1',
      };

      const settings2: WorkspaceSettings = {
        id: 'ws2',
        name: 'Workspace 2',
        systemMessage: 'Message 2',
      };

      state = workspaceSettingsReducer(
        state,
        setWorkspaceSettings({ workspaceId: 'ws1', settings: settings1 })
      );

      state = workspaceSettingsReducer(
        state,
        setWorkspaceSettings({ workspaceId: 'ws2', settings: settings2 })
      );

      expect(state.settingsByWorkspaceId['ws1'].systemMessage).toBe(
        'Message 1'
      );
      expect(state.settingsByWorkspaceId['ws2'].systemMessage).toBe(
        'Message 2'
      );
    });
  });
});
