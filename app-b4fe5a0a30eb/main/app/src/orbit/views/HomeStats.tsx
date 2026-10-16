// Home's stat tiles: four counts over the whole snapshot, above the status filter.
// Waiting and Blocked set Home's status filter; Open feedback opens the feedback board.
import type { ReactNode } from 'react'
import { useGo } from '@/orbit/lib/nav'
import { atGate, isLive, isOpenFb, openGate, waitSince, type Snapshot } from '@/orbit/lib/model'
import { useFormatters } from '@/lib/i18n'

/** shown in place of a count while the records load */
const PENDING = '–'

type StatFilter = 'gate' | 'blocked'

interface Stat {
  label: string
  value: number
  sub: string
}

function StatBody({ stat, ready }: { stat: Stat; ready: boolean }) {
  const fmt = useFormatters()
  return (
    <>
      <span className="micro">{stat.label}</span>
      <span className="v">{ready ? fmt.number(stat.value) : PENDING}</span>
      <span className="sub">{ready ? stat.sub : PENDING}</span>
    </>
  )
}

function StatButton({ pressed, onClick, children }: { pressed?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="tile ob-stat is-action" aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  )
}

export function HomeStats({
  snap,
  ready,
  status,
  onStatus,
}: {
  snap: Snapshot
  ready: boolean
  status: string
  onStatus: (s: StatFilter | '') => void
}) {
  const { go } = useGo()
  const { pocs, fb, acts } = snap

  const live = pocs.filter(isLive)
  const working = live.filter((p) => p.status === 'running' && !openGate(p)).length

  const waiting = pocs.filter(atGate)
  const longest = waiting.reduce<{ client: string; at: number } | null>((best, p) => {
    const at = waitSince(p, acts)
    return !best || at < best.at ? { client: p.client || p.poc_id, at } : best
  }, null)

  const blocked = pocs.filter((p) => p.status === 'blocked')
  const undecided = blocked.filter((p) => !p.blocked_on.trim()).length

  const openFb = fb.filter(isOpenFb)
  const highSeverity = openFb.filter((f) => f.severity === 'high').length

  const stats: Record<'active' | 'gate' | 'blocked' | 'feedback', Stat> = {
    active: { label: 'Active POCs', value: live.length, sub: `${working} building` },
    gate: { label: 'Waiting at a gate', value: waiting.length, sub: longest ? `Longest: ${longest.client}` : 'None waiting' },
    blocked: {
      label: 'Blocked',
      value: blocked.length,
      sub: blocked.length === 0 ? 'Nothing blocked' : undecided === 0 ? 'Each has a reason noted' : `${undecided} with no reason noted`,
    },
    feedback: { label: 'Open feedback', value: openFb.length, sub: `${highSeverity} high severity` },
  }

  const toggle = (k: StatFilter) => onStatus(status === k ? '' : k)

  return (
    <section className="ob-stats" aria-label="Summary">
      <div className="tile ob-stat">
        <StatBody stat={stats.active} ready={ready} />
      </div>
      <StatButton pressed={status === 'gate'} onClick={() => toggle('gate')}>
        <StatBody stat={stats.gate} ready={ready} />
      </StatButton>
      <StatButton pressed={status === 'blocked'} onClick={() => toggle('blocked')}>
        <StatBody stat={stats.blocked} ready={ready} />
      </StatButton>
      <StatButton onClick={() => go('feedback')}>
        <StatBody stat={stats.feedback} ready={ready} />
      </StatButton>
    </section>
  )
}
