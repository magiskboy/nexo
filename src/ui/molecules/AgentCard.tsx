import { Bot, Loader2, ExternalLink } from 'lucide-react';
import { Card } from '@/ui/atoms/card';
import { Button } from '@/ui/atoms/button/button';

interface AgentCardProps {
  agentId: string;
  sessionId: string;
  status: 'running' | 'completed' | 'failed';
  onViewDetails?: (sessionId: string) => void;
}

export function AgentCard({
  agentId,
  sessionId,
  status,
  onViewDetails,
  children,
}: AgentCardProps & { children?: React.ReactNode }) {
  return (
    <Card className="p-4 border-l-4 border-l-primary flex flex-col gap-4 max-w-xl bg-muted/30">
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-background rounded-full border shadow-sm">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2">
              Agent: {agentId}
              {status === 'running' && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </h4>
            <p className="text-xs text-muted-foreground">
              {status === 'running' ? 'Working on task...' : 'Task completed'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails?.(sessionId)}
          className="h-8"
        >
          View Details <ExternalLink className="ml-2 h-3 w-3" />
        </Button>
      </div>
      {children && <div className="text-sm border-t pt-2 mt-1">{children}</div>}
    </Card>
  );
}
