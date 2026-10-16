// History: the POC's activity, newest first, grouped by day. Who did it and what, in one line.
import { useOrbit } from '@/orbit/lib/context'
import { dayStamp, firstName } from '@/orbit/lib/format'
import { actsOf, isAiActor, type Act, type Poc } from '@/orbit/lib/model'
import { useFormatters } from '@/lib/i18n'
import { Avatar, Empty, Icon } from '@/orbit/components/bits'

/** The small mark on the avatar: what kind of event it was, in the outcome's tone. */
const KIND: Record<string, { icon: string; tone: string }> = {
  poc_started: { icon: 'plus', tone: '' },
  stage_started: { icon: 'layers', tone: '' },
  stage_completed: { icon: 'check', tone: 'pos' },
  document_saved: { icon: 'file', tone: '' },
  input_added: { icon: 'upload', tone: '' },
  gate_posted: { icon: 'pause-c', tone: 'att' },
  gate_decided: { icon: 'check', tone: 'pos' },
  manager_approved: { icon: 'check', tone: 'pos' },
  owner_approved: { icon: 'check', tone: 'pos' },
  iteration_logged: { icon: 'loop', tone: 'acc' },
  feedback_created: { icon: 'msg', tone: '' },
  feedback_reviewed: { icon: 'msg', tone: '' },
  poc_stopped: { icon: 'stop', tone: 'neg' },
  poc_restarted: { icon: 'play', tone: '' },
}

function actorLabel(a: Act): string {
  const name = a.actor_name.trim()
  if (isAiActor(a.actor_type, name)) return name.replace(/^AI\s*·?\s*/i, '').trim() || name
  return name
}

/** The message without a leading actor name, so the actor is not read twice. */
function withoutActor(a: Act): string {
  const m = a.message.trim()
  const names = [a.actor_name, firstName(a.actor_name), actorLabel(a)]
    .map((n) => n.trim())
    .filter(Boolean)
    .sort((x, y) => y.length - x.length)
  for (const n of names) {
    if (m.toLowerCase().startsWith(n.toLowerCase()) && /^[\s:·,-]|^$/.test(m.slice(n.length, n.length + 1))) {
      return m.slice(n.length).replace(/^[\s:·,-]+/, '')
    }
  }
  return m
}

export function HistoryTab({ p }: { p: Poc }) {
  const { snap } = useOrbit()
  const fmt = useFormatters()
  const acts = actsOf(snap, p).filter((a) => a.created_at)
  if (!acts.length) return <Empty title="No activity yet" desc="Approvals, documents and changes are listed here as they happen." />

  const today = dayStamp(Date.now())
  const yesterday = dayStamp(Date.now() - 864e5)
  const dayLabel = (t: number) => {
    const k = dayStamp(t)
    if (k === today) return 'Today'
    if (k === yesterday) return 'Yesterday'
    return fmt.date(t, { weekday: 'long', day: 'numeric', month: 'short' })
  }
  const days: Array<{ key: string; label: string; rows: Act[] }> = []
  acts.forEach((a) => {
    const k = dayStamp(a.created_at)
    const last = days[days.length - 1]
    if (last && last.key === k) last.rows.push(a)
    else days.push({ key: k, label: dayLabel(a.created_at), rows: [a] })
  })

  return (
    <div className="ob-history">
      {days.map((d) => (
        <section key={d.key} className="ob-hday">
          <p className="micro">{d.label}</p>
          <ul>
            {d.rows.map((a) => {
              const ai = isAiActor(a.actor_type, a.actor_name)
              const kind = KIND[a.type] || { icon: 'layers', tone: '' }
              return (
                <li key={a.id} className="ob-hrow">
                  <span className="ob-hav">
                    <Avatar name={actorLabel(a)} ai={ai} />
                    <span className={`ob-hkind ${kind.tone}`}>
                      <Icon name={kind.icon} size="sm" />
                    </span>
                  </span>
                  <p className="ob-htext">
                    {actorLabel(a) ? <b>{actorLabel(a)}</b> : null} {withoutActor(a)}
                  </p>
                  <time className="ob-mono-t">{fmt.date(a.created_at, { timeStyle: 'short' })}</time>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
