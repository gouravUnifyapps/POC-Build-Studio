import { useOrbit } from '@/orbit/lib/context'
import { Icon } from './bits'

function RetryButton() {
  const { retry } = useOrbit()
  return (
    <button type="button" className="btn btn-s btn-sm" onClick={retry}>
      <Icon name="refresh" size="sm" />
      Retry
    </button>
  )
}

/** One line above the lists when the records cannot be shown in full. `also` is a failed read
 *  of records only the screen itself uses. */
export function DataNotice({ also }: { also?: unknown }) {
  const { ready, error, truncated } = useOrbit()
  const failed = error || also
  if (!ready || (!failed && !truncated)) return null
  return (
    <div className="ob-datanote" role="status">
      <Icon name="alert" size="sm" />
      <span>{failed ? "Some records couldn't be refreshed. What you see may be out of date." : 'Showing the first 600 records of each kind.'}</span>
      {failed ? <RetryButton /> : null}
    </div>
  )
}

/** The error a failed first load shows in place of an empty state. */
export function LoadError() {
  return (
    <div className="empty ob-empty--error" role="alert">
      <p className="title">Couldn't load the records</p>
      <p>Nothing was changed. Check your connection, then try again.</p>
      <RetryButton />
    </div>
  )
}

/** Loading: a quiet line while the records arrive. */
export function Loading({ what }: { what: string }) {
  return (
    <div className="empty" role="status">
      <p>Loading {what}…</p>
    </div>
  )
}
