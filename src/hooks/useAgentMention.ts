import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { invokeCommand, TauriCommands } from '@/lib/tauri';
import type { InstalledAgent } from '@/store/types';

interface UseAgentMentionOptions {
  input: string;
  onSelectAgent?: (agent: InstalledAgent) => void;
}

interface UseAgentMentionReturn {
  isActive: boolean;
  query: string;
  selectedIndex: number;
  filteredAgents: InstalledAgent[];
  handleKeyDown: (e: React.KeyboardEvent) => boolean; // Returns true if handled
  handleSelect: (agent: InstalledAgent) => void;
  close: () => void;
}

export function useAgentMention({
  input,
  onSelectAgent,
}: UseAgentMentionOptions): UseAgentMentionReturn {
  const [agents, setAgents] = useState<InstalledAgent[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setIsLoading] = useState(false);
  const [forceClosed, setForceClosed] = useState(false);
  const prevInputRef = useRef<string>('');

  // Load agents function
  const loadAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invokeCommand<InstalledAgent[]>(
        TauriCommands.GET_INSTALLED_AGENTS
      );
      setAgents(data);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Reset forceClosed when input changes and starts with "@" followed by non-whitespace
  useEffect(() => {
    if (forceClosed) {
      const prevInput = prevInputRef.current;
      const prevHasValidTrigger =
        prevInput.startsWith('@') &&
        (prevInput.length === 1 || !/\s/.test(prevInput[1]));

      const hasValidTrigger =
        input.startsWith('@') && (input.length === 1 || !/\s/.test(input[1]));

      const inputChanged = input !== prevInput;
      const isNewTrigger =
        inputChanged && !prevHasValidTrigger && hasValidTrigger;

      if (isNewTrigger) {
        setForceClosed(false);
      }
    }
    prevInputRef.current = input;
  }, [input, forceClosed]);

  // Detect mention command and extract query
  const { isActive, query } = useMemo(() => {
    if (forceClosed) {
      return { isActive: false, query: '' };
    }

    if (!input.startsWith('@')) {
      return { isActive: false, query: '' };
    }

    // Allow just "@" to trigger it
    if (input.length > 1 && /\s/.test(input[1])) {
      return { isActive: false, query: '' };
    }

    // Extract query after "@"
    const afterTrigger = input.substring(1);
    const spaceIndex = afterTrigger.indexOf(' ');
    const query =
      spaceIndex === -1 ? afterTrigger : afterTrigger.substring(0, spaceIndex);

    return { isActive: true, query };
  }, [input, forceClosed]);

  // Reload agents when active
  useEffect(() => {
    if (isActive) {
      loadAgents();
    }
  }, [isActive, loadAgents]);

  // Filter agents
  const filteredAgents = useMemo(() => {
    if (!isActive) {
      return [];
    }

    if (!query.trim()) {
      return agents;
    }

    const queryLower = query.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.manifest.id.toLowerCase().includes(queryLower) ||
        agent.manifest.name.toLowerCase().includes(queryLower)
    );
  }, [agents, query, isActive]);

  // Reset selected index
  useEffect(() => {
    if (filteredAgents.length > 0) {
      setSelectedIndex(0);
    }
  }, [filteredAgents.length]);

  // Handle selection
  const handleSelect = useCallback(
    (agent: InstalledAgent) => {
      onSelectAgent?.(agent);
    },
    [onSelectAgent]
  );

  // Keyboard nav
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!isActive) {
        return false;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredAgents.length - 1)
          );
          return true;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          return true;

        case 'Enter':
          if (filteredAgents[selectedIndex]) {
            e.preventDefault();
            handleSelect(filteredAgents[selectedIndex]);
            return true;
          }
          return false;

        case 'Escape':
          e.preventDefault();
          setForceClosed(true);
          return true;

        default:
          return false;
      }
    },
    [isActive, filteredAgents, selectedIndex, handleSelect]
  );

  // Close
  const close = useCallback(() => {
    setSelectedIndex(0);
    setForceClosed(true);
  }, []);

  return {
    isActive,
    query,
    selectedIndex,
    filteredAgents,
    handleKeyDown,
    handleSelect,
    close,
  };
}
