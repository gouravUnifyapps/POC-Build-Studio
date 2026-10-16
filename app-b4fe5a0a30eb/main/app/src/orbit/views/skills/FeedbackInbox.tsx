// The Feedback inbox tab: feedback records grouped by the skill they target (Unmapped first),
// filtered by status group and source. Read-only.
import { useState } from 'react'
import { useOrbit } from '@/orbit/lib/context'
import { clientName } from '@/orbit/lib/format'
import { pocOf, type Fb, type Tone } from '@/orbit/lib/model'
import { fbPhaseLabel } from '@/orbit/lib/actions'
import { useFormatters } from '@/lib/i18n'
import { Empty, Icon, Tag } from '@/orbit/components/bits'
import { LoadError, Loading } from '@/orbit/components/DataNotice'
import { FB_GROUPS, FB_GROUP_LABEL, FB_SOURCES, fbGroupOf, fbSourceLabel, isOpenFb, type FbGroup, type Skill } from '@/data/skills'

const UNMAPPED = ''
const GROUP_TONE: Record<FbGroup, Tone | 'accent'> = {
  open: 'attention',
  in_proposal: 'accent',
  incorporated: 'positive',
  dismissed: 'neutral',
  resolved: 'positive',
}

export function FeedbackInbox({
  skillByKey,
  onOpenProposal,
  onOpenVersion,
}: {
  skillByKey: Map<string, Skill>
  onOpenProposal: (proposalId: string) => void
  onOpenVersion: (versionId: string) => void
}) {
  const { snap, ready, error } = useOrbit()
  const [group, setGroup] = useState<FbGroup | 'all'>('all')
  const [source, setSource] = useState<string>('all')
  const all = snap.fb
  const rows = all
    .filter((f) => (group === 'all' || fbGroupOf(f.status) === group) && (source === 'all' || f.source === source))
    .sort((a, b) => b.created_at - a.created_at)
  const sources = [...FB_SOURCES, ...[...new Set(all.map((f) => f.source))].filter((s) => s && !(FB_SOURCES as readonly string[]).includes(s))]
  const keys = [...new Set(rows.map((f) => f.target_skill.trim()))].sort((a, b) =>
    a === UNMAPPED ? -1 : b === UNMAPPED ? 1 : (skillByKey.get(a)?.name ?? a).localeCompare(skillByKey.get(b)?.name ?? b),
  )

  if (!ready) return error ? <LoadError /> : <Loading what="feedback" />
  return (
    <div className="stack" data-test-id="feedback-inbox">
      <div className="row ob-sk-filters" data-test-id="inbox-filters">
        <div className="seg ob-seg-wrap" role="group" aria-label="Status" data-test-id="inbox-status-filter">
          {(['all', ...FB_GROUPS] as const).map((k) => (
            <button key={k} type="button" aria-pressed={group === k} onClick={() => setGroup(k)} data-test-id={`inbox-status-${k}`}>
              {k === 'all' ? 'All' : FB_GROUP_LABEL[k]}
              <span className="ob-seg-n">{k === 'all' ? all.length : all.filter((f) => fbGroupOf(f.status) === k).length}</span>
            </button>
          ))}
        </div>
        <div className="seg ob-seg-wrap" role="group" aria-label="Source" data-test-id="inbox-source-filter">
          {['all', ...sources].map((k) => (
            <button key={k} type="button" aria-pressed={source === k} onClick={() => setSource(k)} data-test-id={`inbox-source-${k}`}>
              {k === 'all' ? 'All sources' : fbSourceLabel(k)}
            </button>
          ))}
        </div>
      </div>
      {all.length === 0 ? (
        <Empty title="No feedback yet" desc="Feedback on a POC-builder skill shows up here once it is logged from Slack, a gate or an iteration." />
      ) : rows.length === 0 ? (
        <Empty title="No feedback matches these filters" />
      ) : (
        <div className="ob-skills">
          {keys.map((k) => {
            const items = rows.filter((f) => f.target_skill.trim() === k)
            const sk = skillByKey.get(k)
            return (
              <section key={k || 'unmapped'} className="ob-skillrow" data-test-id={`inbox-group-${k || 'unmapped'}`}>
                <div className="ps-skill">
                  <div className="hd">
                    <span className="av ob-av-ai">
                      <Icon name="layers" size="sm" />
                    </span>
                    <div>
                      <b>{k === UNMAPPED ? 'Unmapped' : sk?.name || k}</b>
                      {k === UNMAPPED ? <p className="ob-sk-muted">The next analysis run will try to map these to a skill.</p> : sk?.area ? <p className="ob-sk-muted">{sk.area}</p> : null}
                    </div>
                  </div>
                  <div className="nums">
                    <div>
                      <b>{items.length}</b>shown
                    </div>
                    <div>
                      <b>{items.filter((f) => isOpenFb(f.status)).length}</b>open
                    </div>
                  </div>
                </div>
                <div className="ob-fbstack">
                  {items.map((f) => (
                    <FbItem key={f.id} f={f} onOpenProposal={onOpenProposal} onOpenVersion={onOpenVersion} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FbItem({ f, onOpenProposal, onOpenVersion }: { f: Fb; onOpenProposal: (id: string) => void; onOpenVersion: (id: string) => void }) {
  const { snap } = useOrbit()
  const fmt = useFormatters()
  const p = pocOf(snap, f.poc)
  const where = [p?.client || clientName(f.client_name), fbPhaseLabel(f)].filter(Boolean).join(' · ')
  const quote = f.quote || f.feedback || f.title
  const g = fbGroupOf(f.status)
  const by = [f.given_by_name, f.created_at ? fmt.date(f.created_at, { dateStyle: 'medium' }) : '', f.reviewed_by ? `reviewed by ${f.reviewed_by}` : ''].filter(Boolean)

  const chip = <Tag tone={GROUP_TONE[g]}>{FB_GROUP_LABEL[g]}</Tag>
  const status =
    g === 'in_proposal' && f.skill_proposal ? (
      <button type="button" className="ob-sk-chipbtn" onClick={() => onOpenProposal(f.skill_proposal)} aria-label={`Open proposal ${f.skill_proposal}`} data-test-id={`fb-open-proposal-${f.id}`}>
        {chip}
      </button>
    ) : g === 'incorporated' && f.incorporated_in_version ? (
      <button type="button" className="ob-sk-chipbtn" onClick={() => onOpenVersion(f.incorporated_in_version)} aria-label={`Open version ${f.incorporated_in_version}`} data-test-id={`fb-open-version-${f.id}`}>
        {chip}
      </button>
    ) : (
      chip
    )

  return (
    <article className="ps-fb ob-fb" id={`fb-${f.ticket_no}`} data-test-id={`fb-item-${f.id}`}>
      <div className="ob-fb-b">
        <div className="row ob-fb-top">
          {status}
          {f.source ? <Tag tone="neutral">{fbSourceLabel(f.source)}</Tag> : null}
          {where ? <code className="inl">{where}</code> : null}
          <code className="inl ob-ticket">{f.ticket_no}</code>
        </div>
        {quote ? <q>{quote}</q> : null}
        {f.title && f.title !== quote ? <p className="ob-sk-note-t">{f.title}</p> : null}
        {f.action_taken ? <p className="ob-sk-note-t">{f.action_taken}</p> : null}
        {by.length ? <p className="by">{by.join(' · ')}</p> : null}
      </div>
    </article>
  )
}
