// One skill: its current text, a version timeline, compare any two versions, restore an older one.
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Drawer } from '@/orbit/components/Drawer'
import { Markdown } from '@/orbit/components/bits'
import { useFormatters } from '@/lib/i18n'
import { CHANGE_TYPE_LABEL, failureMessage, useRestoreSkillVersion, type Skill, type SkillVersion } from '@/data/skills'
import { LineDiff } from './LineDiff'

export function SkillDetail({
  skill,
  versions,
  isAdmin,
  focusVersion,
  onClose,
}: {
  skill: Skill
  versions: SkillVersion[]
  isAdmin: boolean
  focusVersion: string | null
  onClose: () => void
}) {
  const fmt = useFormatters()
  const { restore, isPending } = useRestoreSkillVersion()
  const sorted = versions.filter((v) => v.version > 0).sort((a, b) => b.version - a.version)
  const latest = skill.version
  const [left, setLeft] = useState<number | null>(sorted[1]?.version ?? null)
  const [right, setRight] = useState<number | null>(sorted[0]?.version ?? null)
  const [confirming, setConfirming] = useState<number | null>(null)
  const byV = new Map(sorted.map((v) => [v.version, v]))
  const a = left !== null ? byV.get(left) : undefined
  const b = right !== null ? byV.get(right) : undefined

  // Bring the version a feedback chip pointed at into view once the drawer has rendered it.
  useEffect(() => {
    if (focusVersion) document.getElementById(`version-${focusVersion}`)?.scrollIntoView({ block: 'center' })
  }, [focusVersion])

  async function handleRestore(version: number) {
    try {
      const r = await restore(skill.key, version)
      toast.success(r.message || `Restored version ${version}`, r.new_version !== undefined ? { description: `Now version ${r.new_version}` } : undefined)
      setConfirming(null)
    } catch (e) {
      toast.error(failureMessage(e, 'Could not restore that version. Try again.'))
    }
  }

  return (
    <Drawer
      wide
      title={skill.name}
      meta={
        <span className="ob-sk-muted">
          {[skill.area, `v${skill.version}`, skill.key].filter(Boolean).join(' · ')}
        </span>
      }
      onClose={onClose}
    >
      <div className="ob-sk-drawer" data-test-id={`skill-detail-${skill.id}`}>
        {skill.description ? (
          <p className="ob-sk-summary" data-test-id="skill-description">
            {skill.description}
          </p>
        ) : null}
        <section className="stack" data-test-id="skill-current">
          <h3 className="sub">Current content</h3>
          {skill.content ? (
            <div className="inner ob-sk-content">
              <Markdown src={skill.content} />
            </div>
          ) : (
            <p className="ob-sk-muted">Not available — needs content.</p>
          )}
        </section>

        <section className="stack" data-test-id="skill-timeline">
          <h3 className="sub">Versions</h3>
          {sorted.length === 0 ? (
            <p className="ob-sk-muted">No versions recorded for this skill yet.</p>
          ) : (
            <ol className="ob-sk-tl" data-test-id="skill-version-list">
              {sorted.map((v) => {
                const isCurrent = v.version === latest
                return (
                  <li
                    key={v.id}
                    id={`version-${v.versionId}`}
                    className={`ob-sk-tl-i ${isCurrent ? 'is-current' : ''} ${focusVersion === v.versionId ? 'is-focus' : ''}`}
                    data-test-id={`skill-version-${v.id}`}
                  >
                    <span className="ob-sk-tl-dot" aria-hidden="true" />
                    <div className="ob-sk-tl-b">
                      <div className="row">
                        <b>Version {v.version}</b>
                        {isCurrent ? <span className="ob-loops-latest">Current</span> : null}
                        {v.approvedAt ? <time className="ob-sk-muted">{fmt.date(v.approvedAt, { dateStyle: 'medium', timeStyle: 'short' })}</time> : null}
                        {v.changeType ? <span className="ob-sk-muted">· {CHANGE_TYPE_LABEL[v.changeType] ?? v.changeType}</span> : null}
                        {v.approvedBy ? <span className="ob-sk-muted">· {v.approvedBy}</span> : null}
                      </div>
                      {v.changeSummary ? <p className="ob-sk-note-t">{v.changeSummary}</p> : null}
                      {v.feedbackIds.length ? <p className="ob-sk-muted">Incorporated {v.feedbackIds.join(', ')}</p> : null}
                      {!isCurrent && isAdmin ? (
                        confirming === v.version ? (
                          <div className="row ob-sk-confirm" role="group" aria-label={`Confirm restoring version ${v.version}`} data-test-id={`skill-restore-confirm-${v.id}`}>
                            <span>Restore version {v.version} as a new version?</span>
                            <button type="button" className="btn btn-p btn-sm" disabled={isPending} onClick={() => handleRestore(v.version)} data-test-id={`skill-restore-yes-${v.id}`}>
                              {isPending ? 'Restoring…' : 'Restore'}
                            </button>
                            <button type="button" className="btn btn-t btn-sm" disabled={isPending} onClick={() => setConfirming(null)} data-test-id={`skill-restore-no-${v.id}`}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button type="button" className="btn btn-t btn-sm" onClick={() => setConfirming(v.version)} disabled={!skill.key} data-test-id={`skill-restore-${v.id}`}>
                            Restore
                          </button>
                        )
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        {sorted.length >= 2 ? (
          <section className="stack" data-test-id="skill-compare">
            <h3 className="sub">Compare</h3>
            <div className="row">
              <VersionPick id="cmp-left" label="From" value={left} versions={sorted} onChange={setLeft} />
              <VersionPick id="cmp-right" label="To" value={right} versions={sorted} onChange={setRight} />
            </div>
            {a && b ? <LineDiff before={a.content} after={b.content} mode="unified" testId="skill-compare-diff" /> : <p className="ob-sk-muted">Pick two versions.</p>}
          </section>
        ) : null}
      </div>
    </Drawer>
  )
}

function VersionPick({ id, label, value, versions, onChange }: { id: string; label: string; value: number | null; versions: SkillVersion[]; onChange: (v: number) => void }) {
  return (
    <div className="fld ob-sk-pick">
      <label htmlFor={id}>{label}</label>
      <div className="ctl">
        <select id={id} value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))} data-test-id={`skill-${id}`}>
          {versions.map((v) => (
            <option key={v.id} value={v.version}>
              Version {v.version}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
