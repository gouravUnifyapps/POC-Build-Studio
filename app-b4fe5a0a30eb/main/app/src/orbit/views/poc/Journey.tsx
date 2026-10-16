// The journey: four phase cards with a bronze gate between each (G1–G3; Deliver has no
// approval), and under them one branch per iteration, numbered across the POC in the order
// they were made. A phase's further iterations stack below its first, one layer each.
// A card selects its phase in the Artifacts tab; a branch shows its iteration in a popover.
import { useOrbit } from '@/orbit/lib/context'
import { APPROVAL_GATES, PHASES, phaseIdx, type PhaseKey } from '@/orbit/lib/loop'
import { branchesOf, itsOf, joinNames, openGate, phaseState, waitingOn, type Poc } from '@/orbit/lib/model'
import { Icon, Tag } from '@/orbit/components/bits'
import { useEffect, useRef, useState } from 'react'
import { LoopsPanel, PhaseLoopsChip } from './PhaseLoops'

export function Journey({
  p,
  selected,
  onSelectPhase,
}: {
  p: Poc
  /** the phase the Artifacts tab is showing, if one */
  selected: PhaseKey | null
  onSelectPhase: (k: PhaseKey) => void
}) {
  const { snap } = useOrbit()
  const branches = branchesOf(itsOf(snap, p))
  const g = openGate(p)
  const [openPhase, setOpenPhase] = useState<PhaseKey | null>(null)
  /** the last phase opened, so the panel keeps its rows while it collapses */
  const [shownPhase, setShownPhase] = useState<PhaseKey | null>(null)
  const chips = useRef<Partial<Record<PhaseKey, HTMLButtonElement | null>>>({})

  function handleToggle(k: PhaseKey) {
    setOpenPhase((cur) => (cur === k ? null : k))
    setShownPhase(k)
  }

  useEffect(() => {
    if (!openPhase) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      chips.current[openPhase]?.focus()
      setOpenPhase(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openPhase])

  return (
    <section className="solid ob-journey" aria-label="Journey">
      <div className="ob-jgrid">
        {PHASES.map((ph, i) => {
          const st = phaseState(p, ph.key)
          const cells = [
            <button
              key={ph.key}
              type="button"
              className={`ob-jcard ob-jcol-${2 * i + 1} is-${st} ${selected === ph.key ? 'is-selected' : ''}`}
              aria-pressed={selected === ph.key}
              onClick={() => onSelectPhase(ph.key)}
              aria-label={`${ph.label}: show its artifacts`}
            >
              <span className="ob-jcard-h">
                <b>{ph.label}</b>
                <PhaseStatus p={p} k={ph.key} />
              </span>
              <span className="ob-jcard-d">{ph.desc}</span>
            </button>,
          ]
          if (APPROVAL_GATES.includes(ph.gate)) {
            const gateDone = p.gates[ph.gate].status === 'approved' || st === 'done'
            const gateOpen = g === ph.gate
            cells.push(
              <div
                key={ph.gate}
                className={`ob-jgate ob-jcol-${2 * i + 2} ${gateDone ? 'is-done' : gateOpen ? 'is-open' : ''}`}
                role="img"
                aria-label={`${ph.gate.toUpperCase()} ${gateDone ? 'approved' : gateOpen ? 'waiting on approval' : 'not reached'}`}
              >
                <span className="ob-jgate-d">{gateDone ? <Icon name="check" size="sm" /> : null}</span>
                <span className="ob-jgate-l">{ph.gate.toUpperCase()}</span>
              </div>,
            )
          }
          return cells
        })}
        {PHASES.map((ph, i) => (
          <div key={`loops-${ph.key}`} className={`ob-jloops ob-jloopcol-${2 * i + 1}`}>
            <PhaseLoopsChip
              ref={(el) => {
                chips.current[ph.key] = el
              }}
              phaseKey={ph.key}
              loops={branches.filter((b) => b.it.phase === ph.key)}
              isOpen={openPhase === ph.key}
              onToggle={() => handleToggle(ph.key)}
            />
          </div>
        ))}
        <div className="ob-jloops-row">
          <LoopsPanel
            isOpen={openPhase !== null}
            loops={shownPhase ? branches.filter((b) => b.it.phase === shownPhase) : []}
            anchor={shownPhase ? (chips.current[shownPhase] ?? null) : null}
          />
        </div>
      </div>
    </section>
  )
}

function PhaseStatus({ p, k }: { p: Poc; k: PhaseKey }) {
  const st = phaseState(p, k)
  if (st === 'done')
    return (
      <Tag tone="positive" icon="check">
        {k === 'deliver' ? 'Complete' : 'Approved'}
      </Tag>
    )
  if (st === 'building')
    return (
      <Tag tone="brand" icon="spark">
        Building
      </Tag>
    )
  if (st === 'waiting') {
    const names = waitingOn(p, PHASES[phaseIdx(k)].gate)
    return (
      <Tag tone="attention" icon="pause-c">
        {names.length ? `Waiting on ${joinNames(names)}` : 'Waiting on approval'}
      </Tag>
    )
  }
  if (st === 'blocked')
    return (
      <Tag tone="negative" icon="alert">
        Blocked
      </Tag>
    )
  if (st === 'stopped')
    return (
      <Tag tone="neutral" icon="stop">
        Stopped
      </Tag>
    )
  return null
}
