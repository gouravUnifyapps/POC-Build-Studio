// Skills & Feedback: run the skill analysis, review the proposals it makes, browse skills and
// their versions, the feedback inbox, and the changelog of decisions and restores.
import { useMemo, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useOrbit } from '@/orbit/lib/context'
import { useFormatters } from '@/lib/i18n'
import { Empty } from '@/orbit/components/bits'
import {
  CHANGE_TYPE_LABEL,
  failureMessage,
  isPending,
  useIsSkillAdmin,
  useRunSkillAnalysis,
  useSkillIterations30d,
  useSkillsData,
  type Skill,
  type SkillVersion,
} from '@/data/skills'
import { FeedbackInbox } from './FeedbackInbox'
import { ReviewQueue } from './ReviewQueue'
import { SkillsTab } from './SkillsTab'
import { ProposalDrawer } from './ProposalDrawer'
import { SkillDetail } from './SkillDetail'

const TABS = [
  { key: 'review', label: 'Review queue' },
  { key: 'skills', label: 'Skills' },
  { key: 'inbox', label: 'Feedback inbox' },
  { key: 'changelog', label: 'Changelog' },
] as const
type TabKey = (typeof TABS)[number]['key']
const DAY = 86_400_000
const SKELETON_ROWS = 4

function useAgo() {
  const fmt = useFormatters()
  return (ts: number) => {
    if (!ts) return ''
    const d = ts - Date.now()
    const abs = Math.abs(d)
    if (abs < 3_600_000) return fmt.relative(Math.round(d / 60_000), 'minute')
    if (abs < DAY) return fmt.relative(Math.round(d / 3_600_000), 'hour')
    return fmt.relative(Math.round(d / DAY), 'day')
  }
}

