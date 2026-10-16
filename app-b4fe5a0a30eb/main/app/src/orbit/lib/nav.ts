import { useNavigate } from 'react-router-dom'
import { useUI } from './store'

export type View = 'home' | 'feedback'
export const VIEW_PATH: Record<View, string> = {
  home: '/',
  feedback: '/skills',
}
export const pocPath = (pocId: string) => `/pocs/${encodeURIComponent(pocId)}`

/** Change screen and close any drawer. */
export function useGo() {
  const navigate = useNavigate()
  const set = useUI((s) => s.set)
  return {
    go(v: View) {
      set({ overlay: null })
      navigate(VIEW_PATH[v])
      document.querySelector('.ob-main')?.scrollTo({ top: 0 })
    },
    openPoc(pocId: string) {
      set({ overlay: null })
      navigate(pocPath(pocId))
      document.querySelector('.ob-main')?.scrollTo({ top: 0 })
    },
  }
}
