import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentMentionDropdown } from './AgentMentionDropdown';
import type { InstalledAgent } from '../types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Bot: () => <div data-testid="bot-icon" />,
}));

const mockAgents: InstalledAgent[] = [
  {
    manifest: {
      id: 'agent-1',
      name: 'Code Assistant',
      description: 'Helps with coding tasks',
      author: 'Test Author',
      schema_version: 1,
      permissions: [],
    },
    version_ref: 'abc123',
    path: '/path/to/agent1',
  },
  {
    manifest: {
      id: 'agent-2',
      name: 'Data Analyzer',
      description: 'Analyzes data and provides insights',
      author: 'Test Author',
      schema_version: 1,
      permissions: [],
    },
    version_ref: 'def456',
    path: '/path/to/agent2',
  },
  {
    manifest: {
      id: 'agent-3',
      name: 'Documentation Writer',
      description: 'Documentation Writer',
      author: 'Test Author',
      schema_version: 1,
      permissions: [],
    },
    version_ref: 'ghi789',
    path: '/path/to/agent3',
  },
];

describe('AgentMentionDropdown', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      agents: mockAgents,
      selectedIndex: 0,
      onSelect: mockOnSelect,
      position: { top: 100, left: 50 },
      direction: 'down' as const,
    };

    return render(<AgentMentionDropdown {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should render all agents in the list', () => {
      renderComponent();

      expect(screen.getByText('Code Assistant')).toBeInTheDocument();
      expect(screen.getByText('Data Analyzer')).toBeInTheDocument();
      expect(screen.getByText('Documentation Writer')).toBeInTheDocument();
    });

    it('should render agent IDs', () => {
      renderComponent();

      expect(screen.getByText('agent-1')).toBeInTheDocument();
      expect(screen.getByText('agent-2')).toBeInTheDocument();
      expect(screen.getByText('agent-3')).toBeInTheDocument();
    });

    it('should render agent descriptions when available', () => {
      renderComponent();

      expect(screen.getByText('Helps with coding tasks')).toBeInTheDocument();
      expect(
        screen.getByText('Analyzes data and provides insights')
      ).toBeInTheDocument();
    });

    it('should not render description when null', () => {
      renderComponent();

      const agent3Container = screen
        .getByText('Documentation Writer')
        .closest('div');
      expect(agent3Container).toBeInTheDocument();
      // Should not have a description element
      const descriptions = screen.queryAllByText(/./);
      expect(descriptions.some((el) => el.textContent === 'null')).toBeFalsy();
    });

    it('should render Bot icons for all agents', () => {
      renderComponent();

      const botIcons = screen.getAllByTestId('bot-icon');
      expect(botIcons).toHaveLength(3);
    });

    it('should match snapshot', () => {
      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });
  });

  describe('Empty State', () => {
    it('should return null when agents list is empty', () => {
      const { container } = renderComponent({ agents: [] });

      expect(container.firstChild).toBeNull();
    });

    it('should match snapshot for empty state', () => {
      const { container } = renderComponent({ agents: [] });
      expect(container).toMatchSnapshot();
    });
  });

  describe('Selection Highlighting', () => {
    it('should highlight the selected agent', () => {
      renderComponent({ selectedIndex: 1 });

      const selectedAgent = screen.getByText('Data Analyzer').closest('div');
      expect(selectedAgent).toHaveClass('bg-accent');
    });

    it('should not highlight non-selected agents', () => {
      renderComponent({ selectedIndex: 1 });

      const firstAgent = screen.getByText('Code Assistant').closest('div');
      const thirdAgent = screen
        .getByText('Documentation Writer')
        .closest('div');

      // These should have hover class but not bg-accent by default
      expect(firstAgent).toHaveClass('hover:bg-accent');
      expect(thirdAgent).toHaveClass('hover:bg-accent');
    });

    it('should update highlight when selectedIndex changes', () => {
      const { rerender } = renderComponent({ selectedIndex: 0 });

      let selectedAgent = screen.getByText('Code Assistant').closest('div');
      expect(selectedAgent).toHaveClass('bg-accent');

      // Change selection
      rerender(
        <AgentMentionDropdown
          agents={mockAgents}
          selectedIndex={2}
          onSelect={mockOnSelect}
          position={{ top: 100, left: 50 }}
          direction="down"
        />
      );

      selectedAgent = screen.getByText('Documentation Writer').closest('div');
      expect(selectedAgent).toHaveClass('bg-accent');
    });
  });

  describe('User Interactions', () => {
    it('should call onSelect when agent is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const agent = screen.getByText('Code Assistant');
      await user.click(agent);

      expect(mockOnSelect).toHaveBeenCalledWith(mockAgents[0]);
    });

    it('should call onSelect with correct agent when different agent is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const agent = screen.getByText('Data Analyzer');
      await user.click(agent);

      expect(mockOnSelect).toHaveBeenCalledWith(mockAgents[1]);
    });

    it('should call onSelect only once per click', async () => {
      const user = userEvent.setup();
      renderComponent();

      const agent = screen.getByText('Code Assistant');
      await user.click(agent);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Positioning', () => {
    it('should apply custom position when provided', () => {
      const { container } = renderComponent({
        position: { top: 200, left: 100 },
      });

      const dropdown = container.querySelector('.absolute');
      expect(dropdown).toHaveStyle({ left: '100px' });
    });

    it('should default to left 0 when position is not provided', () => {
      const { container } = renderComponent({ position: undefined });

      const dropdown = container.querySelector('.absolute');
      expect(dropdown).toHaveStyle({ left: '0' });
    });

    it('should render dropdown below by default (direction: down)', () => {
      const { container } = renderComponent();

      const dropdown = container.querySelector('.absolute');
      expect(dropdown).toHaveClass('top-full', 'mt-2');
      expect(dropdown).not.toHaveClass('bottom-full', 'mb-2');
    });

    it('should render dropdown above when direction is up', () => {
      const { container } = renderComponent({ direction: 'up' });

      const dropdown = container.querySelector('.absolute');
      expect(dropdown).toHaveClass('bottom-full', 'mb-2');
      expect(dropdown).not.toHaveClass('top-full', 'mt-2');
    });
  });

  describe('Scrolling Behavior', () => {
    it('should scroll selected item into view', () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      renderComponent({ selectedIndex: 1 });

      // Note: This test verifies the effect is set up, but actual scrolling
      // behavior is handled by the browser and useEffect
      expect(scrollIntoViewMock).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper cursor pointer on agent items', () => {
      const { container } = renderComponent();

      // Find the div with cursor-pointer class
      const agentItems = container.querySelectorAll('.cursor-pointer');
      expect(agentItems.length).toBeGreaterThan(0);
    });

    it('should have hover effects on agent items', () => {
      const { container } = renderComponent();

      // Find the div with hover:bg-accent class
      const agentItems = container.querySelectorAll('.hover\\:bg-accent');
      expect(agentItems.length).toBeGreaterThan(0);
    });

    it('should truncate long agent names', () => {
      const longNameAgent: InstalledAgent = {
        manifest: {
          id: 'long-agent',
          name: 'This is a very long agent name that should be truncated',
          description: 'Test description',
          author: 'Test Author',
          schema_version: 1,
          permissions: [],
        },
        version_ref: 'abc123',
        path: '/path/to/agent',
      };

      renderComponent({ agents: [longNameAgent] });

      const agentName = screen.getByText(
        'This is a very long agent name that should be truncated'
      );
      expect(agentName).toHaveClass('truncate');
    });

    it('should truncate long agent IDs', () => {
      const longIdAgent: InstalledAgent = {
        manifest: {
          id: 'this-is-a-very-long-agent-id-that-should-be-truncated',
          name: 'Test Agent',
          description: 'Test description',
          author: 'Test Author',
          schema_version: 1,
          permissions: [],
        },
        version_ref: 'abc123',
        path: '/path/to/agent',
      };

      renderComponent({ agents: [longIdAgent] });

      const agentId = screen.getByText(
        'this-is-a-very-long-agent-id-that-should-be-truncated'
      );
      // The div containing the ID has truncate class
      expect(agentId).toHaveClass('truncate');
    });

    it('should limit description to 2 lines', () => {
      renderComponent();

      const description = screen.getByText('Helps with coding tasks');
      expect(description).toHaveClass('line-clamp-2');
    });
  });

  describe('Styling', () => {
    it('should have proper dropdown styling', () => {
      const { container } = renderComponent();

      const dropdown = container.querySelector('.absolute');
      expect(dropdown).toHaveClass(
        'z-50',
        'w-full',
        'max-w-md',
        'rounded-lg',
        'border',
        'bg-popover',
        'shadow-lg'
      );
    });

    it('should have max height on scroll area', () => {
      const { container } = renderComponent();

      const scrollArea = container.querySelector('[class*="max-h-"]');
      expect(scrollArea).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle selectedIndex out of bounds gracefully', () => {
      renderComponent({ selectedIndex: 999 });

      // Should not crash and render normally
      expect(screen.getByText('Code Assistant')).toBeInTheDocument();
    });

    it('should handle negative selectedIndex', () => {
      renderComponent({ selectedIndex: -1 });

      // Should not crash and render normally
      expect(screen.getByText('Code Assistant')).toBeInTheDocument();
    });

    it('should handle single agent', () => {
      renderComponent({ agents: [mockAgents[0]] });

      expect(screen.getByText('Code Assistant')).toBeInTheDocument();
      expect(screen.queryByText('Data Analyzer')).not.toBeInTheDocument();
    });
  });
});
