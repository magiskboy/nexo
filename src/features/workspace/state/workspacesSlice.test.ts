import { describe, it, expect, vi, beforeEach } from 'vitest';
import workspacesReducer, {
  setSelectedWorkspace,
  fetchWorkspaces,
  createWorkspace,
} from './workspacesSlice';
import { invokeCommand } from '@/lib/tauri';

vi.mock('@/lib/tauri', () => ({
  invokeCommand: vi.fn(() => Promise.resolve()),
  TauriCommands: {
    GET_WORKSPACES: 'get_workspaces',
    GET_APP_SETTING: 'get_app_setting',
    SAVE_APP_SETTING: 'save_app_setting',
    CREATE_WORKSPACE: 'create_workspace',
  },
}));

describe('workspacesSlice', () => {
  const initialState = {
    workspaces: [],
    selectedWorkspaceId: null,
    loading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Reducers', () => {
    it('should handle setSelectedWorkspace', () => {
      const state = workspacesReducer(
        initialState,
        setSelectedWorkspace('w-1')
      );
      expect(state.selectedWorkspaceId).toBe('w-1');
      expect(invokeCommand).toHaveBeenCalledWith('save_app_setting', {
        key: 'lastWorkspaceId',
        value: 'w-1',
      });
    });
  });

  describe('Extra Reducers', () => {
    it('fetchWorkspaces.fulfilled should update state', async () => {
      const mockDbWorkspaces = [
        { id: 'w1', name: 'Workspace 1', created_at: 1000 },
      ];

      (invokeCommand as any).mockImplementation((cmd: string) => {
        if (cmd === 'get_workspaces') return Promise.resolve(mockDbWorkspaces);
        if (cmd === 'get_app_setting') return Promise.resolve('w1');
        return Promise.resolve();
      });

      const dispatch = vi.fn();
      const thunk = fetchWorkspaces();
      const result = await thunk(dispatch, () => ({}), {});

      const state = workspacesReducer(initialState, result as any);
      expect(state.workspaces).toHaveLength(1);
      expect(state.workspaces[0].name).toBe('Workspace 1');
      expect(state.selectedWorkspaceId).toBe('w1');
    });

    it('createWorkspace.fulfilled should add new workspace', async () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'new-w-uuid' });
      (invokeCommand as any).mockResolvedValue({});

      const dispatch = vi.fn();
      const thunk = createWorkspace('New Workspace');
      const result = await thunk(dispatch, () => ({}), {});

      const state = workspacesReducer(initialState, result as any);
      expect(state.workspaces).toHaveLength(1);
      expect(state.workspaces[0].id).toBe('new-w-uuid');
      expect(state.selectedWorkspaceId).toBe('new-w-uuid');
    });
  });
});
