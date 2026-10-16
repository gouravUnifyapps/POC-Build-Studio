// One proposal: the line diff of current vs proposed text, an editor for the proposed text,
// the feedback behind it, and a sticky Approve / Request changes / Reject bar.
import { useState } from 'react'
import { toast } from 'sonner'
import { Drawer } from '@/orbit/components/Drawer'
import { Tag } from '@/orbit/components/bits'
import { useOrbit } from '@/orbit/lib/context'
import { useFormatters } from '@/lib/i18n'
import { CONFIDENCE_LABEL, failureMessage, isPending, proposalStatusLabel, useDecideProposal, type Proposal, type Skill } from '@/data/skills'
import type { DecideSkillProposalInput } from '@/data/automationTypes'
import { LineDiff } from './LineDiff'

type Decision = NonNullable<DecideSkillProposalInput['decision']>
const DECISION_LABEL: Record<Decision, string> = { approve: 'Approve', request_changes: 'Request changes', reject: 'Reject' }

export function ProposalDrawer({ p, skill, isAdmin, onClose }: { p: Proposal; skill?: Skill; isAdmin: boolean; onClose: () => void }) {
  const { snap } = useOrbit()
  const fmt = useFormatters()
  const { decide, isPending: busy } = useDecideProposal()
  const [mode, setMode] = useState<'unified' | 'split'>('unified')
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(p.proposedContent)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState('')
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null)

  const before = p.currentContent || skill?.content || ''
  const hasBefore = Boolean(p.currentContent || skill?.content)
  const isEdited = draft !== p.proposedContent
  const fb = snap.fb.filter((f) => p.feedbackRefs.includes(f.ticket_no) || p.feedbackRefs.includes(f.id))
  const isOpen = p.status === 'pending' || p.status === 'changes_requested'
  const canDecide = isAdmin && isOpen

  async function handleDecide(decision: Decision) {
    if (decision !== 'approve' && !note.trim()) {
      setNoteError(`Add a note to ${DECISION_LABEL[decision].toLowerCase()}.`)
      document.getElementById('proposal-note')?.focus()
      return
    }
    setNoteError('')
    setPendingDecision(decision)
    try {
      const r = await decide({
        proposal_id: p.proposalId,
        decision,
        note: note.trim() || undefined,
        edited_content: decision === 'approve' && isEdited ? draft : undefined,
      })
      const extra = [
        r.new_version !== undefined ? `version ${r.new_version}` : '',
        r.incorporated_count !== undefined ? `${r.incorporated_count} feedback incorporated` : '',
      ].filter(Boolean)
      toast.success(r.message || DECISION_LABEL[decision], extra.length ? { description: extra.join(' · ') } : undefined)
      onClose()
    } catch (e) {
      toast.error(failureMessage(e, 'Could not save the decision — your note is still here.'))
    } finally {
      setPendingDecision(null)
    }
  }

  const footer = canDecide ? (
    <div className="ob-sk-bar" data-test-id="proposal-action-bar">
      <div className="fld ob-sk-note">
        <label htmlFor="proposal-note">Note</label>
        <div className={`ctl ${noteError ? 'err' : ''}`}>
          <textarea
            id="proposal-note"
            rows={2}
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
              if (noteError && e.target.value.trim()) setNoteError('')
            }}
            placeholder="Required to request changes or reject"
            aria-invalid={Boolean(noteError)}
            aria-describedby={noteError ? 'proposal-note-err' : undefined}
            data-test-id="proposal-note-input"
          />
        </div>
        {noteError ? (
          <p id="proposal-note-err" className="hint e" data-test-id="proposal-note-error">
            {noteError}
          </p>
        ) : null}
      </div>
      <div className="row ob-sk-bar-btns" data-test-id="proposal-actions">
        <button type="button" className="btn btn-t" disabled={busy} onClick={() => handleDecide('reject')} data-test-id="proposal-reject-button">
          {pendingDecision === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
        <button type="button" className="btn btn-s" disabled={busy} onClick={() => handleDecide('request_changes')} data-test-id="proposal-request-changes-button">
          {pendingDecision === 'request_changes' ? 'Sending…' : 'Request changes'}
        </button>
        <button type="button" className="btn btn-p" disabled={busy} onClick={() => handleDecide('approve')} data-test-id="proposal-approve-button">
          {pendingDecision === 'approve' ? 'Approving…' : isEdited ? 'Approve edited' : 'Approve'}
        </button>
      </div>
    </div>
  ) : undefined

  return (
    <Drawer
      wide
      title={skill?.name || p.skillKey || 'Proposal'}
      meta={
        <div className="row">
          <Tag tone={isPending(p.status) ? 'attention' : 'neutral'}>{proposalStatusLabel(p.status)}</Tag>
          {p.createdAt ? <span className="ob-sk-muted">{fmt.date(p.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</span> : null}
        </div>
      }
      onClose={onClose}
      footer={footer}
    >
      <div className="ob-sk-drawer" data-test-id="proposal-drawer">
        {isOpen && !isAdmin ? (
          <p className="ob-sk-muted" data-test-id="proposal-readonly-note">
            Only skill admins can edit or decide proposals.
          </p>
        ) : null}
        {p.summary ? (
          <p className="ob-sk-summary" data-test-id="proposal-summary">
            {p.summary}
          </p>
        ) : null}

        <section className="stack" data-test-id="proposal-diff-section">
          <div className="row ob-sk-sechd">
            <h3 className="sub">Changes</h3>
            <span className="spacer" />
            <div className="seg" role="group" aria-label="Diff layout" data-test-id="proposal-diff-mode">
              <button type="button" aria-pressed={mode === 'unified'} onClick={() => setMode('unified')} data-test-id="proposal-diff-unified">
                Unified
              </button>
              <button type="button" aria-pressed={mode === 'split'} onClick={() => setMode('split')} data-test-id="proposal-diff-split">
                Split
              </button>
            </div>
            {canDecide ? (
              <button type="button" className="btn btn-s btn-sm" aria-pressed={isEditing} onClick={() => setIsEditing((v) => !v)} data-test-id="proposal-edit-button">
                {isEditing ? 'Show diff' : 'Edit'}
              </button>
            ) : null}
          </div>
          {!hasBefore ? <p className="ob-sk-muted">Not available — needs the skill's current content.</p> : null}
          {!p.proposedContent && !isEditing ? <p className="ob-sk-muted">Not available — needs proposed content.</p> : null}
          {isEditing ? (
            <div className="fld">
              <label htmlFor="proposal-edit">Proposed text</label>
              <div className="ctl">
                <textarea id="proposal-edit" className="ob-sk-editor" value={draft} onChange={(e) => setDraft(e.target.value)} data-test-id="proposal-edit-textarea" />
              </div>
              {isEdited ? (
                <div className="row">
                  <span className="hint">Your edit is sent when you approve.</span>
                  <button type="button" className="btn btn-t btn-sm" onClick={() => setDraft(p.proposedContent)} data-test-id="proposal-edit-reset">
                    Undo edit
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <LineDiff before={before} after={draft} mode={mode} testId="proposal-diff" />
          )}
        </section>

        {p.rationale || p.risks || p.confidence || p.iterationsSaved ? (
          <dl className="ob-sk-kv" data-test-id="proposal-impact">
            {p.iterationsSaved ? (
              <div>
                <dt>Projected iterations saved / month</dt>
                <dd>{fmt.number(p.iterationsSaved)}</dd>
              </div>
            ) : null}
            {p.confidence ? (
              <div>
                <dt>Confidence</dt>
                <dd>{CONFIDENCE_LABEL[p.confidence] ?? p.confidence}</dd>
              </div>
            ) : null}
            {p.rationale ? (
              <div>
                <dt>Rationale</dt>
                <dd>{p.rationale}</dd>
              </div>
            ) : null}
            {p.risks ? (
              <div>
                <dt>Risks</dt>
                <dd>{p.risks}</dd>
              </div>
            ) : null}
            {p.decisionNote ? (
              <div>
                <dt>Decision note{p.reviewer ? ` · ${p.reviewer}` : ''}</dt>
                <dd>{p.decisionNote}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        <section className="stack" data-test-id="proposal-feedback-section">
          <h3 className="sub">Feedback behind it</h3>
          {fb.length ? (
            <ul className="ob-sk-list" data-test-id="proposal-feedback-list">
              {fb.map((f) => (
                <li key={f.id} className="ob-sk-fb" data-test-id={`proposal-feedback-${f.id}`}>
                  <code className="inl">{f.ticket_no}</code>
                  <span>{f.quote || f.feedback || f.title}</span>
                </li>
              ))}
            </ul>
          ) : p.feedbackRefs.length ? (
            <p className="ob-sk-muted">{p.feedbackRefs.join(', ')}</p>
          ) : (
            <p className="ob-sk-muted">No linked feedback on this proposal.</p>
          )}
        </section>
      </div>
    </Drawer>
  )
}
