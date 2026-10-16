// Feedback: changes asked for the POC-builder skills, grouped by the skill they affect. Each
// skill's card shows the version it runs and the versions approved so far. A suggested prompt
// change waits as the first item of its group, beside the current prompt, for a manager to
// approve: that approval is the one change this page makes, through an automation.
import { Fragment, useEffect, useState, type MouseEvent } from 'react'
import { useOrbit } from '@/orbit/lib/context'
import { clientName, plural } from '@/orbit/lib/format'
import {
  FB_STATUSES,
  approvedOf,
  fbStatusLabel,
  isManagerAnywhere,
  pendingOf,
  pocOf,
  skillOf,
  type Fb,
  type FbStatus,
  type Skill,
  type Suggestion,
  type Tone,
} from '@/orbit/lib/model'
import { fbPhaseLabel } from '@/orbit/lib/actions'
import { fail, ok, warn } from '@/orbit/lib/notify'
import { useFormatters } from '@/lib/i18n'
import { Empty, Icon, Markdown, Tag } from '@/orbit/components/bits'
import { DataNotice, LoadError, Loading } from '@/orbit/components/DataNotice'

/** 'all', or a stored status code */
type Filter = string
const NO_SKILL = ''
/** approved versions listed on a skill's card before the rest go behind "Show all" */
const SHOWN_VERSIONS = 3
/** how a version's approval day reads: "12 Oct" */
const DAY_MONTH: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
/** both prompts stay this short until "Show full prompts" opens them (layout only) */
const PROMPT_CLAMP = 'max-h-40 overflow-hidden'

const STATUS_TONE: Record<FbStatus, { tone: Tone; icon: string }> = {
  open: { tone: 'attention', icon: 'msg' },
  in_review: { tone: 'brand', icon: 'eye' },
  resolved: { tone: 'positive', icon: 'check' },
  not_incorporated: { tone: 'neutral', icon: 'x' },
}
/** a status code this app has no tone for */
const UNKNOWN_TONE: { tone: Tone; icon: string } = { tone: 'neutral', icon: 'msg' }

const articleOf = (ticket: string) => document.getElementById(`fb-${ticket}`)

export default function FeedbackBoard() {
  const { snap, ready, error, skillsReady, skillsError, me } = useOrbit()
  const [filter, setFilter] = useState<Filter>('all')
  /** an evidence ticket whose article the status filter hid: shown once the filter is cleared */
  const [jumpTo, setJumpTo] = useState<string | null>(null)
  const all = snap.fb
  const rows = all.filter((f) => filter === 'all' || f.status === filter).sort((a, b) => b.created_at - a.created_at)
  /** the known statuses in order, then any other code the records hold */
  const statuses = [...FB_STATUSES, ...[...new Set(all.map((f) => f.status))].filter((s) => !(FB_STATUSES as string[]).includes(s)).sort()]
  /** a skill with a suggestion waiting keeps its group whatever the filter leaves it, so a
   *  filter never hides a decision */
  const waiting = [...new Set(snap.sugs.filter((x) => x.status === 'pending').map((x) => x.skill))]
  const skills = [...new Set([...rows.map((f) => f.target_skill.trim()), ...waiting])].sort((a, b) =>
    a === NO_SKILL ? 1 : b === NO_SKILL ? -1 : a.localeCompare(b),
  )
  /** the page waits for the skills and their suggestions too; when that read fails, the
   *  feedback still shows and the notice above it offers a retry */
  const loaded = ready && (skillsReady || Boolean(skillsError))
  const canApprove = isManagerAnywhere(snap.pocs, me)

  useEffect(() => {
    if (!jumpTo) return
    articleOf(jumpTo)?.scrollIntoView({ block: 'center' })
    setJumpTo(null)
  }, [jumpTo, filter])

  function jump(ticket: string) {
    const el = articleOf(ticket)
    if (el) {
      el.scrollIntoView({ block: 'center' })
      return
    }
    setFilter('all')
    setJumpTo(ticket)
  }

  return (
    <>
      <div className="ob-pagehead">
        <div>
          <h1 className="ob-h1">Feedback</h1>
          <p className="ob-sub">Changes asked for the POC-builder skills, grouped by the skill they affect.</p>
        </div>
      </div>
      <DataNotice also={skillsError} />
      <div className="toolbar">
        <div className="seg ob-seg-wrap" role="group" aria-label="Status">
          {['all', ...statuses].map((k) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {k === 'all' ? 'All' : fbStatusLabel(k)}
              <span className="ob-seg-n">{ready ? (k === 'all' ? all.length : all.filter((f) => f.status === k).length) : '–'}</span>
            </button>
          ))}
        </div>
      </div>
      {!loaded ? (
        error ? (
          <LoadError />
        ) : (
          <Loading what="feedback" />
        )
      ) : all.length === 0 && waiting.length === 0 ? (
        <Empty title="No feedback yet" desc="Feedback on a POC-builder skill shows up here once it is logged from Slack or a gate." />
      ) : skills.length === 0 ? (
        <Empty
          title={`No ${fbStatusLabel(filter).toLowerCase()} feedback`}
          action={
            <button type="button" className="btn btn-s btn-sm" onClick={() => setFilter('all')}>
              Show all
            </button>
          }
        />
      ) : (
        <div className="ob-skills">
          {skills.map((s) => (
            <SkillGroup
              key={s || 'none'}
              skillId={s}
              skill={skillOf(snap, s)}
              pending={pendingOf(snap, s)[0]}
              versions={approvedOf(snap, s)}
              items={rows.filter((f) => f.target_skill.trim() === s)}
              all={all.filter((f) => f.target_skill.trim() === s)}
              canApprove={canApprove}
              onJump={jump}
            />
          ))}
        </div>
      )}
    </>
  )
}

