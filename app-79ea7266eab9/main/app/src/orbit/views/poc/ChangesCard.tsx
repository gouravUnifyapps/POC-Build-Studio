// Changes made during the journey (Slack feedback, judge findings, Nebula's own iterations),
// grouped by phase, newest first. Shown only when the POC has some; collapsed until opened.
// Each row: who, what and why, then where it came from, the skill and when.
import { useOrbit } from '@/orbit/lib/context'
import { PHASES } from '@/orbit/lib/loop'
import { itsOf, sourceLabel, type Poc } from '@/orbit/lib/model'
import { useFormatters } from '@/lib/i18n'
import { Avatar, Icon, Tag } from '@/orbit/components/bits'

export function ChangesCard({ p, open, onToggle }: { p: Poc; open: boolean; onToggle: () => void }) {
  const { snap } = useOrbit()
  const fmt = useFormatters()
  const its = itsOf(snap, p)
  if (!its.length) return null
  return (
    <section className="solid ob-changes">
      <button type="button" className="ob-changes-h" aria-expanded={open} aria-controls="chg-body" onClick={onToggle}>
        <Icon name="loop" />
        <b>Changes during the journey</b>
        <span className="ob-seg-n">{its.length}</span>
        <span className="spacer" />
        <Icon name={open ? 'chev-d' : 'chev-r'} />
      </button>
      {open ? (
        <div id="chg-body" className="ob-changes-b">
          {PHASES.map((ph) => {
            const rows = its.filter((i) => i.phase === ph.key)
            if (!rows.length) return null
            return (
              <div key={ph.key} id={`chg-${ph.key}`} className="ob-chg-group">
                <p className="micro ob-chg-gh">
                  {ph.label} · {rows.length}
                </p>
                <ul>
                  {rows.map((r) => {
                    const isPerson = r.source === 'person'
                    const source = sourceLabel(r.source)
                    const who = r.actor_name || source
                    const tag = isPerson ? [who, r.slack_ref ? 'Slack' : ''].filter(Boolean).join(' · ') : who
                    return (
                      <li key={r.id} className="ob-chg">
                        <Avatar name={who} ai={!isPerson} />
                        <div className="ob-chg-b">
                          {r.title ? <p className="ob-chg-title">{r.title}</p> : null}
                          {r.reason ? (
                            <p className="ob-chg-reason" title={r.reason}>
                              {r.reason}
                            </p>
                          ) : null}
                        </div>
                        <div className="ob-chg-side">
                          <span className="ob-chg-src">
                            {tag ? <Tag tone={isPerson ? 'neutral' : 'accent'}>{tag}</Tag> : null}
                          </span>
                          <span className="ob-chg-skill">{r.skill ? <code className="inl">{r.skill}</code> : null}</span>
                          <time className="ob-mono-t">
                            {r.created_at ? fmt.date(r.created_at, { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                          </time>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
