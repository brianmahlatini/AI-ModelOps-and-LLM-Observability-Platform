import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string
  detail: string
  trend?: string
  trendDirection?: 'up' | 'down'
  trendTone?: 'good' | 'bad'
  icon: LucideIcon
  accent: string
  children?: ReactNode
}

export function MetricCard({
  label, value, detail, trend, trendDirection = 'up', trendTone = 'good', icon: Icon, accent, children,
}: MetricCardProps) {
  const TrendIcon = trendDirection === 'up' ? ArrowUpRight : ArrowDownRight
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className={`metric-icon ${accent}`}><Icon size={16} /></span>
      </div>
      <div className="metric-value-row">
        <strong className="metric-value">{value}</strong>
        {trend && <span className={`trend ${trendTone}`}><TrendIcon size={13} />{trend}</span>}
      </div>
      <div className="metric-bottom"><span>{detail}</span>{children}</div>
    </article>
  )
}