function SkillGroup({
  skillId,
  skill,
  pending,
  versions,
  items,
  all,
  canApprove,
  onJump,
}: {
  skillId: string
  skill: Skill | undefined
  pending: Suggestion | undefined
  versions: Suggestion[]
  items: Fb[]
  all: Fb[]
  canApprove: boolean
  onJump: (ticket: string) => void
}) {
  const fmt = useFormatters()
  const open = all.filter((f) => f.status === 'open' || f.status === 'in_review').length
  const current = skill ? versions.find((v) => v.to_version === skill.current_version) : undefined
  const ver = skill
    ? [`v${skill.current_version}`, current?.approved_at ? `approved ${fmt.date(current.approved_at, DAY_MONTH)}` : ''].filter(Boolean).join(' · ')
    : ''
  return (
    <section className="ob-skillrow">
      <div className="ps-skill">
        <div className="hd">
          <span className="av ob-av-ai">
            <Icon name="layers" size="sm" />
          </span>
          <div>
            <b>{skill?.name || skillId || 'No skill named'}</b>
            {ver ? <span className="ver">{ver}</span> : null}
          </div>
        </div>
        {pending ? (
          <Tag tone="attention" icon="pause">
            Suggestion pending
          </Tag>
        ) : null}
        <div className="nums">
          <div>
            <b>{all.length}</b>feedback
          </div>
          <div>
            <b>{open}</b>open
          </div>
          <div>
            <b>{all.filter((f) => f.status === 'resolved').length}</b>incorporated
          </div>
        </div>
        {versions.length ? <VersionList versions={versions} /> : null}
      </div>
      <div className="ob-fbstack">
        {pending ? <SuggestionCard s={pending} skill={skill} canApprove={canApprove} onJump={onJump} /> : null}
        {items.map((f) => (
          <FbItem key={f.id} f={f} />
        ))}
      </div>
    </section>
  )
}

/** The skill's approved versions, newest first: three shown, the rest one click away. */
function VersionList({ versions }: { versions: Suggestion[] }) {
  const fmt = useFormatters()
  const [isOpen, setOpen] = useState(false)
  const shown = isOpen ? versions : versions.slice(0, SHOWN_VERSIONS)
  return (
    <>
      <ol className="feed" aria-label="Approved versions">
        {shown.map((v) => {
          const n = v.evidence_count || v.evidence_tickets.length
          return (
            <li key={v.id} className="fi">
              <span className="fd pos">
                <Icon name="check" size="sm" />
              </span>
              <div className="fb">
                <div className="fh">
                  <b>v{v.to_version}</b>
                  <span>{v.approved_by ? `approved by ${v.approved_by}` : 'approved'}</span>
                  {v.approved_at ? <time className="fw">{fmt.date(v.approved_at, DAY_MONTH)}</time> : null}
                </div>
                {n ? <p className="fp">{plural(n, 'ticket')}</p> : null}
              </div>
            </li>
          )
        })}
      </ol>
      {versions.length > SHOWN_VERSIONS ? (
        <button type="button" className="chev self-start" aria-expanded={isOpen} onClick={() => setOpen(!isOpen)}>
          {isOpen ? 'Show fewer versions' : `Show all ${versions.length} versions`}
        </button>
      ) : null}
    </>
  )
}

/** The suggested prompt change, written by the weekly analysis: the current prompt beside the
 *  proposed one, the tickets it rests on, and the one action, a manager's approval. */
