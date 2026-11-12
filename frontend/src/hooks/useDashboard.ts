import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Alert, ModelMetrics, Overview, PromptVersion, Trace } from '../types'

interface DashboardData {
  overview: Overview | null
  traces: Trace[]
  models: ModelMetrics[]
  prompts: PromptVersion[]
  alerts: Alert[]
  loading: boolean
  error: string | null
  refreshedAt: Date | null
  refresh: () => Promise<void>
}

export function useDashboard(): DashboardData {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [traces, setTraces] = useState<Trace[]>([])
  const [models, setModels] = useState<ModelMetrics[]>([])
  const [prompts, setPrompts] = useState<PromptVersion[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [nextOverview, nextTraces, nextModels, nextPrompts, nextAlerts] = await Promise.all([
        api.overview(), api.traces(), api.models(), api.prompts(), api.alerts(),
      ])
      setOverview(nextOverview)
      setTraces(nextTraces)
      setModels(nextModels)
      setPrompts(nextPrompts)
      setAlerts(nextAlerts)
      setError(null)
      setRefreshedAt(new Date())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 30_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  return { overview, traces, models, prompts, alerts, loading, error, refreshedAt, refresh }
}
