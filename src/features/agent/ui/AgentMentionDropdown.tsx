import { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/ui/atoms/scroll-area';
import type { InstalledAgent } from '../types';

interface AgentMentionDropdownProps {
  agents: InstalledAgent[];
  selectedIndex: number;
  onSelect: (agent: InstalledAgent) => void;
  position?: { top: number; left: number };
  direction?: 'up' | 'down';
}

export function AgentMentionDropdown({
  agents,
  selectedIndex,
  onSelect,
  position,
  direction = 'down',
}: AgentMentionDropdownProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll selected item into view
  useEffect(() => {
    if (scrollAreaRef.current && agents.length > 0 && selectedIndex >= 0) {
      const selectedElement = itemRefs.current[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex, agents.length]);

  if (agents.length === 0) {
    return null;
  }

  const handleClick = (agent: InstalledAgent) => {
    onSelect(agent);
  };

  const isUpward = direction === 'up';

  return (
    <div
      className={cn(
        'absolute z-50 w-full max-w-md rounded-lg border bg-popover shadow-lg',
        isUpward ? 'bottom-full mb-2' : 'top-full mt-2'
      )}
      style={{
        left: position?.left ? `${position.left}px` : '0',
      }}
    >
      <ScrollArea className="max-h-[200px]">
        <div className="p-1" ref={scrollAreaRef}>
          {agents.map((agent, index) => {
            const isSelected = index === selectedIndex;

            return (
              <div
                key={agent.manifest.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                onClick={() => handleClick(agent)}
                className={cn(
                  'flex items-start gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors',
                  'hover:bg-accent',
                  isSelected && 'bg-accent'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {agent.manifest.name}
                    </span>
                    <Bot className="size-3 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {agent.manifest.id}
                  </div>
                  {agent.manifest.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {agent.manifest.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
