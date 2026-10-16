// The changes the app makes: the manager's gate approval and the manager's approval of a
// suggested prompt change. POCs are created from Slack, never here. Neither approval is written
// by the app: each is one call to an automation. "POC Studio Live · Approve gate"
// (src/data/approveGate.ts) records the gate approval, moves the POC on when both approvals are
// in, and tells the owner in Slack. "POC Studio Live · Approve skill suggestion"
// (src/data/approveSuggestion.ts) makes the suggested prompt the skill's current one.
import { useApproveGate, type ApproveGateResult } from '@/data/approveGate'
import { useApproveSuggestion, type ApproveSuggestionResult } from '@/data/approveSuggestion'
import { phaseByKey, phaseIdx, phaseOf, phaseOfGate, PHASES, type GateKey } from './loop'
import { meName, type Fb, type Poc, type Suggestion, type Viewer } from './model'

export interface ApproveResult {
  /** what the automation answered: the approval was recorded, was already there, was refused
   *  because the viewer is not the manager, or failed */
  status: ApproveGateResult['status']
  /** both approvals are in: the gate passed and the POC moved on */
  passed: boolean
  phase: string
  /** who or what comes next: the next phase, or the owner still to approve in Slack */
  next: string
  /** steps after the saved approval that failed; the approval itself is saved */
  warnings: string[]
  /** the automation's own sentence */
  message: string
}

export function useOrbitActions(me: Viewer) {
  const approve = useApproveGate()
  const approveSuggested = useApproveSuggestion()

  /** The manager's approval of the open gate. When the owner has already approved it in
   *  Slack, the gate passes and the POC moves to the first stage of the next phase. */
  async function approveGate(p: Poc, g: GateKey): Promise<ApproveResult> {
    const phase = phaseOfGate(g)
    const nextPhase = PHASES[phaseIdx(phase.key) + 1]
    const r = await approve({
      poc_id: p.poc_id,
      role: 'manager',
      caller_email: me.email,
      caller_name: meName(me),
      caller_slack_id: '',
    })
    return {
      status: r.status,
      passed: r.gate_passed,
      phase: phase.label,
      next: r.gate_passed ? (nextPhase ? nextPhase.label : 'Demo-ready') : p.owner_name || 'the owner',
      warnings: r.warnings,
      message: r.message,
    }
  }

  /** The manager's approval of a suggested prompt change: the skill then runs the suggested
   *  prompt, and the tickets the suggestion rests on are resolved. */
  function approveSuggestion(s: Suggestion): Promise<ApproveSuggestionResult> {
    return approveSuggested({ suggestion_id: s.suggestion_id, caller_email: me.email, caller_name: meName(me) })
  }

  return { approveGate, approveSuggestion }
}

export type OrbitActions = ReturnType<typeof useOrbitActions>

/** The phase a feedback ticket came from, for its source chip. */
export function fbPhaseLabel(f: Pick<Fb, 'gate' | 'poc_stage'>): string {
  if (f.gate !== 'none') return phaseOfGate(f.gate).label
  return f.poc_stage ? phaseByKey(phaseOf(f.poc_stage)).label : ''
}
