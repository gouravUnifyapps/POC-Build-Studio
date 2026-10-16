// The one change the app makes: the manager's gate approval. POCs are created from Slack,
// never here, and the Feedback page only reads. The write goes straight to the objects
// through src/data/orbit.ts, stamps the POC's last_activity / last_activity_at and logs an
// Activity row.
import { useOrbitWrites } from '@/data/orbit'
import { nextStageAfterGate, phaseByKey, phaseIdx, phaseOf, phaseOfGate, PHASES, type GateKey } from './loop'
import { meName, type Fb, type Poc, type Viewer } from './model'

export interface ApproveResult {
  /** both approvals are in: the gate passed and the POC moved on */
  passed: boolean
  phase: string
  next: string
  /** the activity row did not save; the POC write did */
  logFailed: boolean
}

export function useOrbitActions(me: Viewer) {
  const w = useOrbitWrites()
  const who = meName(me)
  const actor = { actor_type: 'person', actor_name: who, actor_email: me.email }

  /** The manager's approval of the open gate. When the owner has already approved it in
   *  Slack, the gate passes and the POC moves to the first stage of the next phase. */
  async function approveGate(p: Poc, g: GateKey): Promise<ApproveResult> {
    const now = Date.now()
    const phase = phaseOfGate(g)
    const nextPhase = PHASES[phaseIdx(phase.key) + 1]
    const passed = p.gates[g].owner
    const owner = p.owner_name || 'the owner'
    let edits: Record<string, unknown> = { [`${g}_manager_approved`]: true }
    let message: string
    if (passed) {
      const next = nextStageAfterGate(g)
      edits = {
        ...edits,
        [`${g}_status`]: 'approved',
        current_gate: 'none',
        stage: next,
        status: next === '8_demo_ready' ? 'demo_ready' : 'running',
      }
      message = nextPhase ? `${who} approved ${phase.label} · ${nextPhase.label} starts` : `${who} approved ${phase.label} · demo-ready`
    } else {
      message = `${who} approved ${phase.label} · waiting on ${owner} in Slack`
    }
    await w.updatePoc(p, { ...edits, last_activity: message, last_activity_at: now })
    let logFailed = false
    try {
      await w.logActivity({
        poc: p.poc_id,
        type: passed ? 'gate_decided' : 'manager_approved',
        stage: p.stage,
        gate: g,
        decision: 'approve',
        ...actor,
        message,
        posted_to: p.slack_channel,
      })
    } catch {
      logFailed = true
    }
    return {
      passed,
      phase: phase.label,
      next: passed ? (nextPhase ? nextPhase.label : 'Demo-ready') : owner,
      logFailed,
    }
  }

  return { approveGate }
}

export type OrbitActions = ReturnType<typeof useOrbitActions>

/** The phase a feedback ticket came from, for its source chip. */
export function fbPhaseLabel(f: Pick<Fb, 'gate' | 'poc_stage'>): string {
  if (f.gate !== 'none') return phaseOfGate(f.gate).label
  return f.poc_stage ? phaseByKey(phaseOf(f.poc_stage)).label : ''
}
