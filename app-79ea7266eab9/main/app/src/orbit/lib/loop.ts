// The POC loop: the stored stage and gate keys, and the four phases the journey shows.
// The objects use these keys as they are stored.

export type GateKey = 'g1' | 'g2' | 'g3' | 'g4'
export type StageKey =
  | '0_kickoff'
  | '1_signal_capture'
  | '2_research_assess'
  | '3_scope'
  | '4_design_system'
  | '5_build'
  | '6_finalize'
  | '7_collaterals'
  | '8_demo_ready'

export type PhaseKey = 'understand' | 'plan' | 'build' | 'deliver'

export interface Stage {
  k: StageKey
  name: string
  phase: PhaseKey
}

/** The stored stages in order, each with the phase it belongs to. */
export const STAGES: Stage[] = [
  { k: '0_kickoff', name: 'Kickoff', phase: 'understand' },
  { k: '1_signal_capture', name: 'Signal capture', phase: 'understand' },
  { k: '2_research_assess', name: 'Research and assess', phase: 'understand' },
  { k: '3_scope', name: 'Scope', phase: 'plan' },
  { k: '4_design_system', name: 'Design system', phase: 'plan' },
  { k: '5_build', name: 'Build', phase: 'build' },
  { k: '6_finalize', name: 'Finalize', phase: 'build' },
  { k: '7_collaterals', name: 'Collaterals', phase: 'deliver' },
  { k: '8_demo_ready', name: 'Demo-ready', phase: 'deliver' },
]

export interface Phase {
  key: PhaseKey
  label: string
  desc: string
  /** the gate that closes this phase */
  gate: GateKey
}

export const PHASES: Phase[] = [
  { key: 'understand', label: 'Understand', desc: 'What the client needs', gate: 'g1' },
  { key: 'plan', label: 'Plan', desc: 'What we will build', gate: 'g2' },
  { key: 'build', label: 'Build', desc: 'Make it work', gate: 'g3' },
  { key: 'deliver', label: 'Deliver', desc: 'Get it demo-ready', gate: 'g4' },
]

export const PHASE_KEYS: PhaseKey[] = PHASES.map((p) => p.key)
export const PHASE_LABEL: Record<PhaseKey, string> = {
  understand: 'Understand',
  plan: 'Plan',
  build: 'Build',
  deliver: 'Deliver',
}

export const GATES: GateKey[] = ['g1', 'g2', 'g3', 'g4']
/** Deliver's gate key. It only files Deliver's artifacts (gate_pack g4): it is never shown,
 *  never approved, and a POC whose current_gate is g4 is Deliver in progress. */
export const FINAL_GATE: GateKey = 'g4'
/** The gates people approve, between the phase cards. */
export const APPROVAL_GATES: GateKey[] = ['g1', 'g2', 'g3']

export function stageOf(k: string | undefined | null): Stage {
  return STAGES.find((s) => s.k === k) ?? STAGES[0]
}
export const stageLabel = (k: string | undefined | null) => (k ? STAGES.find((s) => s.k === k)?.name || readableCode(k) : '')

/** The phase a stored stage belongs to. */
export const phaseOf = (stage: string | undefined | null): PhaseKey => stageOf(stage).phase
export const phaseIdx = (k: PhaseKey) => PHASE_KEYS.indexOf(k)
export const phaseByKey = (k: PhaseKey): Phase => PHASES[phaseIdx(k)] ?? PHASES[0]
/** The phase a gate closes. */
export const phaseOfGate = (g: GateKey): Phase => PHASES.find((p) => p.gate === g) ?? PHASES[0]

export function normGate(g: string | undefined | null): GateKey | 'none' {
  const v = String(g || '').toLowerCase()
  return (GATES as string[]).includes(v) ? (v as GateKey) : 'none'
}

export function normPhase(v: string | undefined | null): PhaseKey | '' {
  const s = String(v || '').toLowerCase()
  return (PHASE_KEYS as string[]).includes(s) ? (s as PhaseKey) : ''
}

/** The first stage after a gate: where the POC goes once both approvals are in. */
export function nextStageAfterGate(g: GateKey): StageKey {
  const next = PHASES[phaseIdx(phaseOfGate(g).key) + 1]
  if (!next) return '8_demo_ready'
  return STAGES.find((s) => s.phase === next.key)?.k ?? '8_demo_ready'
}

/** A stored code as people read it, for a code the label maps here do not know yet:
 *  "9_client_review" reads "Client review", "poc_link" reads "Poc link". */
export function readableCode(code: string | undefined | null): string {
  const s = String(code || '')
    .trim()
    .replace(/^\d+[_-]/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
  return s ? s[0].toUpperCase() + s.slice(1) : ''
}
