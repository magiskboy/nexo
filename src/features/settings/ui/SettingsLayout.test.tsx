import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsLayout } from './SettingsLayout';
import { navigateToChat } from '@/features/ui/state/uiSlice';

const mockDispatch = vi.fn();
// Mock dependencies
vi.mock('@/app/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}));

vi.mock('@/features/ui/state/uiSlice', () => ({
  navigateToChat: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="back-icon" />,
}));

vi.mock('@/ui/atoms/button/button', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('@/ui/atoms/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe('SettingsLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, sidebar and children', () => {
    render(
      <SettingsLayout title="Settings" sidebar={<div>Sidebar Content</div>}>
        <div>Main Content</div>
      </SettingsLayout>
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', () => {
    render(
      <SettingsLayout title="Settings" sidebar={<div />}>
        <div />
      </SettingsLayout>
    );

    const backButton = screen.getByTestId('back-icon').closest('button');
    if (backButton) fireEvent.click(backButton); // Safely handle possible null element

    expect(mockDispatch).toHaveBeenCalled();
    expect(navigateToChat).toHaveBeenCalled();
  });
});
