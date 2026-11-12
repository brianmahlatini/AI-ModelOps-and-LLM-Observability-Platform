import { Bell, ChevronDown, Command, RefreshCw, Search } from 'lucide-react'

interface TopBarProps {
  refreshedAt: Date | null
  refreshing: boolean
  onRefresh: () => void
}

export function TopBar({ refreshedAt, refreshing, onRefresh }: TopBarProps) {
  const time = refreshedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '—'
  return (
    <header className="topbar">
      <div className="breadcrumbs"><span>Workspace</span><i>/</i><strong>Overview</strong></div>
      <div className="topbar-actions">
        <span className="refresh-label">Updated {time}</span>
        <button className={`icon-button refresh-button ${refreshing ? 'spinning' : ''}`} onClick={onRefresh} aria-label="Refresh dashboard"><RefreshCw size={15} /></button>
        <button className="search-button"><Search size={15} /><span>Search anything...</span><kbd><Command size={10} /> K</kbd></button>
        <button className="notification-button" aria-label="Notifications"><Bell size={17} /><i /></button>
        <div className="topbar-avatar">AM<ChevronDown size={12} /></div>
      </div>
    </header>
  )
}
