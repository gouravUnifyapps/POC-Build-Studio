// Home: every POC in one table, with a status filter, phase and owner filters and sortable
// columns. The choices live in the URL query, so a filtered view can be shared.
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useOrbit } from '@/orbit/lib/context'
import { useGo } from '@/orbit/lib/nav'
import { PHASES, PHASE_KEYS, PHASE_LABEL, normPhase, phaseByKey, type PhaseKey } from '@/orbit/lib/loop'
import { plural } from '@/orbit/lib/format'
import {
  atGate,
  currentPhase,
  isDemoReady,
  mustApprove,
  openGate,
  phaseState,
  statusRank,
  type Poc,
  type Viewer,
} from '@/orbit/lib/model'
import { useFormatters } from '@/lib/i18n'
import { ClientTile, Empty, Icon, MiniRail, StatusTag } from '@/orbit/components/bits'
import { DataNotice, LoadError, Loading } from '@/orbit/components/DataNotice'
import { HomeStats } from '@/orbit/views/HomeStats'

type StatusKey = 'all' | 'mine' | 'gate' | 'building' | 'blocked' | 'done'
const STATUS_KEYS: StatusKey[] = ['all', 'mine', 'gate', 'building', 'blocked', 'done']
const STATUS_LABEL: Record<StatusKey, string> = {
  all: 'All',
  mine: 'Waiting on you',
  gate: 'Waiting on approval',
  building: 'Building',
  blocked: 'Blocked',
  done: 'Demo-ready',
}
const STATUS_TEST: Record<Exclude<StatusKey, 'all'>, (p: Poc, me: Viewer) => boolean> = {
  mine: (p, me) => mustApprove(p, me),
  gate: (p) => atGate(p),
  building: (p) => !openGate(p) && !isDemoReady(p) && p.status !== 'blocked' && p.status !== 'stopped',
  blocked: (p) => p.status === 'blocked',
  done: (p) => isDemoReady(p),
}

type SortKey = 'poc' | 'journey' | 'status' | 'last'
type SortDir = 'asc' | 'desc'
const SORT_KEYS: SortKey[] = ['poc', 'journey', 'status', 'last']
const SORT_DEFAULT: SortKey = 'status'
const SORT_FIRST_DIR: Record<SortKey, SortDir> = { poc: 'asc', journey: 'asc', status: 'asc', last: 'desc' }

const AFTERNOON_FROM = 12
const EVENING_FROM = 17

/** The greeting for the viewer's local hour now. */
function greetingNow(): string {
  const h = new Date().getHours()
  return h >= EVENING_FROM ? 'Good evening' : h >= AFTERNOON_FROM ? 'Good afternoon' : 'Good morning'
}

function oneOf<T extends string>(v: string | null, keys: readonly T[]): T | '' {
  return v && (keys as readonly string[]).includes(v) ? (v as T) : ''
}

/** Where a POC is along the journey, for sorting: phase, then its gate. */
const journeyRank = (p: Poc) => (isDemoReady(p) ? 99 : PHASE_KEYS.indexOf(currentPhase(p)) * 2 + (openGate(p) ? 1 : 0))

