import { describe, it, expect } from 'vitest';
import toolPermissionReducer, {
  addPermissionRequest,
  removePermissionRequest,
  clearAllRequests,
  type PermissionRequest,
} from './toolPermissionSlice';

describe('toolPermissionSlice', () => {
  const initialState = {
    pendingRequests: {},
  };

  const mockPermissionRequest: PermissionRequest = {
    chatId: 'chat-123',
    messageId: 'msg-456',
    toolCalls: [
      {
        id: 'tool-1',
        name: 'search_web',
        arguments: { query: 'test query' },
      },
    ],
    timestamp: Date.now(),
  };

  describe('Reducers', () => {
    it('should return the initial state', () => {
      expect(toolPermissionReducer(undefined, { type: 'unknown' })).toEqual(
        initialState
      );
    });

    it('should handle addPermissionRequest', () => {
      const state = toolPermissionReducer(
        initialState,
        addPermissionRequest(mockPermissionRequest)
      );

      expect(state.pendingRequests['msg-456']).toEqual(mockPermissionRequest);
      expect(Object.keys(state.pendingRequests)).toHaveLength(1);
    });

    it('should add multiple permission requests', () => {
      const request1: PermissionRequest = {
        chatId: 'chat-1',
        messageId: 'msg-1',
        toolCalls: [{ id: 'tool-1', name: 'tool_a', arguments: {} }],
        timestamp: 1000,
      };

      const request2: PermissionRequest = {
        chatId: 'chat-2',
        messageId: 'msg-2',
        toolCalls: [{ id: 'tool-2', name: 'tool_b', arguments: {} }],
        timestamp: 2000,
      };

      let state = toolPermissionReducer(
        initialState,
        addPermissionRequest(request1)
      );
      state = toolPermissionReducer(state, addPermissionRequest(request2));

      expect(Object.keys(state.pendingRequests)).toHaveLength(2);
      expect(state.pendingRequests['msg-1']).toEqual(request1);
      expect(state.pendingRequests['msg-2']).toEqual(request2);
    });

    it('should overwrite existing permission request with same messageId', () => {
      const request1: PermissionRequest = {
        chatId: 'chat-1',
        messageId: 'msg-1',
        toolCalls: [{ id: 'tool-1', name: 'tool_a', arguments: {} }],
        timestamp: 1000,
      };

      const request2: PermissionRequest = {
        chatId: 'chat-1',
        messageId: 'msg-1',
        toolCalls: [{ id: 'tool-2', name: 'tool_b', arguments: {} }],
        timestamp: 2000,
      };

      let state = toolPermissionReducer(
        initialState,
        addPermissionRequest(request1)
      );
      state = toolPermissionReducer(state, addPermissionRequest(request2));

      expect(Object.keys(state.pendingRequests)).toHaveLength(1);
      expect(state.pendingRequests['msg-1']).toEqual(request2);
      expect(state.pendingRequests['msg-1'].timestamp).toBe(2000);
    });

    it('should handle removePermissionRequest', () => {
      const stateWithRequests = {
        pendingRequests: {
          'msg-1': mockPermissionRequest,
          'msg-2': { ...mockPermissionRequest, messageId: 'msg-2' },
        },
      };

      const state = toolPermissionReducer(
        stateWithRequests,
        removePermissionRequest('msg-1')
      );

      expect(state.pendingRequests['msg-1']).toBeUndefined();
      expect(state.pendingRequests['msg-2']).toBeDefined();
      expect(Object.keys(state.pendingRequests)).toHaveLength(1);
    });

    it('should handle removePermissionRequest for non-existent request', () => {
      const state = toolPermissionReducer(
        initialState,
        removePermissionRequest('non-existent')
      );

      expect(state.pendingRequests).toEqual({});
    });

    it('should handle clearAllRequests', () => {
      const stateWithRequests = {
        pendingRequests: {
          'msg-1': mockPermissionRequest,
          'msg-2': { ...mockPermissionRequest, messageId: 'msg-2' },
          'msg-3': { ...mockPermissionRequest, messageId: 'msg-3' },
        },
      };

      const state = toolPermissionReducer(
        stateWithRequests,
        clearAllRequests()
      );

      expect(state.pendingRequests).toEqual({});
      expect(Object.keys(state.pendingRequests)).toHaveLength(0);
    });

    it('should handle permission request with multiple tool calls', () => {
      const requestWithMultipleTools: PermissionRequest = {
        chatId: 'chat-123',
        messageId: 'msg-789',
        toolCalls: [
          { id: 'tool-1', name: 'search_web', arguments: { query: 'test' } },
          { id: 'tool-2', name: 'read_file', arguments: { path: '/test' } },
          { id: 'tool-3', name: 'write_file', arguments: { path: '/out' } },
        ],
        timestamp: Date.now(),
      };

      const state = toolPermissionReducer(
        initialState,
        addPermissionRequest(requestWithMultipleTools)
      );

      expect(state.pendingRequests['msg-789'].toolCalls).toHaveLength(3);
      expect(state.pendingRequests['msg-789'].toolCalls[0].name).toBe(
        'search_web'
      );
      expect(state.pendingRequests['msg-789'].toolCalls[1].name).toBe(
        'read_file'
      );
      expect(state.pendingRequests['msg-789'].toolCalls[2].name).toBe(
        'write_file'
      );
    });
  });
});
