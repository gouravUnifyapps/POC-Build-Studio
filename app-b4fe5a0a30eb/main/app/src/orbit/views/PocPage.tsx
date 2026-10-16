// The POC page, top to bottom: the header, the approval summary, the journey (four phases
// with their gates and iteration branches), the changes made during the journey, and the
// Artifacts / History tabs. A phase card selects that phase in the Artifacts tab.
import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useOrbit } from '@/orbit/lib/context'
import { useGo } from '@/orbit/lib/nav'
import type { PhaseKey } from '@/orbit/lib/loop'
import { mustApprove, pocOf, type Poc, type Viewer } from '@/orbit/lib/model'
import { useFormatters } from '@/lib/i18n'
import { ClientTile, Empty, Tag } from '@/orbit/components/bits'
import { LoadError, Loading } from '@/orbit/components/DataNotice'
import { ApprovalCard } from './poc/ApprovalCard'
import { Journey } from './poc/Journey'
import { ChangesCard } from './poc/ChangesCard'
import { ArtifactsTab, type ArtView } from './poc/ArtifactsTab'
import { HistoryTab } from './poc/HistoryTab'

type TabKey = 'artifacts' | 'history'
/** the app's scroll container (Shell's main), and the gap left above a card scrolled to */
const SCROLLER = '.ob-main'
const SCROLL_OFFSET = 16
const TABS: Array<[TabKey, string]> = [
  ['artifacts', 'Artifacts'],
  ['history', 'History'],
]

export default function PocPage() {
  const { pocId = '' } = useParams()
  const { snap, me, ready, error } = useOrbit()
  const { go } = useGo()
  const p = pocOf(snap, decodeURIComponent(pocId))
  if (!p) {
    if (!ready) return error ? <LoadError /> : <Loading what="the POC" />
    return (
      <Empty
        title="This POC isn't here"
        desc="It may have been removed, or the link is wrong."
        action={
          <button type="button" className="btn btn-s btn-sm" onClick={() => go('home')}>
            Back to POCs
          </button>
        }
      />
    )
  }
  return <PocView key={p.id} p={p} me={me} />
}

function PocView({ p, me }: { p: Poc; me: Viewer }) {
  const [tab, setTab] = useState<TabKey>('artifacts')
  const [artView, setArtView] = useState<ArtView>('all')
  const [changesOpen, setChangesOpen] = useState(false)
  const tabsCard = useRef<HTMLElement>(null)

  function selectPhase(k: PhaseKey) {
    setTab('artifacts')
    setArtView(k)
    // After the tab has rendered, scroll the page's own scroller (.ob-main), not the window.
    requestAnimationFrame(() => {
      const el = tabsCard.current
      const scroller = el?.closest<HTMLElement>(SCROLLER)
      if (!el || !scroller) return
      const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - SCROLL_OFFSET
      scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    })
  }

  return (
    <>
      <PocHeader p={p} me={me} />
      <ApprovalCard p={p} />
      <Journey p={p} selected={tab === 'artifacts' && artView !== 'all' ? artView : null} onSelectPhase={selectPhase} />
      <ChangesCard p={p} open={changesOpen} onToggle={() => setChangesOpen(!changesOpen)} />
      <section ref={tabsCard} className="ob-tabs-card">
        <div className="tabs" role="tablist" aria-label="POC details">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              id={`tab-${k}`}
              className="tab"
              aria-selected={tab === k}
              aria-controls={`panel-${k}`}
              onClick={() => setTab(k)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="tabpanel" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'artifacts' ? <ArtifactsTab p={p} view={artView} onView={setArtView} /> : <HistoryTab p={p} />}
        </div>
      </section>
    </>
  )
}

/** The client tile beside two lines: who and what, then who runs it and since when. */
function PocHeader({ p, me }: { p: Poc; me: Viewer }) {
  const fmt = useFormatters()
  const meta = [
    p.manager_name ? `Manager ${p.manager_name}` : '',
    p.started_by ? `Started by ${p.started_by}` : '',
    p.started_at ? `Started ${fmt.date(p.started_at, { dateStyle: 'medium' })}` : '',
  ].filter(Boolean)
  return (
    <header className="ob-pochead">
      <ClientTile poc={p} size="lg" />
      <div className="ob-pochead-m">
        <div className="ob-pochead-t">
          <h1 className="ob-pochead-h">
            {p.client || p.poc_id}
            {p.use_case ? <span className="ob-pochead-uc"> · {p.use_case}</span> : null}
          </h1>
          {mustApprove(p, me) ? (
            <Tag tone="attention" icon="pause-c">
              Waiting on you
            </Tag>
          ) : null}
        </div>
        {meta.length ? <p className="ob-pochead-meta">{meta.join(' · ')}</p> : null}
      </div>
    </header>
  )
}