export default function SkillsPage() {
  const data = useSkillsData()
  const { me } = useOrbit()
  const { isAdmin } = useIsSkillAdmin(me.email)
  const iterations = useSkillIterations30d()
  const fmt = useFormatters()
  const ago = useAgo()
  const [params, setParams] = useSearchParams()
  const tab: TabKey = (TABS.find((t) => t.key === params.get('tab'))?.key ?? 'review') as TabKey
  const [openProposal, setOpenProposal] = useState<string | null>(null)
  const [openSkill, setOpenSkill] = useState<string | null>(null)
  const [focusVersion, setFocusVersion] = useState<string | null>(null)
  const { run, isPending: running } = useRunSkillAnalysis()

  const skillByKey = useMemo(() => new Map(data.skills.map((s) => [s.key, s])), [data.skills])
  const lastCompleted = data.runs.find((r) => r.status === 'completed')
  const pendingProposals = data.proposals.filter((p) => isPending(p.status))

  function setTab(k: TabKey) {
    const next = new URLSearchParams(params)
    next.set('tab', k)
    setParams(next, { replace: true })
  }
  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : (i + dir + TABS.length) % TABS.length
    setTab(TABS[n].key)
    document.getElementById(`skills-tab-${TABS[n].key}`)?.focus()
  }

  async function handleRun() {
    try {
      const r = await run()
      const parts = [
        r.proposals_created !== undefined ? `${r.proposals_created} proposals created` : '',
        r.feedback_new !== undefined ? `${r.feedback_new} new feedback` : '',
      ].filter(Boolean)
      toast.success(r.message || 'Analysis finished', parts.length ? { description: parts.join(' · ') } : undefined)
    } catch (e) {
      toast.error(failureMessage(e, 'The analysis could not run. Try again.'))
    }
  }

  const kpis: { key: string; label: string; value: string; sub?: string }[] = [
    { key: 'pending', label: 'Proposals awaiting review', value: fmt.number(pendingProposals.length) },
    lastCompleted
      ? { key: 'analysed', label: 'New feedback in last run', value: fmt.number(lastCompleted.feedbackNew), sub: `of ${fmt.number(lastCompleted.feedbackTotal)} total` }
      : { key: 'analysed', label: 'New feedback in last run', value: '—', sub: 'No completed run yet' },
    { key: 'saved', label: 'Projected iterations saved / month', value: fmt.number(pendingProposals.reduce((n, p) => n + p.iterationsSaved, 0)) },
    { key: 'skills', label: 'Skills in repo', value: fmt.number(data.skills.length) },
  ]

  function openProposalById(proposalId: string) {
    const p = data.proposals.find((x) => x.proposalId === proposalId || x.id === proposalId)
    if (p) setOpenProposal(p.id)
  }
  function openVersion(versionId: string) {
    const v = data.versions.find((x) => x.versionId === versionId)
    const sk = v ? data.skills.find((x) => x.key === v.skillKey) : undefined
    if (!sk) return
    setFocusVersion(versionId)
    setOpenSkill(sk.id)
  }

  const proposal = openProposal ? data.proposals.find((p) => p.id === openProposal) : undefined
  const skill = openSkill ? data.skills.find((s) => s.id === openSkill) : undefined

  return (
    <div className="ob-sk" data-test-id="skills-page">
      <header className="ob-pagehead ob-sk-head" data-test-id="skills-header">
        <div>
          <h1 className="ob-h1">Skills &amp; Feedback</h1>
          <p className="ob-sub" data-test-id="skills-last-run">
            {data.loading && !lastCompleted
              ? 'Loading the last analysis…'
              : lastCompleted
                ? `Last analysis ${ago(lastCompleted.at)} · ${fmt.date(lastCompleted.at, { dateStyle: 'medium', timeStyle: 'short' })}`
                : 'No analysis run yet'}
          </p>
        </div>
        <button type="button" className="btn btn-p" onClick={handleRun} disabled={running} aria-busy={running} data-test-id="skills-run-analysis-button">
          {running ? 'Running analysis…' : 'Run analysis'}
        </button>
      </header>

      <div className="ob-sk-kpis" data-test-id="skills-kpis">
        {kpis.map((k) => (
          <div key={k.key} className="tile" data-test-id={`skills-kpi-${k.key}`}>
            <span className="ob-sk-kpi-l">{k.label}</span>
            {data.loading ? (
              <span className="ob-sk-skel ob-sk-skel-v" aria-label="Loading" />
            ) : (
              <>
                <span className="v">{k.value}</span>
                {k.sub ? <span className="sub">{k.sub}</span> : null}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="ob-sk-tabs">
        <div className="tabs" role="tablist" aria-label="Skills & Feedback sections" data-test-id="skills-tabs">
          {TABS.map((t, i) => (
            <button
              key={t.key}
              id={`skills-tab-${t.key}`}
              type="button"
              role="tab"
              className="tab"
              aria-selected={tab === t.key}
              aria-controls={`skills-panel-${t.key}`}
              tabIndex={tab === t.key ? 0 : -1}
              onClick={() => setTab(t.key)}
              onKeyDown={(e) => onTabKey(e, i)}
              data-test-id={`skills-tab-${t.key}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="tabpanel" role="tabpanel" id={`skills-panel-${tab}`} aria-labelledby={`skills-tab-${tab}`} data-test-id={`skills-panel-${tab}`}>
          {tab === 'inbox' ? (
            <FeedbackInbox skillByKey={skillByKey} onOpenProposal={openProposalById} onOpenVersion={openVersion} />
          ) : data.error && !data.loading ? (
            <div className="empty" data-test-id="skills-error">
              <b>Couldn't load skills data.</b>
              <button type="button" className="btn btn-s btn-sm" onClick={data.refetch} data-test-id="skills-retry-button">
                Retry
              </button>
            </div>
          ) : data.loading ? (
            <Skeleton />
          ) : tab === 'review' ? (
            <ReviewQueue proposals={data.proposals} skillByKey={skillByKey} onOpen={setOpenProposal} ago={ago} />
          ) : tab === 'skills' ? (
            <SkillsTab skills={data.skills} proposals={data.proposals} iterations={iterations.byKey} onOpen={setOpenSkill} ago={ago} />
          ) : (
            <Changelog versions={data.versions} skillByKey={skillByKey} />
          )}
        </div>
      </div>

      {proposal ? <ProposalDrawer p={proposal} skill={skillByKey.get(proposal.skillKey)} isAdmin={isAdmin} onClose={() => setOpenProposal(null)} /> : null}
      {skill ? (
        <SkillDetail
          skill={skill}
          versions={data.versions.filter((v) => v.skillKey === skill.key)}
          isAdmin={isAdmin}
          focusVersion={focusVersion}
          onClose={() => {
            setOpenSkill(null)
            setFocusVersion(null)
          }}
        />
      ) : null}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="ob-sk-list" data-test-id="skills-loading">
      {Array.from({ length: SKELETON_ROWS }, (_, i) => (
        <div key={i} className="ob-sk-skel ob-sk-skel-row" data-test-id={`skills-skeleton-${i}`} />
      ))}
    </div>
  )
}

function Changelog({ versions, skillByKey }: { versions: SkillVersion[]; skillByKey: Map<string, Skill> }) {
  const fmt = useFormatters()
  const rows = versions.filter((v) => v.changeType !== 'initial').sort((a, b) => b.approvedAt - a.approvedAt)
  if (rows.length === 0) return <Empty title="No changes yet" desc="Approved proposals and restores are recorded here as new skill versions." />
  return (
    <ol className="feed" data-test-id="changelog-list">
      {rows.map((v) => (
        <li key={v.id} className="fi" data-test-id={`changelog-${v.id}`}>
          <span className={`fd ${v.changeType === 'proposal' ? 'pos' : ''}`} aria-hidden="true" />
          <div className="fb">
            <div className="fh">
              <b>{skillByKey.get(v.skillKey)?.name || v.skillKey}</b>
              <span>{CHANGE_TYPE_LABEL[v.changeType] ?? v.changeType}</span>
              <code className="inl">v{v.version}</code>
              {v.approvedAt ? <span className="fw">{fmt.date(v.approvedAt, { dateStyle: 'medium', timeStyle: 'short' })}</span> : null}
            </div>
            {v.approvedBy || v.changeSummary ? <p className="fp">{[v.approvedBy, v.changeSummary].filter(Boolean).join(' — ')}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
