import { useState, useEffect, useCallback } from 'react';
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

import { useAppDispatch } from '@/store/hooks';
import { showSuccess, showError } from '@/store/slices/notificationSlice';

export function UsagePage() {
  const dispatch = useAppDispatch();
  const [filter, setFilter] = useState<UsageFilter>({});
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [chartData, setChartData] = useState<UsageChartPoint[]>([]);
  const [logs, setLogs] = useState<UsageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState('day');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // Function to refresh data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const summaryData = await invoke<UsageSummary>('get_usage_summary', {
        filter,
      });
      setSummary(summaryData);

      const chartDataRes = await invoke<UsageChartPoint[]>('get_usage_chart', {
        filter,
        interval,
      });
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
  }, [filter, interval, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClearUsage = async () => {
    try {
      await invoke('clear_usage');
      dispatch(showSuccess('Usage data cleared successfully'));
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Failed to clear usage data:', error);
      dispatch(showError('Failed to clear usage data'));
    }
  };

  return (
    <div className="space-y-8">
      <UsageHeader
        filter={filter}
        onFilterChange={setFilter}
        interval={interval}
        onIntervalChange={setInterval}
        onClearUsage={handleClearUsage}
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
