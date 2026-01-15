import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommunityPromptsSection } from './CommunityPromptsSection';
import { TauriCommands } from '@/lib/tauri';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Download: () => <div data-testid="download-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  RefreshCw: ({ className }: { className?: string }) => (
    <div data-testid="refresh-icon" className={className} />
  ),
  Search: () => <div data-testid="search-icon" />,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Tauri/Backend
const mockInvokeCommand = vi.fn();
vi.mock('@/lib/tauri', async () => {
  const actual = await vi.importActual('@/lib/tauri');
  return {
    ...actual,
    invokeCommand: (...args: any[]) => mockInvokeCommand(...args),
  };
});

// Mock Redux/State
const mockDispatch = vi.fn();
vi.mock('@/app/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}));

vi.mock('@/features/notifications/state/notificationSlice', () => ({
  showError: (msg: string) => ({ type: 'error', payload: msg }),
  showSuccess: (msg: string) => ({ type: 'success', payload: msg }),
}));

// Mock UI atoms to avoid potential issues with Radix UI or other complex components
vi.mock('@/ui/atoms/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const mockPrompts = [
  {
    id: 'prompt-1',
    name: 'Prompt 1',
    description: 'Description 1',
    icon: 'icon-1.png',
  },
  {
    id: 'prompt-2',
    name: 'Prompt 2',
    description: 'Description 2',
    icon: 'icon-2.png',
  },
];

describe('CommunityPromptsSection', () => {
  const defaultProps = {
    installedPromptIds: ['prompt-1'],
    onInstall: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeCommand.mockResolvedValue([]);
  });

  it('renders loading state initially', async () => {
    // Keep it loading
    mockInvokeCommand.mockReturnValue(new Promise(() => {}));

    render(<CommunityPromptsSection {...defaultProps} />);

    // Check for skeleton cards
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state when fetching fails', async () => {
    const errorMessage = 'Network Error';
    mockInvokeCommand.mockRejectedValue(new Error(errorMessage));

    render(<CommunityPromptsSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(screen.getByText('retry')).toBeInTheDocument();
  });

  it('renders empty state when no prompts found', async () => {
    mockInvokeCommand.mockResolvedValue([]);

    render(<CommunityPromptsSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('noHubPrompts')).toBeInTheDocument();
    });
  });

  it('renders prompts and handles search', async () => {
    mockInvokeCommand.mockResolvedValue(mockPrompts);

    render(<CommunityPromptsSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Prompt 1')).toBeInTheDocument();
      expect(screen.getByText('Prompt 2')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('searchPrompts');
    fireEvent.change(searchInput, { target: { value: 'Prompt 1' } });

    expect(screen.getByText('Prompt 1')).toBeInTheDocument();
    expect(screen.queryByText('Prompt 2')).not.toBeInTheDocument();
  });

  it('handles install button click', async () => {
    mockInvokeCommand.mockResolvedValue(mockPrompts);

    render(<CommunityPromptsSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Prompt 1')).toBeInTheDocument();
    });

    // Prompt 1 is installed
    const installedBtns = screen.getAllByRole('button');
    const installedBtn = installedBtns.find((btn) =>
      btn.textContent?.includes('installed')
    );
    expect(installedBtn).toBeDisabled();

    // Prompt 2 is not installed
    const installBtn = installedBtns.find(
      (btn) =>
        btn.textContent?.includes('install') &&
        !btn.textContent?.includes('installed')
    );
    expect(installBtn).not.toBeDisabled();

    if (installBtn) {
      fireEvent.click(installBtn);
      expect(defaultProps.onInstall).toHaveBeenCalledWith(mockPrompts[1]);
    } else {
      throw new Error('Install button not found');
    }
  });

  it('handles refresh button click', async () => {
    mockInvokeCommand.mockResolvedValue(mockPrompts);

    render(<CommunityPromptsSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Prompt 1')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByText('refresh');

    // Reset call counts for invokeCommand since it was called twice in loading
    mockInvokeCommand.mockClear();

    mockInvokeCommand.mockResolvedValueOnce(undefined); // REFRESH_HUB_INDEX
    mockInvokeCommand.mockResolvedValueOnce(mockPrompts); // FETCH_HUB_PROMPTS

    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(mockInvokeCommand).toHaveBeenCalledWith(
        TauriCommands.REFRESH_HUB_INDEX
      );
      expect(mockInvokeCommand).toHaveBeenCalledWith(
        TauriCommands.FETCH_HUB_PROMPTS
      );
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'success',
      payload: 'hubIndexRefreshed',
    });
  });

  it('handles retry button in error state', async () => {
    mockInvokeCommand.mockRejectedValueOnce(new Error('Failed'));

    render(<CommunityPromptsSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    const retryBtn = screen.getByText('retry');
    mockInvokeCommand.mockResolvedValueOnce(mockPrompts);

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Prompt 1')).toBeInTheDocument();
    });
  });
});
