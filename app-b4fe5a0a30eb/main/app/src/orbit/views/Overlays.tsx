// The layer above the page: the document reader, when one is open.
import { useCallback } from 'react'
import { useUI } from '@/orbit/lib/store'
import { Reader } from './Reader'

export function Overlays() {
  const overlay = useUI((s) => s.overlay)
  const set = useUI((s) => s.set)
  const close = useCallback(() => set({ overlay: null }), [set])
  if (!overlay) return null
  return <Reader key={overlay.id} id={overlay.id} onClose={close} />
}
