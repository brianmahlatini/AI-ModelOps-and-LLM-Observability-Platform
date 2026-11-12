import { AlertTriangle, ArrowUpRight, ShieldAlert } from 'lucide-react'
import type { Alert } from '../types'

export function AlertBanner({ alerts }: { alerts: Alert[] }) {
  const critical = alerts.filter((alert) => alert.severity === 'critical').length
  return (
    <section className={`alert-banner ${critical ? 'has-critical' : ''}`} id="alerts">
      <span className="alert-symbol">{critical ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}</span>
      <div className="alert-copy"><strong>{alerts.length ? `${alerts.length} active signal${alerts.length === 1 ? '' : 's'} need attention` : 'All systems operating within targets'}</strong><span>{alerts[0]?.description ?? 'No reliability, latency, or evaluation thresholds are currently breached.'}</span></div>
      {alerts.length > 1 && <span className="alert-count">+{alerts.length - 1} more</span>}
      <a href="#alerts" className="alert-action">Review alerts <ArrowUpRight size={13} /></a>
    </section>
  )
}
