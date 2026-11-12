import { useState } from 'react'
import { Activity, ArrowDown, ArrowDownRight, ArrowUpRight, CircleDollarSign, Gauge, Layers3, Zap } from 'lucide-react'
import { AlertBanner } from './components/AlertBanner'
import { MetricCard } from './components/MetricCard'
import { ModelComparison } from './components/ModelComparison'
import { PerformanceChart } from './components/PerformanceChart'
import { PromptVersions } from './components/PromptVersions'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { TraceFeed } from './components/TraceFeed'
import { useDashboard } from './hooks/useDashboard'

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

export default function App() {
  const dashboard = useDashboard()
  const [refreshing, setRefreshing] = useState(false)
  const refresh = async () => {
    setRefreshing(true)
    await dashboard.refresh()
    setRefreshing(false)
  }
  const overview = dashboard.overview

  return (
    <div className="app-shell">
      <Sidebar alertCount={dashboard.alerts.length} />
      <main className="main-area">
        <TopBar refreshedAt={dashboard.refreshedAt} refreshing={refreshing} onRefresh={() => void refresh()} />
        <div className="page-content">
          <section className="page-heading">
            <div><div className="page-kicker"><span className="status-pulse" /> ALL SYSTEMS MONITORED <span className="heading-divider">/</span> PRODUCTION</div><h1>Model observability</h1><p>Understand the health, quality, and cost of your AI systems.</p></div>
            <button className="date-filter"><span className="calendar-dot" /> Last 14 days <ArrowDown size={13} /></button>
          </section>

          {dashboard.error && <div className="error-banner" role="alert"><strong>Dashboard data unavailable.</strong> {dashboard.error} <button onClick={() => void refresh()}>Retry</button></div>}
          {dashboard.loading && !overview && <div className="loading-banner"><span className="loading-spinner" /> Connecting to observability API…</div>}
          {overview && (
            <>
              <div className="metrics-grid">
                <MetricCard label="Total requests" value={compact.format(overview.total_requests)} detail="vs previous 14 days" trend={overview.requests_change_pct === null ? undefined : `${Math.abs(overview.requests_change_pct).toFixed(1)}%`} trendDirection={(overview.requests_change_pct ?? 0) >= 0 ? 'up' : 'down'} trendTone={(overview.requests_change_pct ?? 0) >= 0 ? 'good' : 'bad'} icon={Layers3} accent="violet">
                  <span className="sparkline"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
                </MetricCard>
                <MetricCard label="Success rate" value={`${(overview.success_rate * 100).toFixed(1)}%`} detail="request completion" trend={overview.success_rate_change_pp === null ? undefined : `${Math.abs(overview.success_rate_change_pp).toFixed(1)} pp`} trendDirection={(overview.success_rate_change_pp ?? 0) >= 0 ? 'up' : 'down'} trendTone={(overview.success_rate_change_pp ?? 0) >= 0 ? 'good' : 'bad'} icon={Activity} accent="mint">
                  <span className="trend-caption">vs previous 14 days</span>
                </MetricCard>
                <MetricCard label="P95 latency" value={`${overview.p95_latency_ms.toFixed(0)} ms`} detail={`avg ${overview.avg_latency_ms.toFixed(0)} ms response`} trend={overview.p95_latency_change_pct === null ? undefined : `${Math.abs(overview.p95_latency_change_pct).toFixed(1)}%`} trendDirection={(overview.p95_latency_change_pct ?? 0) >= 0 ? 'up' : 'down'} trendTone={(overview.p95_latency_change_pct ?? 0) <= 0 ? 'good' : 'bad'} icon={Zap} accent="amber">
                  <span className="trend-caption">vs previous 14 days</span>
                </MetricCard>
                <MetricCard label="Total spend" value={`$${overview.total_cost_usd.toFixed(2)}`} detail={`${compact.format(overview.input_tokens + overview.output_tokens)} tokens`} trend={overview.cost_change_pct === null ? undefined : `${Math.abs(overview.cost_change_pct).toFixed(1)}%`} trendDirection={(overview.cost_change_pct ?? 0) >= 0 ? 'up' : 'down'} trendTone={(overview.cost_change_pct ?? 0) <= 0 ? 'good' : 'bad'} icon={CircleDollarSign} accent="blue">
                  <span className="trend-caption">vs previous 14 days</span>
                </MetricCard>
              </div>

              <AlertBanner alerts={dashboard.alerts} />

              <div className="primary-grid">
                <PerformanceChart data={overview.series} />
                <section className="quality-panel panel" id="evaluations">
                  <div className="panel-heading"><div><div className="eyebrow"><Gauge size={13} /> QUALITY & SAFETY</div><h2>Evaluation health</h2></div><span className="period-pill">14D</span></div>
                  <div className="quality-score-block"><span className="quality-ring" style={{ background: `radial-gradient(closest-side, #111725 82%, transparent 84% 100%), conic-gradient(#4bd1ad 0 ${(overview.avg_quality_score ?? 0) * 100}%, #273242 ${(overview.avg_quality_score ?? 0) * 100}% 100%)` }}><span>{overview.avg_quality_score === null ? '—' : `${(overview.avg_quality_score * 100).toFixed(0)}%`}</span></span><div><strong>Quality score</strong><small>Model-graded evaluations</small><span className={`score-trend ${(overview.quality_change_pp ?? 0) < 0 ? 'negative' : ''}`}>{(overview.quality_change_pp ?? 0) < 0 ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}{overview.quality_change_pp === null ? 'Baseline unavailable' : `${overview.quality_change_pp > 0 ? '+' : ''}${overview.quality_change_pp.toFixed(1)} pp vs prior 14d`}</span></div></div>
                  <div className="quality-divider" />
                  <div className="quality-stat"><span>Hallucination risk</span><strong className={(overview.hallucination_rate ?? 0) > 0.05 ? 'risk-high' : ''}>{overview.hallucination_rate === null ? 'Not scored' : `${(overview.hallucination_rate * 100).toFixed(1)}%`}</strong></div>
                  <div className="quality-stat"><span>Quality drift sample</span><strong>{overview.previous_scored_traces.toLocaleString()} <small>prior-window scores</small></strong></div>
                  <div className="quality-stat"><span>Scored traces</span><strong>{overview.scored_traces.toLocaleString()} <small>/ {overview.total_requests.toLocaleString()}</small></strong></div>
                  <div className="quality-note"><span className="note-dot" /> Evaluation signals are heuristic demo data</div>
                </section>
              </div>

              <div className="secondary-grid">
                <ModelComparison models={dashboard.models} />
                <PromptVersions prompts={dashboard.prompts} />
              </div>
              <TraceFeed traces={dashboard.traces} />

              <footer className="footer"><span>Sentinel Observability <i>·</i> Demo workspace</span><span><span className="footer-live" /> API connected <i>·</i> Refreshes every 30 seconds</span></footer>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
