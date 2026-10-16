// The POC owner's in-app notifications: approvals on the POCs they own, newest first.
// What the viewer has seen is kept per viewer in localStorage.
import { useCallback, useState } from 'react'
import { isOwner, pocOf, type Act, type Poc, type Snapshot, type Viewer } from './model'

export interface Note {
  act: Act
  poc: Poc
  /** a manager approval: the gate moved on, or is waiting on the owner */
  isManager: boolean
}

const MAX = 20
const isApproval = (a: Act) =>
  a.type === 'manager_approved' || a.type === 'owner_approved' || (a.type === 'gate_decided' && a.decision === 'approve')

export function notesFor(s: Snapshot, me: Viewer): Note[] {
  if (!me.ready) return []
  const out: Note[] = []
  for (const a of s.acts) {
    if (!isApproval(a)) continue
    const p = pocOf(s, a.poc)
    if (!p || !isOwner(p, me)) continue
    out.push({ act: a, poc: p, isManager: a.type !== 'owner_approved' })
  }
  return out.sort((x, y) => y.act.created_at - x.act.created_at).slice(0, MAX)
}

const keyOf = (kind: 'seen' | 'toasted', me: Viewer) => `orbit-notes-${kind}:${(me.email || me.name).toLowerCase()}`

export function readMark(kind: 'seen' | 'toasted', me: Viewer): number | null {
  try {
    const v = localStorage.getItem(keyOf(kind, me))
    return v === null ? null : Number(v) || 0
  } catch {
    return null
  }
}

export function writeMark(kind: 'seen' | 'toasted', me: Viewer, t: number) {
  try {
    localStorage.setItem(keyOf(kind, me), String(t))
  } catch {
    /* storage may be off: the count resets on the next visit */
  }
}

/** The last time this viewer opened the bell; 0 when they never have. */
export function useLastSeen(me: Viewer) {
  const [, bump] = useState(0)
  const seen = me.ready ? (readMark('seen', me) ?? 0) : 0
  const markSeen = useCallback(() => {
    writeMark('seen', me, Date.now())
    bump((n) => n + 1)
  }, [me])
  return { seen, markSeen }
}
