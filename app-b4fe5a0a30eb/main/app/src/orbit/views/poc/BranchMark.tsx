// One iteration on the journey: its numbered circle, and a popover with what happened in it.
// Hover or focus shows the popover; a click or tap pins it open until Escape, a second
// click on the same circle, or a click elsewhere. It renders in a portal so the journey's scroll box can't clip it.
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useOrbit } from '@/orbit/lib/context'
import { useUI } from '@/orbit/lib/store'
import { PHASE_LABEL } from '@/orbit/lib/loop'
import { docById, isUrl, sourceLabel, type Branch } from '@/orbit/lib/model'
import { useFormatters } from '@/lib/i18n'
import { Avatar, Icon, Tag } from '@/orbit/components/bits'

/** the popover's width and its gap to the circle, in px, as in orbit.css */
const POP_W = 320
const POP_GAP = 10
const EDGE = 12

type Place = { x: number; y: number; above: boolean }
type Mode = 'hover' | 'pinned'

/** Where the popover goes: under the circle, or above it when there is no room below. */
function placeFor(el: HTMLElement): Place {
  const r = el.getBoundingClientRect()
  const x = Math.min(Math.max(r.left + r.width / 2 - POP_W / 2, EDGE), window.innerWidth - POP_W - EDGE)
  const above = r.bottom + 280 > window.innerHeight && r.top > 300
  return { x, y: above ? window.innerHeight - r.top + POP_GAP : r.bottom + POP_GAP, above }
}

export function BranchMark({ b }: { b: Branch }) {
  const btn = useRef<HTMLButtonElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<{ mode: Mode; at: Place } | null>(null)
  const popId = useId()
  const { it, n } = b

  /** hover and focus open it unpinned, and never replace a popover that is already open */
  function peek() {
    const el = btn.current
    if (!el) return
    setOpen((cur) => cur ?? { mode: 'hover', at: placeFor(el) })
  }
  /** leaving or blurring closes only an unpinned popover */
  function unpeek() {
    setOpen((cur) => (cur?.mode === 'pinned' ? cur : null))
  }
  /** a click pins it, from closed or from hover; a click on a pinned one closes it */
  function toggle() {
    const el = btn.current
    if (!el) return
    setOpen((cur) => (cur?.mode === 'pinned' ? null : { mode: 'pinned', at: placeFor(el) }))
  }

  // Where the popover sits is measured at run time, so it is handed to orbit.css as two
  // custom properties on the element; every visual value stays in the stylesheet.
  useLayoutEffect(() => {
    const node = pop.current
    if (!node || !open) return
    node.style.setProperty('--pop-x', `${open.at.x}px`)
    node.style.setProperty('--pop-y', `${open.at.y}px`)
  }, [open])

  // Escape and a click outside the circle and the popover close it. When the page scrolls or
  // resizes it follows the circle, and closes only once the circle has left the screen.
  const isOpen = open !== null
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(null)
        btn.current?.focus()
      }
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!btn.current?.contains(t) && !pop.current?.contains(t)) setOpen(null)
    }
    const onScroll = () => {
      const el = btn.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const gone = r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth
      setOpen((cur) => (!cur || gone ? null : { ...cur, at: placeFor(el) }))
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [isOpen])

  return (
    <>
      <button
        ref={btn}
        type="button"
        className={`ob-branch-btn ${open ? 'is-open' : ''}`}
        aria-label={`Iteration ${n}, ${PHASE_LABEL[it.phase]}${it.title ? `: ${it.title}` : ''}`}
        aria-expanded={open?.mode === 'pinned'}
        aria-describedby={open ? popId : undefined}
        onMouseEnter={peek}
        onMouseLeave={unpeek}
        onFocus={peek}
        onBlur={(e) => {
          if (!pop.current?.contains(e.relatedTarget as Node)) unpeek()
        }}
        onClick={toggle}
      >
        <span className="ob-branch-n">{n}</span>
      </button>
      {open
        ? createPortal(
            <div
              ref={pop}
              id={popId}
              role={open.mode === 'pinned' ? 'dialog' : 'tooltip'}
              aria-label={open.mode === 'pinned' ? `Iteration ${n}` : undefined}
              className={`ob-pop ${open.at.above ? 'is-above' : 'is-below'} ${open.mode === 'pinned' ? 'is-pinned' : ''}`}
            >
              <IterationDetails b={b} />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function IterationDetails({ b }: { b: Branch }) {
  const { snap } = useOrbit()
  const set = useUI((s) => s.set)
  const fmt = useFormatters()
  const { it, n } = b
  const isPerson = it.source === 'person'
  const source = sourceLabel(it.source)
  const who = it.actor_name || source
  const slack = it.slack_ref.trim()
  /** the tag beside the name: the source, and Slack when the change carries a Slack reference */
  const tag = [isPerson || who !== source ? source : '', slack ? 'Slack' : ''].filter(Boolean).join(' · ')
  const doc = docById(snap, it.related_document)

  return (
    <>
      <p className="micro ob-pop-k">
        Iteration {n} · {PHASE_LABEL[it.phase]}
      </p>
      {it.title ? <p className="ob-pop-t">{it.title}</p> : null}
      {it.reason ? <p className="ob-pop-r">{it.reason}</p> : null}
      {who ? (
        <div className="ob-pop-who">
          <Avatar name={who} ai={!isPerson} size="sm" />
          <b>{who}</b>
          {tag ? <Tag tone={isPerson ? 'neutral' : 'accent'}>{tag}</Tag> : null}
        </div>
      ) : null}
      <dl className="ob-pop-kv">
        {it.skill ? (
          <>
            <dt>Skill</dt>
            <dd>
              <code className="inl">{it.skill}</code>
            </dd>
          </>
        ) : null}
        {it.related_document ? (
          <>
            <dt>Document</dt>
            <dd>
              {doc ? (
                <button type="button" className="ob-pop-link" onClick={() => set({ overlay: { kind: 'reader', id: doc.document_id } })}>
                  <Icon name="file" size="sm" />
                  {doc.name}
                </button>
              ) : (
                it.related_document
              )}
            </dd>
          </>
        ) : null}
        {it.related_ticket ? (
          <>
            <dt>Ticket</dt>
            <dd>{it.related_ticket}</dd>
          </>
        ) : null}
        {slack ? (
          <>
            <dt>Slack</dt>
            <dd>
              {isUrl(slack) ? (
                <a className="ob-pop-link" href={slack} target="_blank" rel="noopener noreferrer">
                  <Icon name="external" size="sm" />
                  Open the thread
                </a>
              ) : (
                slack
              )}
            </dd>
          </>
        ) : null}
        {it.created_at ? (
          <>
            <dt>When</dt>
            <dd>
              <time>{fmt.date(it.created_at, { dateStyle: 'medium', timeStyle: 'short' })}</time>
            </dd>
          </>
        ) : null}
      </dl>
    </>
  )
}
