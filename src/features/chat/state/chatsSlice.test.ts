import { describe, it, expect, vi, beforeEach } from 'vitest';
import chatsReducer, {
  setChats,
  setSelectedChat,
  deleteChat,
  fetchChats,
  createChat,
  updateChatTitle,
} from './chatsSlice';
import { invokeCommand } from '@/lib/tauri';

// Mock Tauri invoke
vi.mock('@/lib/tauri', () => ({
  invokeCommand: vi.fn(() => Promise.resolve()),
  TauriCommands: {
    GET_CHATS: 'get_chats',
    GET_APP_SETTING: 'get_app_setting',
    CREATE_CHAT: 'create_chat',
    SAVE_APP_SETTING: 'save_app_setting',
    UPDATE_CHAT: 'update_chat',
    DELETE_CHAT: 'delete_chat',
    DELETE_ALL_CHATS_BY_WORKSPACE: 'delete_all_chats_by_workspace',
  },
}));

describe('chatsSlice', () => {
  const initialState = {
    chatsByWorkspaceId: {},
    selectedChatId: null,
    loading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Reducers', () => {
    it('should return the initial state', () => {
      expect(chatsReducer(undefined, { type: 'unknown' })).toEqual(
        initialState
      );
    });

    it('should handle setChats', () => {
      const chats = [{ id: '1', title: 'Chat 1', timestamp: 123 }];
      const state = chatsReducer(
        initialState,
        setChats({ workspaceId: 'w1', chats })
      );
      expect(state.chatsByWorkspaceId['w1']).toEqual(chats);
    });

    it('should handle setSelectedChat', () => {
      const state = chatsReducer(initialState, setSelectedChat('chat-123'));
      expect(state.selectedChatId).toBe('chat-123');
      expect(invokeCommand).toHaveBeenCalledWith('save_app_setting', {
        key: 'lastChatId',
        value: 'chat-123',
      });
    });

    it('should handle deleteChat', () => {
      const stateWithChats = {
        ...initialState,
        chatsByWorkspaceId: {
          w1: [{ id: '1', title: 'Chat 1', timestamp: 123 }],
        },
        selectedChatId: '1',
      };
      const state = chatsReducer(
        stateWithChats,
        deleteChat({ workspaceId: 'w1', chatId: '1' })
      );
      expect(state.chatsByWorkspaceId['w1']).toHaveLength(0);
      expect(state.selectedChatId).toBeNull();
    });
  });

  describe('Extra Reducers (Thunks)', () => {
    it('fetchChats.fulfilled should update state', async () => {
      const mockDbChats = [
        {
          id: '1',
          workspace_id: 'w1',
          title: 'Chat 1',
          last_message: 'hello',
          updated_at: 1000,
        },
      ];

      (invokeCommand as any).mockImplementation((command: string) => {
        if (command === 'get_chats') return Promise.resolve(mockDbChats);
        if (command === 'get_app_setting') return Promise.resolve('1');
        return Promise.resolve();
      });

      const dispatch = vi.fn();
      const thunk = fetchChats('w1');
      const result = await thunk(dispatch, () => ({}), {});

      const state = chatsReducer(initialState, result as any);

      expect(state.chatsByWorkspaceId['w1']).toHaveLength(1);
      expect(state.chatsByWorkspaceId['w1'][0].title).toBe('Chat 1');
      expect(state.selectedChatId).toBe('1');
    });

    it('createChat.fulfilled should add a new chat', async () => {
      const mockId = 'fixed-uuid';
      vi.stubGlobal('crypto', {
        randomUUID: () => mockId,
      });

      (invokeCommand as any).mockResolvedValue({});

      const dispatch = vi.fn();
      const thunk = createChat({ workspaceId: 'w1', title: 'New Chat' });
      const result = await thunk(dispatch, () => ({}), {});

      const state = chatsReducer(initialState, result as any);

      expect(state.chatsByWorkspaceId['w1']).toHaveLength(1);
      expect(state.chatsByWorkspaceId['w1'][0].id).toBe(mockId);
      expect(state.selectedChatId).toBe(mockId);
    });

    it('updateChatTitle.fulfilled should update title in all workspaces', async () => {
      const stateWithChats = {
        ...initialState,
        chatsByWorkspaceId: {
          w1: [{ id: '1', title: 'Old Title', timestamp: 123 }],
          w2: [{ id: '1', title: 'Old Title', timestamp: 123 }],
        },
      };

      const action = {
        type: updateChatTitle.fulfilled.type,
        payload: { id: '1', title: 'New Title' },
      };

      const state = chatsReducer(stateWithChats, action as any);
      expect(state.chatsByWorkspaceId['w1'][0].title).toBe('New Title');
      expect(state.chatsByWorkspaceId['w2'][0].title).toBe('New Title');
    });
  });
});
