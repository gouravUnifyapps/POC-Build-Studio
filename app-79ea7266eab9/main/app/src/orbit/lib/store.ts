// UI state only (the open document reader, the nav rail) — never records.
import { create } from 'zustand'

export type Overlay = { kind: 'reader'; id: string } | null

interface UIState {
  collapsed: boolean
  overlay: Overlay
  set: (p: Partial<UIState>) => void
}

const COLLAPSE_KEY = 'orbit-nav-collapsed'

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export const useUI = create<UIState>((set) => ({
  collapsed: readCollapsed(),
  overlay: null,
  set: (p) => {
    if (p.collapsed !== undefined) {
      try {
        localStorage.setItem(COLLAPSE_KEY, p.collapsed ? '1' : '0')
      } catch {
        /* storage may be off; the toggle still works for this visit */
      }
    }
    set(p)
  },
}))
