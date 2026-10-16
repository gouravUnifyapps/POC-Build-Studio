import { useMemo } from 'react'
import { useGetApiUserContext } from '@unifyapps/app-builder-sdk/hooks/user'
import { firstName } from './format'
import type { Viewer } from './model'

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** The signed-in person, from the platform. Never a constant: while it loads, `ready` is false
 *  and the screens show no name rather than a stand-in. */
export function useViewer(): Viewer & { loading: boolean } {
  const { data, isLoading } = useGetApiUserContext({ includeRoles: true })
  return useMemo(() => {
    const user = ((data as { user?: unknown } | undefined)?.user ?? {}) as Record<string, unknown>
    const joined = [text(user.firstName), text(user.lastName)].filter(Boolean).join(' ')
    const name = text(user.name) || text(user.displayName) || joined || text(user.fullName)
    const email = text(user.email) || text(user.emailAddress) || text(user.username)
    const first = firstName(name) || firstName(email.split('@')[0])
    return {
      name: name || email,
      first,
      email,
      ready: Boolean(name || email),
      loading: Boolean(isLoading),
    }
  }, [data, isLoading])
}