function SuggestionCard({
  s,
  skill,
  canApprove,
  onJump,
}: {
  s: Suggestion
  skill: Skill | undefined
  canApprove: boolean
  onJump: (ticket: string) => void
}) {
  const { act } = useOrbit()
  const [busy, setBusy] = useState(false)
  const [full, setFull] = useState(false)
  const name = skill?.name || s.skill
  const since = s.from_version || skill?.current_version || 0
  const n = s.evidence_count || s.evidence_tickets.length
  const clamp = full ? '' : PROMPT_CLAMP

  /** The automation's own sentence goes under a failure when it gave one. */
  const because = (message: string) => (message.trim() ? new Error(message.trim()) : undefined)

  function handleTicket(e: MouseEvent<HTMLAnchorElement>, ticket: string) {
    e.preventDefault()
    onJump(ticket)
  }

  async function handleApprove() {
    setBusy(true)
    try {
      const r = await act.approveSuggestion(s)
      if (r.status === 'approved') {
        const v = r.to_version || s.to_version
        ok(`${name} v${v} approved`, `The skill now runs v${v}.`)
      } else if (r.status === 'already_decided') warn('Already decided', 'This suggestion was approved a moment ago.')
      else if (r.status === 'forbidden') fail('Only a manager can approve', because(r.message))
      else if (r.status === 'not_found') fail("Couldn't find this suggestion", because(r.message))
      else fail("Couldn't save the approval", because(r.message))
    } catch (e) {
      fail("Couldn't save the approval", e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="ai" aria-label={`Suggested prompt change for ${name}`}>
      <div className="hd">
        <span className="micro">Suggested prompt change</span>
        <Tag tone="neutral">Suggestion only, you decide</Tag>
      </div>
      {s.summary ? <p>{s.summary}</p> : null}
      <p className="ground">
        From {plural(n, 'ticket')}
        {since ? ` since v${since}` : ''}
        {s.evidence_tickets.map((t) => (
          <Fragment key={t}>
            {' '}
            <a href={`#fb-${t}`} onClick={(e) => handleTicket(e, t)}>
              <code className="inl ob-ticket">{t}</code>
            </a>
          </Fragment>
        ))}
      </p>
      <div className="grid g2c">
        <div className="inner">
          <p className="micro">Current prompt{skill ? ` · v${skill.current_version}` : ''}</p>
          <div className={clamp}>{skill?.prompt ? <Markdown src={skill.prompt} /> : <p className="hint">No prompt is stored for this skill yet.</p>}</div>
        </div>
        <div className="inner">
          <p className="micro">Proposed · v{s.to_version}</p>
          <div className={clamp}>
            <Markdown src={s.proposed_prompt} />
          </div>
        </div>
      </div>
      <div className="foot">
        <button type="button" className="chev" aria-expanded={full} onClick={() => setFull(!full)}>
          {full ? 'Show less' : 'Show full prompts'}
        </button>
        {canApprove ? (
          <button type="button" className="btn btn-p btn-sm" onClick={() => void handleApprove()} disabled={busy} aria-busy={busy || undefined}>
            {busy ? 'Approving…' : `Approve v${s.to_version}`}
          </button>
        ) : (
          <span className="hint">A manager approves this.</span>
        )}
      </div>
    </section>
  )
}

function FbItem({ f }: { f: Fb }) {
  const { snap } = useOrbit()
  const fmt = useFormatters()
  const p = pocOf(snap, f.poc)
  const source = [p?.client || clientName(f.client_name), fbPhaseLabel(f)].filter(Boolean).join(' · ')
  const quote = f.quote || f.feedback || f.title
  const st = STATUS_TONE[f.status as FbStatus] || UNKNOWN_TONE
  const by = [
    f.given_by_name,
    f.created_at ? fmt.date(f.created_at, { dateStyle: 'medium' }) : '',
    f.reviewed_by ? `reviewed by ${f.reviewed_by}` : '',
    f.resolved_at ? `closed ${fmt.date(f.resolved_at, { dateStyle: 'medium' })}` : '',
  ].filter(Boolean)

  return (
    <article className="ps-fb ob-fb" id={`fb-${f.ticket_no}`}>
      <div className="ob-fb-b">
        <div className="row ob-fb-top">
          <Tag tone={st.tone} icon={st.icon}>
            {fbStatusLabel(f.status)}
          </Tag>
          {source ? <code className="inl">{source}</code> : null}
          <code className="inl ob-ticket">{f.ticket_no}</code>
        </div>
        {quote ? <q>{quote}</q> : null}
        <dl className="ob-fb-kv">
          {f.target_skill ? (
            <div>
              <dt>Skill</dt>
              <dd>{f.target_skill}</dd>
            </div>
          ) : null}
          {f.title && f.title !== quote ? (
            <div>
              <dt>Change needed</dt>
              <dd>{f.title}</dd>
            </div>
          ) : null}
          {f.action_taken ? (
            <div>
              <dt>{f.status === 'not_incorporated' ? 'Why not' : 'Change made'}</dt>
              <dd>{f.action_taken}</dd>
            </div>
          ) : null}
        </dl>
        {by.length ? <p className="by">{by.join(' · ')}</p> : null}
      </div>
    </article>
  )
}
