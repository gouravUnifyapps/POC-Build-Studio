// The approval summary above the journey: what the open gate needs and who has approved it.
// Only the POC's manager can approve here; the owner approves in Slack. Only G1–G3 are ever
// approved: Deliver has no gate, and the POC is demo-ready once it is done.
import { useState, type ReactNode } from 'react'
import { useOrbit } from '@/orbit/lib/context'
import { phaseByKey, phaseOfGate } from '@/orbit/lib/loop'
import { currentPhase, isDemoReady, mustApprove, openGate, reviewDocsOf, type Poc } from '@/orbit/lib/model'
import { fail, ok, warn } from '@/orbit/lib/notify'
import { channelLabel } from '@/orbit/lib/format'
import { DocRow, useOpenDoc } from '@/orbit/components/DocView'
import { Icon } from '@/orbit/components/bits'

export function ApprovalCard({ p }: { p: Poc }) {
  const { snap, me, act } = useOrbit()
  const openDoc = useOpenDoc()
  const [busy, setBusy] = useState(false)
  const g = openGate(p)
  const phase = phaseByKey(currentPhase(p))

  if (isDemoReady(p)) {
    return (
      <Banner kind="ready" icon="check" title="Demo-ready · complete">
        {p.last_activity}
      </Banner>
    )
  }
  if (p.status === 'blocked') {
    return (
      <Banner kind="block" icon="alert" title={`Blocked · ${phase.label}`}>
        {p.blocked_on || p.last_activity}
      </Banner>
    )
  }
  if (p.status === 'stopped') {
    return (
      <Banner kind="stop" icon="stop" title={`Stopped · ${phase.label}`}>
        {p.last_activity}
      </Banner>
    )
  }
  if (!g) {
    return (
      <Banner kind="run" icon="spark" title={`Building · ${phase.label}`}>
        {p.last_activity}
      </Banner>
    )
  }

  const gp = phaseOfGate(g)
  const { owner, manager } = p.gates[g]
  const canApprove = mustApprove(p, me)
  const review = reviewDocsOf(snap, p, g)

  /** The automation's own sentence goes under a failure when it gave one. */
  const because = (message: string) => (message.trim() ? new Error(message.trim()) : undefined)

  async function approve() {
    if (!g) return
    setBusy(true)
    try {
      const r = await act.approveGate(p, g)
      if (r.status === 'forbidden') fail('Only the manager can approve', because(r.message))
      else if (r.status === 'error') fail("Couldn't save your approval", because(r.message))
      else if (r.status === 'already_decided') warn('Already decided', 'This gate was approved a moment ago.')
      else if (r.warnings.length) warn("Approved, but Slack didn't answer", 'The approval itself is saved.')
      else if (r.passed) ok(`${r.phase} approved`, r.next === 'Demo-ready' ? 'The POC is demo-ready.' : `${r.next} starts next.`)
      else ok(`Your approval of ${r.phase} is saved`, `Waiting on ${r.next} in Slack.`)
    } catch (e) {
      fail("Couldn't save your approval", e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={`ps-banner need ob-approval ob-approval--gate ${canApprove ? 'has-action' : ''}`} aria-label="Approval">
      <span className="ic">
        <Icon name="pause-c" />
      </span>
      <div className="tx">
        <b className="ob-approval-t">{gp.label} is waiting on approval</b>
        {p.gate_summary ? <span>{p.gate_summary}</span> : null}
        {review.length ? (
          <div className="ob-artgroup my-2">
            <p className="micro">To review · {review.length}</p>
            <div className="ob-doclist">
              {review.map((d) => (
                <DocRow key={d.id} d={d} onOpen={openDoc} />
              ))}
            </div>
          </div>
        ) : null}
        <div className="ob-appr-row">
          <Approval who="Owner" name={p.owner_name} done={owner} doneText="Approved in Slack" waitText="Waiting in Slack" />
          <Approval who="Manager" name={p.manager_name} done={manager} doneText="Approved" waitText="Waiting" />
        </div>
        <span className="ob-appr-note">
          The details for this stage are below.{p.slack_channel ? ` Suggestions go in ${channelLabel(p.slack_channel)}.` : ''}
        </span>
      </div>
      {canApprove ? (
        <button type="button" className="btn btn-p ob-approval-btn" onClick={() => void approve()} disabled={busy} aria-busy={busy || undefined}>
          {busy ? 'Approving…' : `Approve ${gp.label}`}
        </button>
      ) : null}
    </section>
  )
}

function Approval({ who, name, done, doneText, waitText }: { who: string; name: string; done: boolean; doneText: string; waitText: string }) {
  return (
    <span className={`ob-appr ${done ? 'is-done' : ''}`}>
      <Icon name={done ? 'check' : 'clock'} size="sm" />
      <b>
        {name ? `${who} · ${name}` : who}
      </b>
      <span>{done ? doneText : waitText}</span>
    </span>
  )
}

function Banner({ kind, icon, title, children }: { kind: string; icon: string; title: string; children: ReactNode }) {
  return (
    <section className={`ps-banner ${kind} ob-approval`}>
      <span className="ic">
        <Icon name={icon} />
      </span>
      <div className="tx">
        <b>{title}</b>
        {children ? <span>{children}</span> : null}
      </div>
    </section>
  )
}
