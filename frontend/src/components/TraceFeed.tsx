import { ArrowUpRight, Check, Clock3, CircleX, Radio } from 'lucide-react'
import type { Trace } from '../types'

function timeAgo(value: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function TraceFeed({ traces }: { traces: Trace[] }) {
  return (
    <section className="panel trace-panel" id="traces">
      <div className="panel-heading">
        <div><div className="eyebrow"><Radio size={13} /> LIVE TELEMETRY</div><h2>Recent traces</h2></div>
        <a className="text-link" href="#traces">Explore traces <ArrowUpRight size={13} /></a>
      </div>
      <div className="trace-list">
        {traces.slice(0, 6).map((trace) => (
          <article className="trace-row" key={trace.id}>
            <span className={`trace-status ${trace.status === 'ok' ? 'ok' : 'error'}`}>{trace.status === 'ok' ? <Check size={12} /> : <CircleX size={13} />}</span>
            <span className="trace-main"><strong>{trace.name}</strong><small>{trace.model} <i>·</i> {trace.prompt_version}</small></span>
            <span className="trace-meta"><span><Clock3 size={12} />{trace.latency_ms.toFixed(0)} ms</span><small>{(trace.input_tokens + trace.output_tokens).toLocaleString()} tokens</small></span>
            <span className="trace-cost">${trace.cost_usd.toFixed(4)}<small>{timeAgo(trace.timestamp)}</small></span>
          </article>
        ))}
      </div>
    </section>
  )
}
