import { configureStore } from '@reduxjs/toolkit';
import { llmConnectionsReducer } from '@/features/llm';
import { mcpConnectionsReducer } from '@/features/mcp';
import {
  workspacesReducer,
  workspaceSettingsReducer,
} from '@/features/workspace';
import {
  chatsReducer,
  messagesReducer,
  chatInputReducer,
  chatSearchReducer,
} from '@/features/chat';
import uiReducer from './slices/uiSlice';
import notificationReducer from './slices/notificationSlice';
import toolPermissionReducer from './slices/toolPermissionSlice';
import { sentryMiddleware } from './sentryMiddleware';

import { baseApi } from './api/baseApi';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    llmConnections: llmConnectionsReducer,
    mcpConnections: mcpConnectionsReducer,
    workspaces: workspacesReducer,
    chats: chatsReducer,
    messages: messagesReducer,
    workspaceSettings: workspaceSettingsReducer,
    ui: uiReducer,
    chatInput: chatInputReducer,
    notifications: notificationReducer,
    chatSearch: chatSearchReducer,
    toolPermission: toolPermissionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sentryMiddleware, baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
