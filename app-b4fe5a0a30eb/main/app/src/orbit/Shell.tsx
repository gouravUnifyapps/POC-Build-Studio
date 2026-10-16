// The app shell: the forest nav rail, the header (breadcrumb, notifications, the signed-in
// person), the page, and the drawer layer above it.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useMatch } from 'react-router-dom'
import { toast } from 'sonner'
import { useOrbit } from '@/orbit/lib/context'
import { useUI } from '@/orbit/lib/store'
import { useGo, type View } from '@/orbit/lib/nav'
import { mustApprove, pocOf } from '@/orbit/lib/model'
import { notesFor, readMark, useLastSeen, writeMark, type Note } from '@/orbit/lib/notifications'
import { useFormatters } from '@/lib/i18n'
import { Avatar, Icon } from '@/orbit/components/bits'
import { Overlays } from '@/orbit/views/Overlays'
import lockup from '@/assets/unifyapps-lockup-reversed.png'
import mark from '@/assets/unifyapps-mark-reversed.png'

/** At most this many approval toasts at once; the bell lists the rest. */
const MAX_TOASTS = 3

function viewOf(pathname: string): View | 'poc' {
  if (pathname.startsWith('/pocs/')) return 'poc'
  if (pathname.startsWith('/skills') || pathname.startsWith('/feedback')) return 'feedback'
  return 'home'
}

export function Shell({ children }: { children: ReactNode }) {
  const { snap, me, ready } = useOrbit()
  const ui = useUI()
  const { go } = useGo()
  const loc = useLocation()
  const pocMatch = useMatch('/pocs/:pocId')
  const view = viewOf(loc.pathname)
  const poc = pocMatch ? pocOf(snap, decodeURIComponent(pocMatch.params.pocId || '')) : undefined
  const waitingOnMe = snap.pocs.filter((p) => mustApprove(p, me)).length
  const newFb = snap.fb.filter((f) => f.status === 'open').length

  useEffect(() => {
    document.documentElement.dataset.theme = 'light'
    document.title = 'Orbit · POC Studio'
  }, [])

  function navItem(v: View, icon: string, label: string, n: number, hint: string, hot = false) {
    const on = view === v || (v === 'home' && view === 'poc')
    return (
      <button
        type="button"
        className="ps-nav-item"
        onClick={() => go(v)}
        aria-current={on ? 'page' : undefined}
        title={ui.collapsed ? label : undefined}
      >
        <Icon name={icon} />
        <span className="ob-nav-lbl">{label}</span>
        {ready && n ? (
          <span className={`ct ${hot ? 'hot' : ''}`} title={hint}>
            {n}
          </span>
        ) : null}
      </button>
    )
  }

  return (
    <>
      <div className={`ob-app ${ui.collapsed ? 'is-collapsed' : ''}`}>
        <nav className="ps-rail ob-rail" aria-label="Main">
          <div className="lockup">
            <img src={ui.collapsed ? mark : lockup} alt="UnifyApps" />
          </div>
          <p className="ob-rail-name">POC Studio</p>
          {navItem('home', 'grid', 'POCs', waitingOnMe, `${waitingOnMe} waiting on your approval`, true)}
          {navItem('feedback', 'msg', 'Skills & Feedback', newFb, `${newFb} new`)}
          <button
            type="button"
            className="ps-nav-item ob-rail-toggle"
            onClick={() => ui.set({ collapsed: !ui.collapsed })}
            aria-label={ui.collapsed ? 'Expand the menu' : 'Collapse the menu'}
          >
            <Icon name={ui.collapsed ? 'chev-r' : 'chev-l'} />
            <span className="ob-nav-lbl">Collapse</span>
          </button>
        </nav>
        <div className="ob-mainwrap">
          <header className="ps-top">
            <nav className="crumb" aria-label="Breadcrumb">
              {view === 'poc' ? (
                <>
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault()
                      go('home')
                    }}
                  >
                    POCs
                  </a>
                  <span>/</span>
                  <b>{poc ? poc.client || poc.poc_id : 'POC'}</b>
                </>
              ) : (
                <b>{view === 'feedback' ? 'Skills & Feedback' : 'POCs'}</b>
              )}
            </nav>
            <span className="spacer" />
            <Bell />
            {me.ready ? (
              <span className="ob-me">
                <Avatar name={me.name} />
                <span className="ob-me-name">{me.name}</span>
              </span>
            ) : null}
          </header>
          <main className="ob-main">
            <div className="ob-page">{children}</div>
          </main>
        </div>
      </div>
      <Overlays />
    </>
  )
}

/** Approvals on the POCs the viewer owns: a count of the unseen ones, the list, and one toast
 *  for each new manager approval. */
function Bell() {
  const { snap, me, ready } = useOrbit()
  const { openPoc } = useGo()
  const fmt = useFormatters()
  const [open, setOpen] = useState(false)
  /** what was seen before this opening, so the new rows stay marked while the list is open */
  const [seenBefore, setSeenBefore] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const notes = ready ? notesFor(snap, me) : []
  const { seen, markSeen } = useLastSeen(me)
  const unread = notes.filter((n) => n.act.created_at > seen).length

  // toast new manager approvals once; the first visit only records where the viewer is
  const newest = notes.find((n) => n.isManager)?.act.created_at ?? 0
  useEffect(() => {
    if (!ready || !me.ready) return
    const mark = readMark('toasted', me)
    if (mark === null) {
      writeMark('toasted', me, Math.max(newest, Date.now()))
      return
    }
    const fresh = notes.filter((n) => n.isManager && n.act.created_at > mark)
    if (!fresh.length) return
    fresh.slice(0, MAX_TOASTS).forEach((n) => toast.success(n.act.message, { description: n.poc.client }))
    writeMark('toasted', me, Math.max(...fresh.map((n) => n.act.created_at)))
    // runs when a newer approval arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, me.ready, newest])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle() {
    if (!open) {
      setSeenBefore(seen)
      markSeen()
    }
    setOpen(!open)
  }

  function openNote(n: Note) {
    setOpen(false)
    openPoc(n.poc.poc_id)
  }

  return (
    <div className="ob-bell" ref={box}>
      <button
        type="button"
        className="ps-iconbtn"
        aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={toggle}
      >
        <Icon name="bell" />
        {unread ? <span className="badge">{unread}</span> : null}
      </button>
      {open ? (
        <div className="ob-bell-panel" role="region" aria-label="Notifications">
          <p className="micro ob-bell-h">Approvals on your POCs</p>
          {notes.length === 0 ? (
            <p className="ob-bell-empty">Nothing yet. Approvals on the POCs you own show up here.</p>
          ) : (
            <ul>
              {notes.map((n) => (
                <li key={n.act.id}>
                  <button type="button" className={`ob-note ${n.act.created_at > seenBefore ? 'is-new' : ''}`} onClick={() => openNote(n)}>
                    <span className={`ob-note-ic ${n.isManager ? 'pos' : ''}`}>
                      <Icon name="check" size="sm" />
                    </span>
                    <span className="ob-note-b">
                      <b>{n.act.message}</b>
                      <span>
                        {n.poc.client} · {fmt.date(n.act.created_at, { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
