export interface UsageStat {
  id: string;
  workspace_id: string;
  chat_id: string;
  message_id: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  latency_ms: number;
  cost: number;
  timestamp: number;
  is_stream: boolean;
  status: string;
  request_type: string;
}

export interface UsageFilter {
  workspace_id?: string;
  provider?: string;
  model?: string;
  date_from?: number;
  date_to?: number;
}

export interface UsageSummary {
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
  total_requests: number;
  average_latency: number;
}

export interface UsageChartPoint {
  timestamp: number;
  requests: number;
  cost: number;
  input_tokens: number;
  output_tokens: number;
}
