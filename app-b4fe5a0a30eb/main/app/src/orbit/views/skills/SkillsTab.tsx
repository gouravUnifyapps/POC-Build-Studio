// The Skills tab: skills grouped into collapsible area sections, with an area filter and search.
import { useState } from 'react'
import { useOrbit } from '@/orbit/lib/context'
import { Empty, Icon } from '@/orbit/components/bits'
import { AREAS, isOpenFb, isPending, type Proposal, type Skill } from '@/data/skills'

const OTHER_AREA = 'Other'

export function SkillsTab({
  skills,
  proposals,
  iterations,
  onOpen,
  ago,
}: {
  skills: Skill[]
  proposals: Proposal[]
  iterations: Map<string, number>
  onOpen: (id: string) => void
  ago: (ts: number) => string
}) {
  const { snap } = useOrbit()
  const [areas, setAreas] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const openFb = new Map<string, number>()
  for (const f of snap.fb) if (isOpenFb(f.status) && f.target_skill) openFb.set(f.target_skill, (openFb.get(f.target_skill) ?? 0) + 1)
  const pending = new Map<string, number>()
  for (const p of proposals) if (isPending(p.status)) pending.set(p.skillKey, (pending.get(p.skillKey) ?? 0) + 1)

  const known = AREAS as readonly string[]
  const extra = [...new Set(skills.map((s) => s.area || OTHER_AREA))].filter((a) => !known.includes(a)).sort()
  const order = [...known, ...extra]
  const q = query.trim().toLowerCase()
  const shown = skills.filter(
    (s) => (areas.length === 0 || areas.includes(s.area || OTHER_AREA)) && (!q || s.key.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)),
  )

  function toggleArea(a: string) {
    setAreas((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]))
  }

  if (skills.length === 0) return <Empty title="No skills yet" desc="Skills appear here once the POC-builder skills are registered." />
  return (
    <div className="stack" data-test-id="skills-tab">
      <div className="stack ob-sk-filters" data-test-id="skills-filters">
        <div className="field ob-sk-search">
          <Icon name="search" size="sm" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by skill key or name"
            aria-label="Search skills"
            data-test-id="skills-search-input"
          />
        </div>
        <div className="row ob-sk-chips" role="group" aria-label="Area" data-test-id="skills-area-filter">
          {order
            .filter((a) => skills.some((s) => (s.area || OTHER_AREA) === a))
            .map((a) => (
              <button key={a} type="button" className="ob-sk-chip" aria-pressed={areas.includes(a)} onClick={() => toggleArea(a)} data-test-id={`skills-area-${a}`}>
                {a}
              </button>
            ))}
          {areas.length ? (
            <button type="button" className="btn btn-t btn-sm" onClick={() => setAreas([])} data-test-id="skills-area-clear">
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {shown.length === 0 ? (
        <Empty title="No skills match" desc="Try another area or search." />
      ) : (
        order.map((a) => {
          const rows = shown.filter((s) => (s.area || OTHER_AREA) === a).sort((x, y) => x.name.localeCompare(y.name))
          if (!rows.length) return null
          const fbTotal = rows.reduce((n, s) => n + (openFb.get(s.key) ?? 0), 0)
          const pTotal = rows.reduce((n, s) => n + (pending.get(s.key) ?? 0), 0)
          const isOpen = !collapsed[a]
          const id = `area-${a.replace(/\W+/g, '-').toLowerCase()}`
          return (
            <section key={a} className="ob-sk-area" data-test-id={`skills-section-${id}`}>
              <button
                type="button"
                className="ob-sk-areahd"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setCollapsed((c) => ({ ...c, [a]: isOpen }))}
                data-test-id={`skills-section-toggle-${id}`}
              >
                <span className={`ob-loops-chev ${isOpen ? '' : 'is-closed'}`} aria-hidden="true">
                  <Icon name="chev-d" size="sm" />
                </span>
                <b>{a}</b>
                <span className="ob-sk-muted">{rows.length} {rows.length === 1 ? 'skill' : 'skills'}</span>
                {fbTotal ? <span className="ob-sk-count">{fbTotal} open feedback</span> : null}
                {pTotal ? <span className="ob-sk-count">{pTotal} pending</span> : null}
              </button>
              {isOpen ? (
                <div className="tblwrap ob-sk-tbl" id={id}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Skill</th>
                        <th>Version</th>
                        <th>Last updated</th>
                        <th className="n">Open feedback</th>
                        <th className="n">Pending proposals</th>
                        <th className="n">Iterations, 30 days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((s) => {
                        const f = openFb.get(s.key) ?? 0
                        const p = pending.get(s.key) ?? 0
                        const it = iterations.get(s.key) ?? 0
                        return (
                          <tr key={s.id} data-test-id={`skill-row-${s.id}`}>
                            <td>
                              <button type="button" className="ob-sk-link" onClick={() => onOpen(s.id)} data-test-id={`skill-open-${s.id}`}>
                                <b>{s.name}</b>
                                <code className="ob-sk-key">{s.key}</code>
                              </button>
                            </td>
                            <td>v{s.version}</td>
                            <td className="ob-sk-muted">
                              {s.updatedAt ? ago(s.updatedAt) : '—'}
                              {s.updatedBy ? ` · ${s.updatedBy}` : ''}
                            </td>
                            <td className={`n ${f ? '' : 'ob-sk-zero'}`}>{f}</td>
                            <td className={`n ${p ? '' : 'ob-sk-zero'}`}>{p}</td>
                            <td className={`n ${it ? '' : 'ob-sk-zero'}`}>{it}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          )
        })
      )}
    </div>
  )
}
