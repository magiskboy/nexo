import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FlowData } from '../types';

interface ChatInputState {
  input: string;
  selectedModel: string | undefined;
  streamEnabled: boolean;
  attachedFiles: File[];
  attachedFlow: FlowData | null;
  isLoading: boolean;
  isThinkingEnabled: boolean;
  reasoningEffort: 'low' | 'medium' | 'high';
}

const initialState: ChatInputState = {
  input: '',
  selectedModel: undefined,
  streamEnabled: true,
  attachedFiles: [],
  attachedFlow: null,
  isLoading: false,
  isThinkingEnabled: false,
  reasoningEffort: 'medium',
};

const chatInputSlice = createSlice({
  name: 'chatInput',
  initialState,
  reducers: {
    setInput: (state, action: PayloadAction<string>) => {
      state.input = action.payload;
    },
    setSelectedModel: (state, action: PayloadAction<string | undefined>) => {
      state.selectedModel = action.payload;
    },
    setStreamEnabled: (state, action: PayloadAction<boolean>) => {
      state.streamEnabled = action.payload;
    },
    setAttachedFiles: (state, action: PayloadAction<File[]>) => {
      state.attachedFiles = action.payload;
    },
    setAttachedFlow: (state, action: PayloadAction<FlowData | null>) => {
      state.attachedFlow = action.payload;
    },
    clearInput: (state) => {
      state.input = '';
      state.attachedFiles = [];
      state.attachedFlow = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setIsThinkingEnabled: (state, action: PayloadAction<boolean>) => {
      state.isThinkingEnabled = action.payload;
    },
    setReasoningEffort: (
      state,
      action: PayloadAction<'low' | 'medium' | 'high'>
    ) => {
      state.reasoningEffort = action.payload;
    },
    resetChatInput: (state) => {
      state.input = '';
      state.selectedModel = undefined;
      state.streamEnabled = true;
      state.attachedFiles = [];
      state.attachedFlow = null;
      state.isThinkingEnabled = false;
      state.reasoningEffort = 'medium';
      state.isLoading = false;
    },
    restoreChatInputSettings: (
      state,
      action: PayloadAction<{
        selectedModel?: string;
        streamEnabled?: boolean;
      }>
    ) => {
      if (action.payload.selectedModel !== undefined) {
        state.selectedModel = action.payload.selectedModel;
      }
      if (action.payload.streamEnabled !== undefined) {
        state.streamEnabled = action.payload.streamEnabled;
      }
    },
  },
});

export const {
  setInput,
  setSelectedModel,
  setStreamEnabled,
  setAttachedFiles,
  setAttachedFlow,
  clearInput,
  setLoading,
  setIsThinkingEnabled,
  setReasoningEffort,
  resetChatInput,
  restoreChatInputSettings,
} = chatInputSlice.actions;
export default chatInputSlice.reducer;
