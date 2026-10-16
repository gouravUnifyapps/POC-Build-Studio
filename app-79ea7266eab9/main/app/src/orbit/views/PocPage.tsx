// The POC page, top to bottom: the header, the approval summary, the journey (four phases
// with their gates and iteration branches), the changes made during the journey, and the
// Documents / History tabs. A phase card selects that phase in the Documents tab.
import { useCallback, useId, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useOrbit } from '@/orbit/lib/context'
import { useGo } from '@/orbit/lib/nav'
import type { PhaseKey } from '@/orbit/lib/loop'
import { canStartBuild, isUrl, needsMe, openGate, pocOf, statusOf, type Poc, type Viewer } from '@/orbit/lib/model'
import { dropClientName } from '@/orbit/lib/format'
import { fail, ok } from '@/orbit/lib/notify'
import { copyText } from '@/orbit/lib/clipboard'
import { useFormatters } from '@/lib/i18n'
import { ClientTile, Empty, Icon, Tag } from '@/orbit/components/bits'
import { LoadError, Loading } from '@/orbit/components/DataNotice'
import { ApprovalCard } from './poc/ApprovalCard'
import { Journey } from './poc/Journey'
import { ChangesCard } from './poc/ChangesCard'
import { ArtifactsTab, type ArtView } from './poc/ArtifactsTab'
import { HistoryTab } from './poc/HistoryTab'
import { BuildPromptPanel, buildPrompt } from './poc/BuildPrompt'

type TabKey = 'artifacts' | 'history'
/** the app's scroll container (Shell's main), and the gap left above a card scrolled to */
const SCROLLER = '.ob-main'
const SCROLL_OFFSET = 16
const TABS: Array<[TabKey, string]> = [
  ['artifacts', 'Documents'],
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

/** The client tile beside two lines: who and what, then who runs it and since when. At the
 *  right end, the owner's Build button while the POC is ready to build, then the link to its
 *  Claude session. Build copies the Claude Code prompt that starts the build and shows it in a
 *  panel under the button. */
function PocHeader({ p, me }: { p: Poc; me: Viewer }) {
  const fmt = useFormatters()
  const [promptOpen, setPromptOpen] = useState(false)
  const buildBtn = useRef<HTMLButtonElement>(null)
  const actions = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const meta = [
    p.manager_name ? `Manager ${p.manager_name}` : '',
    p.started_by ? `Started by ${p.started_by}` : '',
    p.started_at ? `Started ${fmt.date(p.started_at, { dateStyle: 'medium' })}` : '',
  ].filter(Boolean)
  const useCase = dropClientName(p.use_case, p.client_name)
  // the status tag, by the same rule as Home: what waits on the viewer, or a build under way
  const status = statusOf(p, me)
  const showStatus = needsMe(p, me) || (status.tone === 'brand' && !openGate(p) && !!p.build_run_id.trim())
  const session = p.build_run_id.trim()
  const canBuild = canStartBuild(p, me)
  const hasSession = isUrl(session)

  const prompt = buildPrompt(p)

  async function copyPrompt() {
    try {
      await copyText(prompt)
      ok('Prompt copied', 'Paste it into Claude Code to start building.')
    } catch (e) {
      fail("Couldn't copy the prompt", e)
    }
  }

  function handleBuild() {
    if (promptOpen) {
      setPromptOpen(false)
      return
    }
    setPromptOpen(true)
    void copyPrompt()
  }

  const closePrompt = useCallback((refocus: boolean) => {
    setPromptOpen(false)
    if (refocus) buildBtn.current?.focus()
  }, [])

  return (
    <header className="ob-pochead">
      <ClientTile poc={p} size="lg" />
      <div className="ob-pochead-m">
        <div className="ob-pochead-t">
          <h1 className="ob-pochead-h">
            {p.client || p.poc_id}
            {useCase ? <span className="ob-pochead-uc"> · {useCase}</span> : null}
          </h1>
          {showStatus ? (
            <Tag tone={status.tone} icon={status.tone === 'attention' ? 'pause-c' : status.icon}>
              {status.label}
            </Tag>
          ) : null}
        </div>
        {meta.length ? <p className="ob-pochead-meta">{meta.join(' · ')}</p> : null}
      </div>
      {canBuild || hasSession ? <span className="spacer" /> : null}
      {canBuild || hasSession ? (
        <div className="row ob-pochead-acts" ref={actions}>
          {canBuild ? (
            <button
              ref={buildBtn}
              type="button"
              className="btn btn-p"
              aria-haspopup="dialog"
              aria-expanded={promptOpen}
              aria-controls={promptOpen ? panelId : undefined}
              onClick={handleBuild}
            >
              <Icon name="copy" size="sm" />
              Build
            </button>
          ) : null}
          {canBuild && promptOpen ? (
            <BuildPromptPanel id={panelId} prompt={prompt} anchor={actions} onCopy={() => void copyPrompt()} onClose={closePrompt} />
          ) : null}
          {hasSession ? (
            <a className="btn btn-s btn-sm" href={session} target="_blank" rel="noopener noreferrer">
              <Icon name="external" size="sm" />
              Claude session
            </a>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}
