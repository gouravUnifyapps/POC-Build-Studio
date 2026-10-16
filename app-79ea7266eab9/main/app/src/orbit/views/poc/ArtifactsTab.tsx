// Artifacts by phase. A phase that is done lists what it produced; the phase in session says
// its collaterals come once it is approved, with the inputs that arrived during it; a phase
// not reached yet says so. "All" shows every phase that has something, in order.
// The stage chosen here is the page's: a phase card on the journey sets the same value.
import { useOrbit } from '@/orbit/lib/context'
import { PHASES, phaseByKey, type PhaseKey } from '@/orbit/lib/loop'
import { artifactsOf, isInputDoc, phaseState, type Doc, type Poc } from '@/orbit/lib/model'
import { DocRow, useOpenDoc } from '@/orbit/components/DocView'
import { Empty } from '@/orbit/components/bits'

export type ArtView = 'all' | PhaseKey
type Stage = 'done' | 'current' | 'future'

const IN_SESSION = {
  title: 'This stage is in session',
  desc: 'No collaterals for this stage yet. They appear here once it is approved.',
}
const NOT_STARTED = { title: "This stage hasn't started yet", desc: 'No collaterals for this stage yet.' }

function stageOf(p: Poc, k: PhaseKey): Stage {
  const st = phaseState(p, k)
  if (st === 'done') return 'done'
  if (st === 'future') return 'future'
  return 'current'
}

export function ArtifactsTab({ p, view, onView }: { p: Poc; view: ArtView; onView: (v: ArtView) => void }) {
  const { snap } = useOrbit()
  const open = useOpenDoc()
  const groups = PHASES.map((ph) => {
    const stage = stageOf(p, ph.key)
    const all = artifactsOf(snap, p, ph.key)
    const docs = stage === 'done' ? all : stage === 'current' ? all.filter(isInputDoc) : []
    return { ph, stage, docs }
  })
  const total = groups.reduce((n, g) => n + g.docs.length, 0)

  const list = (docs: Doc[]) => (
    <div className="ob-doclist">
      {docs.map((d) => (
        <DocRow key={d.id} d={d} onOpen={open} />
      ))}
    </div>
  )

  function phaseView(k: PhaseKey) {
    const g = groups.find((x) => x.ph.key === k) ?? groups[0]
    if (g.stage === 'future') return <Empty title={NOT_STARTED.title} desc={NOT_STARTED.desc} />
    if (g.stage === 'current') {
      return (
        <>
          <Empty title={IN_SESSION.title} desc={IN_SESSION.desc} />
          {g.docs.length ? (
            <div className="ob-artgroup">
              <p className="micro">Inputs · {g.docs.length}</p>
              {list(g.docs)}
            </div>
          ) : null}
        </>
      )
    }
    if (!g.docs.length) return <Empty title={`Nothing was logged for ${phaseByKey(k).label}`} desc="This stage is approved, but no artifacts were saved for it." />
    return <div className="ob-artgroup">{list(g.docs)}</div>
  }

  return (
    <div className="ob-artifacts">
      <div className="seg" role="group" aria-label="Stage">
        <button type="button" aria-pressed={view === 'all'} onClick={() => onView('all')}>
          All
        </button>
        {groups.map(({ ph, docs }) => (
          <button key={ph.key} type="button" aria-pressed={view === ph.key} onClick={() => onView(ph.key)}>
            {ph.label}
            {docs.length ? <span className="ob-seg-n">{docs.length}</span> : null}
          </button>
        ))}
      </div>
      {view !== 'all' ? (
        phaseView(view)
      ) : total === 0 ? (
        <Empty title="No artifacts yet" desc="Each stage's documents and links appear here once it is approved." />
      ) : (
        groups
          .filter((g) => g.docs.length)
          .map(({ ph, stage, docs }) => (
            <div key={ph.key} className="ob-artgroup">
              <p className="micro">
                {ph.label}
                {stage === 'current' ? ' · in session · inputs' : ''} · {docs.length}
              </p>
              {list(docs)}
            </div>
          ))
      )}
    </div>
  )
}
