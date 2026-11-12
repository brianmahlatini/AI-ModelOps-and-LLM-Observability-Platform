import { ArrowDownRight, ArrowUpRight, Boxes } from 'lucide-react'
import type { ModelMetrics } from '../types'

const providerClass: Record<string, string> = {
  OpenAI: 'provider-openai',
  Anthropic: 'provider-anthropic',
  Google: 'provider-google',
  Meta: 'provider-meta',
}

export function ModelComparison({ models }: { models: ModelMetrics[] }) {
  return (
    <section className="panel model-panel" id="models">
      <div className="panel-heading">
        <div><div className="eyebrow"><Boxes size={13} /> MODEL FLEET</div><h2>Model comparison</h2></div>
        <button className="icon-button" aria-label="Model options">···</button>
      </div>
      <div className="model-table-wrap">
        <table className="model-table">
          <thead><tr><th>MODEL</th><th>QUALITY</th><th>LATENCY</th><th>COST / 1K</th></tr></thead>
          <tbody>
            {models.slice(0, 5).map((model) => (
              <tr key={model.model}>
                <td><div className="model-name"><span className={`provider-icon ${providerClass[model.provider] ?? ''}`}>{model.provider.slice(0, 1)}</span><span><strong>{model.model}</strong><small>{model.provider} · {model.requests.toLocaleString()} runs</small></span></div></td>
                <td><span className="quality-cell">{model.avg_quality_score === null ? '—' : `${(model.avg_quality_score * 100).toFixed(0)}%`}</span></td>
                <td>{model.avg_latency_ms.toFixed(0)}<span className="table-unit"> ms</span></td>
                <td>${(model.avg_cost_usd * 1000).toFixed(3)}<span className="table-unit"> <ArrowDownRight size={11} /></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <a className="panel-link" href="#models">View all models <ArrowUpRight size={13} /></a>
    </section>
  )
}
