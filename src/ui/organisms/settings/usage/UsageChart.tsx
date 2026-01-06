import { UsageChartPoint } from '@/models/usage';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/atoms/card';
import { TrendingUp } from 'lucide-react';

interface UsageChartProps {
  data: UsageChartPoint[];
  loading?: boolean;
}

export function UsageChart({ data, loading }: UsageChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Usage Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full">
          {loading ? (
            <div className="h-full w-full flex flex-col gap-2 items-center justify-center">
              <div className="h-full w-full bg-muted/20 animate-pulse rounded-lg" />
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  yAxisId="left"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toFixed(3)}`}
                  orientation="right"
                  yAxisId="right"
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{
                    color: 'hsl(var(--popover-foreground))',
                    fontWeight: 600,
                  }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                  }}
                />
                <Bar
                  dataKey="tokens"
                  fill="hsl(var(--chart-1))"
                  radius={[6, 6, 0, 0]}
                  yAxisId="left"
                  name="Tokens"
                />
                <Bar
                  dataKey="cost"
                  fill="hsl(var(--chart-2))"
                  radius={[6, 6, 0, 0]}
                  yAxisId="right"
                  name="Cost ($)"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="p-4 rounded-full bg-muted/50">
                <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No data available
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
