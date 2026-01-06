import { UsageSummary } from '@/models/usage';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/atoms/card';
import { Activity, Coins, MessageSquare, Zap } from 'lucide-react';

interface UsageOverviewProps {
  summary: UsageSummary;
  loading?: boolean;
}

const SkeletonCard = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
    </CardHeader>
    <CardContent>
      <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
    </CardContent>
  </Card>
);

export function UsageOverview({ summary, loading }: UsageOverviewProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:bg-accent/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Total Cost</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            ${summary.total_cost.toFixed(4)}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:bg-accent/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Total Tokens</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {(
              summary.total_input_tokens + summary.total_output_tokens
            ).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {summary.total_input_tokens.toLocaleString()} in /{' '}
            {summary.total_output_tokens.toLocaleString()} out
          </p>
        </CardContent>
      </Card>

      <Card className="hover:bg-accent/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Total Requests</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {summary.total_requests.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:bg-accent/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Avg Latency</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {summary.average_latency.toFixed(0)}
            <span className="text-lg font-normal ml-1">ms</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
