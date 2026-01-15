import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSlashCommand } from './useSlashCommand';
import { invokeCommand } from '@/lib/tauri';

vi.mock('@/lib/tauri', () => ({
  invokeCommand: vi.fn(),
  TauriCommands: {
    GET_PROMPTS: 'get_prompts',
  },
}));

describe('useSlashCommand', () => {
  const mockPrompts = [
    { id: '1', name: 'Summarize', content: '...' },
    { id: '2', name: 'Translate', content: '...' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (invokeCommand as any).mockResolvedValue(mockPrompts);
  });

  it('should be inactive by default', () => {
    const { result } = renderHook(() => useSlashCommand({ input: '' }));
    expect(result.current.isActive).toBe(false);
  });

  it('should be active when input starts with /', async () => {
    const { result } = renderHook(() => useSlashCommand({ input: '/' }));
    expect(result.current.isActive).toBe(true);
    expect(result.current.query).toBe('');

    await waitFor(() => {
      expect(result.current.filteredPrompts).toHaveLength(2);
    });
  });

  it('should filter prompts based on query', async () => {
    const { result, rerender } = renderHook((props) => useSlashCommand(props), {
      initialProps: { input: '/sum' },
    });

    await waitFor(() => {
      expect(result.current.filteredPrompts).toHaveLength(1);
    });
    expect(result.current.filteredPrompts[0].name).toBe('Summarize');

    rerender({ input: '/tra' });
    expect(result.current.filteredPrompts[0].name).toBe('Translate');
  });

  it('should close when close() is called', async () => {
    const { result } = renderHook(() => useSlashCommand({ input: '/' }));

    await waitFor(() => expect(result.current.isActive).toBe(true));

    act(() => {
      result.current.close();
    });

    expect(result.current.isActive).toBe(false);
  });
});
