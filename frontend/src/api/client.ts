import type { Alert, ModelMetrics, Overview, PromptVersion, Trace } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) throw new Error(`API request failed (${response.status}): ${path}`)
  return response.json() as Promise<T>
}

export const api = {
  overview: () => request<Overview>('/overview'),
  traces: () => request<Trace[]>('/traces?limit=8'),
  models: () => request<ModelMetrics[]>('/models'),
  prompts: () => request<PromptVersion[]>('/prompts'),
  alerts: () => request<Alert[]>('/alerts'),
  health: () => request<{ status: string }>('/health'),
}
