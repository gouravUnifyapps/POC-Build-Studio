// One compact chip per phase under its journey card ("N loops"), and one shared panel below
// all the cards that lists the open phase's loops, newest first. Hover on a chip previews the
// latest loop; a click opens the panel for that phase (only one phase at a time).
import { forwardRef, useLayoutEffect, useRef, useState } from 'react'
import { sourceLabel, type Branch } from '@/orbit/lib/model'
import { useFormatters } from '@/lib/i18n'
import { Icon } from '@/orbit/components/bits'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function useRelative() {
  const fmt = useFormatters()
  return (ts: number) => {
    if (!ts) return ''
    const diff = ts - Date.now()
    const abs = Math.abs(diff)
    if (abs < HOUR) return fmt.relative(Math.round(diff / MINUTE), 'minute')
    if (abs < DAY) return fmt.relative(Math.round(diff / HOUR), 'hour')
    return fmt.relative(Math.round(diff / DAY), 'day')
  }
}

const whoOf = (b: Branch) => b.it.actor_name || sourceLabel(b.it.source)
const feedbackOf = (b: Branch) => b.it.reason || b.it.title

export const LOOPS_PANEL_ID = 'journey-loops-panel'

export const PhaseLoopsChip = forwardRef<
  HTMLButtonElement,
  { loops: Branch[]; phaseKey: string; isOpen: boolean; onToggle: () => void }
>(function PhaseLoopsChip({ loops, phaseKey, isOpen, onToggle }, ref) {
  const rel = useRelative()
  if (!loops.length) return null
  const latest = loops[loops.length - 1]
  const firstLine = feedbackOf(latest).split('\n')[0]

  return (
    <div className="ob-loops" data-test-id={`journey-loops-${phaseKey}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            type="button"
            className={`ob-loops-chip ${isOpen ? 'is-open' : ''}`}
            aria-expanded={isOpen}
            aria-controls={LOOPS_PANEL_ID}
            onClick={onToggle}
            data-test-id={`journey-loops-chip-${phaseKey}`}
          >
            <Icon name="loop" size="sm" />
            <span>
              {loops.length} {loops.length === 1 ? 'iteration' : 'iterations'}
            </span>
            <span className="ob-loops-chev" aria-hidden="true">
              <Icon name="chev-d" size="sm" />
            </span>
          </button>
        </TooltipTrigger>
        {isOpen ? null : (
          <TooltipContent className="ob-loops-tip" data-test-id={`journey-loops-tip-${phaseKey}`}>
            <p className="ob-loops-tip-k">
              {[`Iteration ${latest.n}`, whoOf(latest), rel(latest.it.created_at)].filter(Boolean).join(' · ')}
            </p>
            {firstLine ? <p className="ob-loops-tip-f">{firstLine}</p> : null}
            <p className="ob-loops-tip-c">Click to see all</p>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  )
})

/** The shared panel. `loops` is the open phase's (kept while collapsing); `anchor` the chip. */
export function LoopsPanel({ loops, isOpen, anchor }: { loops: Branch[]; isOpen: boolean; anchor: HTMLElement | null }) {
  const [fullId, setFullId] = useState<string | null>(null)
  const panel = useRef<HTMLDivElement>(null)
  const rel = useRelative()

  // The caret sits under the chip that opened the panel; its offset is measured at run time
  // and handed to orbit.css as a custom property.
  useLayoutEffect(() => {
    const node = panel.current
    if (!node || !anchor) return
    const place = () => {
      const p = node.getBoundingClientRect()
      const a = anchor.getBoundingClientRect()
      node.style.setProperty('--caret-x', `${a.left + a.width / 2 - p.left}px`)
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [anchor, isOpen])

  const newest = loops.slice().reverse()
  return (
    <div
      ref={panel}
      id={LOOPS_PANEL_ID}
      className={`ob-loops-panel ${isOpen ? 'is-open' : ''}`}
      inert={!isOpen}
      data-test-id={LOOPS_PANEL_ID}
    >
      <div className="ob-loops-clip">
        <div className="ob-loops-box" data-test-id="journey-loops-box">
          <span className="ob-loops-caret" aria-hidden="true" />
          <ol className="ob-loops-list" aria-label="Iterations, newest first" data-test-id="journey-loops-list">
            {newest.map((b, i) => {
              const fb = feedbackOf(b)
              const isFull = fullId === b.it.id
              const when = rel(b.it.created_at)
              return (
                <li key={b.it.id} data-test-id={`journey-loop-${b.it.id}`}>
                  <button
                    type="button"
                    className="ob-loops-row"
                    aria-expanded={isFull}
                    onClick={() => setFullId(isFull ? null : b.it.id)}
                    data-test-id={`journey-loop-row-${b.it.id}`}
                  >
                    <span className="ob-loops-meta">
                      <span className="ob-branch-n" aria-hidden="true">{b.n}</span>
                      <b>{whoOf(b)}</b>
                      {when ? <time>{when}</time> : null}
                      {i === 0 ? <span className="ob-loops-latest">Latest</span> : null}
                    </span>
                    {fb ? <span className={`ob-loops-fb ${isFull ? 'is-full' : ''}`}>{fb}</span> : null}
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}
