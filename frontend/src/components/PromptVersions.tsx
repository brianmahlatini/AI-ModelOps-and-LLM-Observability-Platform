import { ArrowUpRight, GitBranch, Sparkles } from 'lucide-react'
import type { PromptVersion } from '../types'

export function PromptVersions({ prompts }: { prompts: PromptVersion[] }) {
  return (
    <section className="panel prompt-panel" id="prompts">
      <div className="panel-heading">
        <div><div className="eyebrow"><GitBranch size={13} /> PROMPT REGISTRY</div><h2>Prompt versions</h2></div>
        <button className="icon-button" aria-label="Prompt options">···</button>
      </div>
      <div className="prompt-list">
        {prompts.slice(0, 4).map((prompt) => (
          <article className="prompt-row" key={`${prompt.prompt_key}-${prompt.version}`}>
            <div className="prompt-icon"><Sparkles size={14} /></div>
            <div className="prompt-copy"><strong>{prompt.prompt_key}<span className="version-pill">{prompt.version}</span>{prompt.is_active && <span className="active-pill">ACTIVE</span>}</strong><small>{prompt.description}</small></div>
            <div className="prompt-score">{prompt.avg_quality_score === null ? '—' : `${(prompt.avg_quality_score * 100).toFixed(0)}%`}<small>quality</small></div>
          </article>
        ))}
      </div>
      <a className="panel-link" href="#prompts">Open prompt registry <ArrowUpRight size={13} /></a>
    </section>
  )
}
