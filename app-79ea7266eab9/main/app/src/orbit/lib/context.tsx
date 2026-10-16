import { createContext, useContext, type ReactNode } from 'react'
import { useOrbitData, type OrbitData } from '@/data/orbit'
import { useOrbitActions, type OrbitActions } from './actions'
import { useViewer } from './useViewer'
import type { Viewer } from './model'

interface OrbitCtx extends OrbitData {
  me: Viewer & { loading: boolean }
  act: OrbitActions
}

const Ctx = createContext<OrbitCtx | null>(null)

export function OrbitProvider({ children }: { children: ReactNode }) {
  const data = useOrbitData()
  const me = useViewer()
  const act = useOrbitActions(me)
  return <Ctx.Provider value={{ ...data, me, act }}>{children}</Ctx.Provider>
}

export function useOrbit(): OrbitCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useOrbit must be used inside OrbitProvider')
  return v
}
