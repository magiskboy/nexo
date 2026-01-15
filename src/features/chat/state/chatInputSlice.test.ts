import { describe, it, expect } from 'vitest';
import chatInputReducer, {
  setInput,
  clearInput,
  setSelectedModel,
  resetChatInput,
} from './chatInputSlice';

describe('chatInputSlice', () => {
  const initialState = {
    input: '',
    selectedModel: undefined,
    streamEnabled: true,
    attachedFiles: [],
    attachedFlow: null,
    isLoading: false,
    isThinkingEnabled: false,
    reasoningEffort: 'medium' as const,
  };

  it('should handle setInput', () => {
    const state = chatInputReducer(initialState, setInput('hello'));
    expect(state.input).toBe('hello');
  });

  it('should handle clearInput', () => {
    const state = chatInputReducer(
      { ...initialState, input: 'bye' },
      clearInput()
    );
    expect(state.input).toBe('');
  });

  it('should handle setSelectedModel', () => {
    const state = chatInputReducer(initialState, setSelectedModel('gpt-4'));
    expect(state.selectedModel).toBe('gpt-4');
  });

  it('should handle resetChatInput', () => {
    const customState = {
      input: 'active',
      selectedModel: 'model-x',
      streamEnabled: false,
      attachedFiles: [],
      attachedFlow: null,
      isLoading: true,
      isThinkingEnabled: true,
      reasoningEffort: 'high' as const,
    };
    const state = chatInputReducer(customState, resetChatInput());
    expect(state).toEqual(initialState);
  });
});
