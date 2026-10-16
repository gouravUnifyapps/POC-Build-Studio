// Small building blocks shared by every Orbit screen, on the design system's classes.
import type { ReactNode } from 'react'
import { ICONS } from '@/orbit/lib/icons'
import { clientName, initials, toneOf } from '@/orbit/lib/format'
import { mdHtml } from '@/orbit/lib/markdown'
import { APPROVAL_GATES, PHASES } from '@/orbit/lib/loop'
import { gateApproved, openGate, phaseState, statusOf, type Poc, type Tone, type Viewer } from '@/orbit/lib/model'

export function Icon({ name, size }: { name: string; size?: 'sm' | 'lg' }) {
  return (
    <svg
      className={`ob-ic ${size ? 'ob-ic--' + size : ''}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }}
    />
  )
}

/** A person as initials; an agent (Nebula, Judge, System) as a square mark. */
export function Avatar({ name, ai = false, size }: { name: string; ai?: boolean; size?: 'sm' | 'lg' }) {
  const full = name.trim()
  if (ai) {
    return (
      <span className={`av ob-av-ai ${size ? 'ob-av--' + size : ''}`} title={full || undefined} role="img" aria-label={full || 'AI'}>
        <Icon name="spark" size="sm" />
      </span>
    )
  }
  return (
    <span className={`av ob-tone-${toneOf(full)} ${size ? 'ob-av--' + size : ''}`} title={full || undefined} aria-hidden="true">
      {initials(full)}
    </span>
  )
}

export function ClientTile({ poc, size }: { poc: Pick<Poc, 'client_name'>; size?: 'lg' }) {
  const name = clientName(poc.client_name)
  return (
    <span className={`av ob-ctile ob-tone-${toneOf(name)} ${size ? 'ob-ctile--' + size : ''}`} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

/** A quiet tonal tag: icon + word + colour. */
export function Tag({ tone = 'neutral', icon, children }: { tone?: Tone | 'accent'; icon?: string; children: ReactNode }) {
  const cls = tone === 'brand' ? 'ob-tag-brand' : tone === 'accent' ? 'ob-tag-accent' : tone
  return (
    <span className={`tag ${cls}`}>
      {icon ? <Icon name={icon} size="sm" /> : null}
      {children}
    </span>
  )
}

export function StatusTag({ poc, me }: { poc: Poc; me: Viewer }) {
  const s = statusOf(poc, me)
  return (
    <Tag tone={s.tone} icon={s.icon}>
      {s.label}
    </Tag>
  )
}

/** The four phases and the three gates between them (G1–G3) as one compact rail, as on the
 *  POC page. Deliver has no gate: a demo-ready POC shows every phase complete. */
export function MiniRail({ poc }: { poc: Poc }) {
  const g = openGate(poc)
  const label = PHASES.map((ph) => `${ph.label}: ${phaseState(poc, ph.key)}`).join(', ')
  return (
    <span className="ps-mini ob-mini" role="img" aria-label={label}>
      {PHASES.map((ph) => {
        const st = phaseState(poc, ph.key)
        const bar = st === 'done' || st === 'waiting' ? 'done' : st === 'building' ? 'now' : st === 'blocked' ? 'block' : ''
        const cells = [<i key={ph.key} className={bar} />]
        if (APPROVAL_GATES.includes(ph.gate)) {
          const gate = gateApproved(poc, ph.gate) || st === 'done' ? 'done' : g === ph.gate ? 'wait' : ''
          cells.push(<i key={ph.gate} className={`g ${gate}`} />)
        }
        return cells
      })}
    </span>
  )
}

/** Markdown from a record, escaped by mdHtml before its own tags are added. */
export function Markdown({ src, className }: { src: string; className?: string }) {
  return <div className={`ob-md ${className || ''}`} dangerouslySetInnerHTML={{ __html: mdHtml(src) }} />
}

export function Empty({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <p className="title">{title}</p>
      {desc ? <p>{desc}</p> : null}
      {action}
    </div>
  )
}

/** A tooltip on hover and keyboard focus. */
export function Tip({ text, children, className }: { text: string; children: ReactNode; className?: string }) {
  return (
    <span className={`ob-tipwrap ${className || ''}`}>
      {children}
      <span role="tooltip" className="ps-tip ob-tip">
        {text}
      </span>
    </span>
  )
}