export default function Home() {
  const { snap, me, ready, error } = useOrbit()
  const { openPoc } = useGo()
  const fmt = useFormatters()
  const [sp, setSp] = useSearchParams()

  const status = oneOf(sp.get('status'), STATUS_KEYS) || 'all'
  const phase = normPhase(sp.get('phase'))
  const owner = sp.get('owner') || ''
  const sortKey = oneOf(sp.get('sort'), SORT_KEYS) || SORT_DEFAULT
  const sortDir = oneOf(sp.get('dir'), ['asc', 'desc'] as const) || SORT_FIRST_DIR[sortKey]

  function setParam(k: string, v: string) {
    setSp(
      (prev) => {
        const n = new URLSearchParams(prev)
        if (v) n.set(k, v)
        else n.delete(k)
        return n
      },
      { replace: true },
    )
  }

  function setSort(k: SortKey) {
    const dir = sortKey === k ? (sortDir === 'asc' ? 'desc' : 'asc') : SORT_FIRST_DIR[k]
    setSp(
      (prev) => {
        const n = new URLSearchParams(prev)
        n.set('sort', k)
        n.set('dir', dir)
        return n
      },
      { replace: true },
    )
  }

  function clearFilters() {
    setSp(
      (prev) => {
        const n = new URLSearchParams(prev)
        ;['status', 'phase', 'owner'].forEach((k) => n.delete(k))
        return n
      },
      { replace: true },
    )
  }

  const pocs = snap.pocs
  /** every filter but the status one: what the status counts are taken from */
  const base = useMemo(
    () => pocs.filter((p) => (!phase || currentPhase(p) === phase) && (!owner || p.owner_name === owner)),
    [pocs, phase, owner],
  )
  const rows = useMemo(() => {
    const r = status === 'all' ? base.slice() : base.filter((p) => STATUS_TEST[status](p, me))
    const sign = sortDir === 'asc' ? 1 : -1
    const byName = (a: Poc, b: Poc) => fmt.compare(a.client, b.client)
    const asc: Record<SortKey, (a: Poc, b: Poc) => number> = {
      poc: byName,
      journey: (a, b) => journeyRank(a) - journeyRank(b),
      status: (a, b) => statusRank(a, me) - statusRank(b, me),
      last: (a, b) => (a.last_activity_at || 0) - (b.last_activity_at || 0),
    }
    return r.sort((a, b) => sign * asc[sortKey](a, b) || b.last_activity_at - a.last_activity_at || byName(a, b))
  }, [base, status, me, sortKey, sortDir, fmt])

  const owners = [...new Set(pocs.map((p) => p.owner_name).filter(Boolean))].sort()
  const count = (k: StatusKey) => (k === 'all' ? base.length : base.filter((p) => STATUS_TEST[k](p, me)).length)
  const filtered = status !== 'all' || !!phase || !!owner

  const th = (k: SortKey, label: string) => {
    const on = sortKey === k
    return (
      <th aria-sort={on ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button type="button" className={`ob-thsort ${on ? 'is-on' : ''} ${on && sortDir === 'asc' ? 'is-asc' : ''}`} onClick={() => setSort(k)}>
          {label}
          <Icon name="chev-d" size="sm" />
        </button>
      </th>
    )
  }

  return (
    <>
      <header className="ob-pagehead ob-homehead">
        <p className="micro">{me.ready && me.first ? `${greetingNow()}, ${me.first}` : greetingNow()}</p>
        <h1 className="display ob-h1">
          POC <span className="accent-i">journeys</span>
        </h1>
        <p className="ob-sub">Every POC and where it stands in its journey.</p>
      </header>
      <DataNotice />
      <HomeStats snap={snap} ready={ready} status={status} onStatus={(s) => setParam('status', s)} />
      <div className="toolbar ob-toolbar">
        <div className="seg ob-seg-wrap" role="group" aria-label="Status">
          {STATUS_KEYS.map((k) => (
            <button key={k} type="button" aria-pressed={status === k} onClick={() => setParam('status', k === 'all' ? '' : k)}>
              {STATUS_LABEL[k]}
              <span className="ob-seg-n">{ready ? count(k) : '–'}</span>
            </button>
          ))}
        </div>
        <span className="spacer" />
        <label className="ob-pick">
          <span className="micro">Phase</span>
          <select value={phase} onChange={(e) => setParam('phase', e.target.value)} aria-label="Filter by phase">
            <option value="">Any</option>
            {PHASES.map((ph) => (
              <option key={ph.key} value={ph.key}>
                {ph.label}
              </option>
            ))}
          </select>
        </label>
        <label className="ob-pick">
          <span className="micro">Owner</span>
          <select value={owner} onChange={(e) => setParam('owner', e.target.value)} aria-label="Filter by owner">
            <option value="">Anyone</option>
            {owners.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        {filtered ? (
          <button type="button" className="btn btn-t btn-sm" onClick={clearFilters}>
            Clear all
          </button>
        ) : null}
      </div>
      {!ready ? (
        error ? (
          <LoadError />
        ) : (
          <Loading what="POCs" />
        )
      ) : pocs.length === 0 ? (
        <Empty
          title="No POCs yet"
          desc="A POC appears here once it is started from Slack."
        />
      ) : rows.length === 0 ? (
        <Empty
          title="No POCs match these filters"
          action={
            <button type="button" className="btn btn-s btn-sm" onClick={clearFilters}>
              Clear all
            </button>
          }
        />
      ) : (
        <>
          <div className="tblwrap">
            <table className="tbl ob-ptable">
              <thead>
                <tr>
                  {th('poc', 'POC')}
                  {th('journey', 'Journey')}
                  {th('status', 'Status')}
                  <th>Owner</th>
                  <th>Manager</th>
                  {th('last', 'Last activity')}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    tabIndex={0}
                    aria-label={`Open ${p.client || p.poc_id}`}
                    onClick={() => openPoc(p.poc_id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openPoc(p.poc_id)
                    }}
                  >
                    <td>
                      <div className="ob-pn">
                        <ClientTile poc={p} />
                        <div>
                          <b>{p.client || p.poc_id}</b>
                          <span>{p.use_case}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <MiniRail poc={p} />
                      <div className="ps-mini-lbl">{journeyLabel(p)}</div>
                    </td>
                    <td>
                      <StatusTag poc={p} me={me} />
                    </td>
                    <td>{p.owner_name}</td>
                    <td>{p.manager_name}</td>
                    <td>
                      <div className="ob-last">
                        {p.last_activity ? <span>{p.last_activity}</span> : null}
                        {p.last_activity_at ? <time>{fmt.date(p.last_activity_at, { dateStyle: 'medium' })}</time> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ob-range">{plural(rows.length, 'POC')}</p>
        </>
      )}
    </>
  )
}

function journeyLabel(p: Poc): string {
  if (isDemoReady(p)) return 'Demo-ready'
  const k: PhaseKey = currentPhase(p)
  const st = phaseState(p, k)
  return st === 'waiting' ? `${PHASE_LABEL[k]} · approval` : phaseByKey(k).label
}
