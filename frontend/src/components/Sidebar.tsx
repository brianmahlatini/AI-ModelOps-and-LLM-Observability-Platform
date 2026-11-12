import {
  Activity, Bell, Boxes, ChevronDown, CircleHelp, LayoutDashboard,
  Radio, Settings2, ShieldCheck, Sparkles, Workflow,
} from 'lucide-react'

const navigation = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Traces', icon: Activity, badge: 'Live' },
  { label: 'Evaluations', icon: ShieldCheck },
  { label: 'Models', icon: Boxes },
  { label: 'Prompts', icon: Workflow },
  { label: 'Alerts', icon: Bell },
]

export function Sidebar({ alertCount }: { alertCount: number }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#" aria-label="Sentinel home">
        <span className="brand-mark"><Sparkles size={17} /></span>
        <span>sentinel<span className="brand-dot">.</span></span>
      </a>
      <div className="workspace-switcher">
        <span className="workspace-avatar">N</span>
        <span className="workspace-copy"><strong>Northstar AI</strong><small>Enterprise plan</small></span>
        <ChevronDown size={15} className="muted-icon" />
      </div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="primary-nav">
        {navigation.map(({ label, icon: Icon, active, badge }) => (
          <a className={`nav-item ${active ? 'active' : ''}`} href={`#${label.toLowerCase()}`} key={label}>
            <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            {(badge || (label === 'Alerts' && alertCount > 0)) && <span className={`nav-badge ${badge === 'Live' ? 'live' : ''}`}>{badge ?? alertCount}</span>}
          </a>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="usage-card">
          <div className="usage-heading"><span>Monthly usage</span><span>68%</span></div>
          <div className="usage-track"><span /></div>
          <p>6.8M <span>/ 10M events</span></p>
        </div>
        <a className="nav-item" href="#settings"><Settings2 size={17} /><span>Settings</span></a>
        <a className="nav-item" href="#help"><CircleHelp size={17} /><span>Help center</span></a>
        <div className="profile">
          <div className="profile-avatar">AM</div>
          <span className="profile-copy"><strong>Alex Morgan</strong><small>AI Platform Lead</small></span>
          <Radio size={15} className="profile-status" />
        </div>
      </div>
    </aside>
  )
}
