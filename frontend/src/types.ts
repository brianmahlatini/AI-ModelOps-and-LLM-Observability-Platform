export interface SeriesPoint {
  date: string
  requests: number
  cost_usd: number
  quality_score: number | null
}

export interface Overview {
  total_requests: number
  success_rate: number
  avg_latency_ms: number
  p95_latency_ms: number
  total_cost_usd: number
  input_tokens: number
  output_tokens: number
  avg_quality_score: number | null
  hallucination_rate: number | null
  scored_traces: number
  previous_scored_traces: number
  quality_change_pp: number | null
  requests_change_pct: number | null
  success_rate_change_pp: number | null
  p95_latency_change_pct: number | null
  cost_change_pct: number | null
  series: SeriesPoint[]
}

export interface Trace {
  id: string
  timestamp: string
  name: string
  provider: string
  model: string
  environment: string
  status: string
  input_tokens: number
  output_tokens: number
  latency_ms: number
  cost_usd: number
  prompt_version: string
  feedback_score: number | null
  quality_score: number | null
  hallucination_score: number | null
  input_text: string
  output_text: string
}

export interface ModelMetrics {
  provider: string
  model: string
  requests: number
  success_rate: number
  avg_latency_ms: number
  avg_cost_usd: number
  avg_quality_score: number | null
}

export interface PromptVersion {
  prompt_key: string
  version: string
  description: string
  template: string
  is_active: boolean
  created_at: string
  requests: number
  avg_quality_score: number | null
}

export interface Alert {
  id: string
  severity: 'warning' | 'critical'
  title: string
  description: string
  metric: string
  value: number
}
