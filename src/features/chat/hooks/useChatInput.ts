import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  setInput,
  setSelectedModel,
  setAttachedFiles,
  clearInput,
  restoreChatInputSettings,
  setIsThinkingEnabled,
  setReasoningEffort,
} from '../state/chatInputSlice';
import {
  loadChatInputSettings,
  saveChatInputSettings,
} from '@/features/chat/lib/chat-input-settings-storage';
import { useWorkspaces } from '@/features/workspace';

/**
 * Hook to access and manage chat input state
 */
export function useChatInput(selectedWorkspaceId: string | null) {
  const dispatch = useAppDispatch();
  const isLoadingSettingsRef = useRef(false);
  const { workspaceSettings } = useWorkspaces();

  // Selectors
  const input = useAppSelector((state) => state.chatInput.input);
  const selectedModel = useAppSelector(
    (state) => state.chatInput.selectedModel
  );
  const attachedFiles = useAppSelector(
    (state) => state.chatInput.attachedFiles
  );
  const isLoading = useAppSelector((state) => state.chatInput.isLoading);
  const isThinkingEnabled = useAppSelector(
    (state) => state.chatInput.isThinkingEnabled
  );
  const reasoningEffort = useAppSelector(
    (state) => state.chatInput.reasoningEffort
  );

  // Get current workspace settings - memoize to avoid unnecessary re-renders
  const currentWorkspaceSettings = useMemo(() => {
    if (!selectedWorkspaceId) return null;
    return workspaceSettings[selectedWorkspaceId] || null;
  }, [selectedWorkspaceId, workspaceSettings]);

  // Get streamEnabled from workspace settings
  const streamEnabled = useMemo(() => {
    if (!selectedWorkspaceId) return true; // Default to true
    return currentWorkspaceSettings?.streamEnabled ?? true;
  }, [selectedWorkspaceId, currentWorkspaceSettings?.streamEnabled]);

  // Load chat input settings when workspace changes
  useEffect(() => {
    if (!selectedWorkspaceId) return;

    isLoadingSettingsRef.current = true;
    const savedSettings = loadChatInputSettings(selectedWorkspaceId);

    // Priority: saved model > default model from workspace settings
    // This ensures user's model selection persists across app restarts and message edits
    const modelToUse =
      savedSettings?.selectedModel || currentWorkspaceSettings?.defaultModel;

    // Calculate streamEnabled from workspace settings
    const workspaceStreamEnabled =
      currentWorkspaceSettings?.streamEnabled ?? true;

    // Restore settings with priority: default model > saved model
    dispatch(
      restoreChatInputSettings({
        selectedModel: modelToUse,
        streamEnabled: savedSettings?.streamEnabled ?? workspaceStreamEnabled,
      })
    );

    // Reset flag after a short delay to allow state to update
    setTimeout(() => {
      isLoadingSettingsRef.current = false;
    }, 100);
  }, [
    selectedWorkspaceId,
    dispatch,
    currentWorkspaceSettings?.defaultModel,
    currentWorkspaceSettings?.streamEnabled,
  ]);

  // Save chat input settings when they change (within same workspace)
  // Skip saving if we're currently loading settings to avoid overwriting
  useEffect(() => {
    if (!selectedWorkspaceId || isLoadingSettingsRef.current) return;

    saveChatInputSettings(selectedWorkspaceId, {
      selectedModel,
      streamEnabled,
    });
  }, [selectedWorkspaceId, selectedModel, streamEnabled]);

  // Handlers
  const handleInputChange = useCallback(
    (value: string) => {
      dispatch(setInput(value));
    },
    [dispatch]
  );

  const handleModelChange = useCallback(
    (model: string | undefined) => {
      dispatch(setSelectedModel(model));
    },
    [dispatch]
  );

  const handleFileUpload = useCallback(
    (files: File[]) => {
      dispatch(setAttachedFiles(files));
    },
    [dispatch]
  );

  const handleClearInput = useCallback(() => {
    dispatch(clearInput());
  }, [dispatch]);

  const handleThinkingToggle = useCallback(() => {
    dispatch(setIsThinkingEnabled(!isThinkingEnabled));
  }, [dispatch, isThinkingEnabled]);

  const handleReasoningEffortChange = useCallback(
    (effort: 'low' | 'medium' | 'high') => {
      dispatch(setReasoningEffort(effort));
    },
    [dispatch]
  );

  return {
    input,
    selectedModel,
    streamEnabled,
    attachedFiles,
    isLoading,
    handleInputChange,
    handleModelChange,
    handleFileUpload,
    handleClearInput,
    isThinkingEnabled,
    reasoningEffort,
    handleThinkingToggle,
    handleReasoningEffortChange,
  };
}
