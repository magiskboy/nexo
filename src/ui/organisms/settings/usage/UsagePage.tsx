import { useState, useEffect } from 'react';
import { UsageHeader } from './UsageHeader';
import { UsageOverview } from './UsageOverview';
import { UsageChart } from './UsageChart';
import { UsageLogs } from './UsageLogs';
import {
  UsageFilter,
  UsageSummary,
  UsageChartPoint,
  UsageStat,
} from '@/models/usage';
import { invoke } from '@tauri-apps/api/core';

export function UsagePage() {
  const [filter, setFilter] = useState<UsageFilter>({});
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [chartData, setChartData] = useState<UsageChartPoint[]>([]);
  const [logs, setLogs] = useState<UsageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState('day');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const summaryData = await invoke<UsageSummary>('get_usage_summary', {
          filter,
        });
        setSummary(summaryData);

        const chartDataRes = await invoke<UsageChartPoint[]>(
          'get_usage_chart',
          {
            filter,
            interval,
          }
        );
        setChartData(chartDataRes);

        const logsRes = await invoke<UsageStat[]>('get_usage_logs', {
          filter,
          page,
          limit: LIMIT,
        });
        setLogs(logsRes);
      } catch (error) {
        console.error('Failed to fetch usage data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter, interval, page]);

  return (
    <div className="space-y-8">
      <UsageHeader
        filter={filter}
        onFilterChange={setFilter}
        interval={interval}
        onIntervalChange={setInterval}
      />

      <div
        className={`space-y-6 transition-opacity duration-300 ${
          loading ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {summary && <UsageOverview summary={summary} loading={loading} />}

        <UsageChart data={chartData} loading={loading} />

        <UsageLogs
          logs={logs}
          page={page}
          limit={LIMIT}
          onPageChange={setPage}
          hasMore={logs.length === LIMIT}
          loading={loading}
        />
      </div>
    </div>
  );
}
