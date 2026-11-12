import { Activity, ChevronDown } from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { SeriesPoint } from '../types'

export function PerformanceChart({ data }: { data: SeriesPoint[] }) {
  return (
    <section className="panel chart-panel">
      <div className="panel-heading chart-heading">
        <div>
          <div className="eyebrow"><Activity size={13} /> PERFORMANCE</div>
          <h2>Request volume</h2>
          <p className="panel-subtitle">Traffic across your production models</p>
        </div>
        <button className="select-button">Last 14 days <ChevronDown size={14} /></button>
      </div>
      <div className="chart-legend"><span><i className="legend-dot requests-dot" />Requests</span><span><i className="legend-line" />Quality score</span></div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="requestGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b7bff" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#8b7bff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#37d8b2" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#37d8b2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#202637" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} tickLine={false} axisLine={false} tick={{ fill: '#778196', fontSize: 11 }} dy={8} />
            <YAxis yAxisId="requests" tickLine={false} axisLine={false} tick={{ fill: '#778196', fontSize: 11 }} />
            <YAxis yAxisId="quality" orientation="right" domain={[0, 1]} hide />
            <Tooltip
              contentStyle={{ background: '#151b29', border: '1px solid #293247', borderRadius: 9, color: '#edf0f7', fontSize: 12 }}
              labelStyle={{ color: '#9da7bb', marginBottom: 5 }}
              formatter={(value: number, name: string) => [name === 'Quality score' ? `${(value * 100).toFixed(0)}%` : value, name]}
              labelFormatter={(value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            />
            <Area yAxisId="requests" type="monotone" dataKey="requests" name="Requests" stroke="#9585ff" strokeWidth={2} fill="url(#requestGradient)" activeDot={{ r: 4, fill: '#b2a7ff', stroke: '#171523', strokeWidth: 2 }} />
            <Area yAxisId="quality" type="monotone" dataKey="quality_score" name="Quality score" stroke="#37d8b2" strokeWidth={1.7} strokeDasharray="4 4" fill="url(#qualityGradient)" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
