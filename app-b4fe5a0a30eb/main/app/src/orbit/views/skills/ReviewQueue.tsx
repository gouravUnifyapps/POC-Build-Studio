// The Review queue: proposals sorted by projected iterations saved, with source chips counted
// from each linked ticket's source.
import { useState } from 'react'
import { useOrbit } from '@/orbit/lib/context'
import { useFormatters } from '@/lib/i18n'
import { Empty, Tag } from '@/orbit/components/bits'
import { CONFIDENCE_LABEL, fbSourceLabel, isPending, proposalStatusLabel, type Proposal, type Skill } from '@/data/skills'

const FILTERS = ['open', 'pending', 'changes_requested', 'approved', 'rejected', 'all'] as const
type Filter = (typeof FILTERS)[number]
const FILTER_LABEL: Record<Filter, string> = {
  open: 'Pending + changes requested',
  pending: 'Pending',
  changes_requested: 'Changes requested',
  approved: 'Approved',
  rejected: 'Rejected',
  all: 'All',
}
function matches(p: Proposal, f: Filter) {
  if (f === 'all') return true
  if (f === 'open') return p.status === 'pending' || p.status === 'changes_requested'
  return p.status === f
}

export function ReviewQueue({
  proposals,
  skillByKey,
  onOpen,
  ago,
}: {
  proposals: Proposal[]
  skillByKey: Map<string, Skill>
  onOpen: (id: string) => void
  ago: (ts: number) => string
}) {
  const { snap } = useOrbit()
  const fmt = useFormatters()
  const [filter, setFilter] = useState<Filter>('open')
  const fbByRef = new Map(snap.fb.flatMap((f) => [[f.ticket_no, f] as const, [f.id, f] as const]))
  const rows = proposals.filter((p) => matches(p, filter)).sort((a, b) => b.iterationsSaved - a.iterationsSaved)

  return (
    <div className="stack" data-test-id="review-queue">
      <div className="seg ob-seg-wrap" role="group" aria-label="Proposal status" data-test-id="review-filter">
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} data-test-id={`review-filter-${f}`}>
            {FILTER_LABEL[f]}
            <span className="ob-seg-n">{proposals.filter((p) => matches(p, f)).length}</span>
          </button>
        ))}
      </div>
      {proposals.length === 0 ? (
        <Empty title="No proposals yet" desc="Run analysis to turn new feedback into proposed skill changes." />
      ) : rows.length === 0 ? (
        <Empty title={`No ${FILTER_LABEL[filter].toLowerCase()} proposals`} />
      ) : (
        <ul className="ob-sk-list" data-test-id="review-list">
          {rows.map((p) => {
            const sk = skillByKey.get(p.skillKey)
            const counts = new Map<string, number>()
            for (const ref of p.feedbackRefs) {
              const src = fbByRef.get(ref)?.source
              if (src) counts.set(src, (counts.get(src) ?? 0) + 1)
            }
            return (
              <li key={p.id}>
                <button type="button" className="ob-sk-row" onClick={() => onOpen(p.id)} data-test-id={`proposal-row-${p.id}`}>
                  <span className="ob-sk-row-main">
                    <span className="row ob-sk-row-t">
                      <b>{sk?.name || p.skillKey || 'Unknown skill'}</b>
                      {sk?.area ? <span className="ob-sk-muted">{sk.area}</span> : null}
                    </span>
                    <span className="ob-sk-row-sum">{p.summary || 'No summary'}</span>
                    {counts.size ? (
                      <span className="row ob-sk-srcs">
                        {[...counts].map(([src, n]) => (
                          <span key={src} className="ob-sk-src">
                            {fbSourceLabel(src)} · {n}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </span>
                  <span className="ob-sk-row-meta">
                    <span className="ob-sk-saved" title="Projected iterations saved per month">
                      <b>{fmt.number(p.iterationsSaved)}</b> saved / mo
                    </span>
                    {p.confidence ? <span>{CONFIDENCE_LABEL[p.confidence] ?? p.confidence}</span> : null}
                    <Tag tone={isPending(p.status) ? 'attention' : 'neutral'}>{proposalStatusLabel(p.status)}</Tag>
                    <span>{p.feedbackRefs.length} feedback</span>
                    {p.createdAt ? <time>{ago(p.createdAt)}</time> : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
