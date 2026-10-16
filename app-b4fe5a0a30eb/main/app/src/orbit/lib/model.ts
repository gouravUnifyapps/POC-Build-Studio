// The app's records and everything derived from them: pure functions over a snapshot.
// The records come from src/data/orbit.ts.
import {
  normGate,
  phaseByKey,
  phaseIdx,
  phaseOf,
  phaseOfGate,
  FINAL_GATE,
  readableCode,
  type GateKey,
  type PhaseKey,
} from './loop'
import { firstName } from './format'

export type GateStatus = 'pending' | 'waiting' | 'approved' | 'changes_requested'
export type PocStatus = 'running' | 'waiting' | 'blocked' | 'stopped' | 'demo_ready'

export interface GateState {
  status: GateStatus
  /** the POC owner's approval, given in Slack */
  owner: boolean
  /** the manager's approval, given in the app */
  manager: boolean
  /** what the phase produced, shown once the gate is approved */
  summary: string
}

export interface Poc {
  id: string
  poc_id: string
  /** as shown: the stored name without an old "[Example] " / "[Test] " prefix */
  client: string
  client_name: string
  client_slug: string
  use_case: string
  brief: string
  owner_name: string
  owner_email: string
  manager_name: string
  manager_email: string
  started_by: string
  started_at: number
  stage: string
  current_gate: GateKey | 'none'
  gates: Record<GateKey, GateState>
  /** the current approval summary for the open gate */
  gate_summary: string
  status: PocStatus
  blocked_on: string
  slack_channel: string
  last_activity: string
  last_activity_at: number
  /** the record as read, flat: every update sends it whole with the edits on top */
  _raw: Record<string, unknown>
}

export type DocStatus = 'draft' | 'in_review' | 'approved' | 'final' | 'superseded'
export type DocFormat = 'markdown' | 'html' | 'link'
export interface Doc {
  id: string
  document_id: string
  poc: string
  name: string
  type: string
  /** as stored; missing means markdown, or link when only file_link is set (see docFormat) */
  format: DocFormat | ''
  stage: string
  gate_pack: GateKey | 'none'
  version: number
  status: DocStatus
  summary: string
  content: string
  file_link: string
  created_by: string
  saved_at: number
}

/** The feedback statuses this app has labels for. A record may hold another code. */
export type FbStatus = 'open' | 'in_review' | 'resolved' | 'not_incorporated'
export type FbSeverity = 'low' | 'medium' | 'high'
export const FB_SEVERITIES: FbSeverity[] = ['low', 'medium', 'high']
export interface Fb {
  id: string
  ticket_no: string
  poc: string
  client_name: string
  poc_stage: string
  gate: GateKey | 'none'
  quote: string
  title: string
  feedback: string
  target_skill: string
  /** the stored code, as stored */
  status: string
  severity: FbSeverity
  action_taken: string
  reviewed_by: string
  given_by_name: string
  created_at: number
  resolved_at: number
  /** self_llm | iteration | user | reviewer */
  source: string
  /** proposal_id of the skill proposal using this item */
  skill_proposal: string
  /** version_id ("<skill_key>@v<n>") this item was incorporated in */
  incorporated_in_version: string
}

export interface Act {
  id: string
  poc: string
  type: string
  stage: string
  gate: string
  decision: string
  actor_type: string
  actor_name: string
  actor_email: string
  message: string
  created_at: number
}

export interface Iteration {
  id: string
  iteration_id: string
  poc: string
  phase: PhaseKey
  /** the stored code, lower case: nebula, judge, person, or one this app does not know */
  source: string
  actor_name: string
  title: string
  reason: string
  skill: string
  actor_email: string
  /** a document_id, when the change came with one */
  related_document: string
  /** a feedback ticket_no, when the change came from one */
  related_ticket: string
  /** a Slack permalink or message reference */
  slack_ref: string
  created_at: number
}

export interface Snapshot {
  pocs: Poc[]
  docs: Doc[]
  fb: Fb[]
  acts: Act[]
  its: Iteration[]
}

export interface Viewer {
  name: string
  first: string
  email: string
  ready: boolean
}

/* ---------- labels for stored codes, declared once ----------
   A deployed app has no allowed read of an object's picklist titles: its only reads are the
   Storage FETCH binding, which answers records and no field metadata, and the entity API that
   would answer it is closed to app code (see src/data/index.ts). So the labels for the codes
   the objects hold today are kept here, and a code they do not name reads as its stored
   value made readable (readableCode), never blank. */
const FB_STATUS_LABEL: Record<FbStatus, string> = {
  open: 'New',
  in_review: 'Under review',
  resolved: 'Incorporated',
  not_incorporated: 'Not incorporated',
}
export const FB_STATUSES: FbStatus[] = ['open', 'in_review', 'resolved', 'not_incorporated']
export const fbStatusLabel = (s: string) => FB_STATUS_LABEL[s as FbStatus] || readableCode(s)

const SOURCE_LABEL: Record<string, string> = { nebula: 'Nebula', judge: 'Judge', person: 'Person' }
export const sourceLabel = (s: string) => SOURCE_LABEL[s] || readableCode(s)

const DOC_TYPE_LABEL: Record<string, string> = {
  brief: 'Brief',
  input: 'Input',
  requirements: 'Requirements',
  scope: 'Scope',
  email: 'Email',
  brd: 'BRD',
  design_system: 'Design system',
  build_report: 'Build report',
  app: 'App',
  evidence_pack: 'Evidence pack',
  demo_script: 'Demo script',
  deck: 'Deck',
  video: 'Video',
  use_case: 'Use case',
  design: 'Design',
  automation: 'Automation',
  object: 'Object',
  agent: 'AI agent',
  walkthrough: 'Walkthrough',
  poc_link: 'POC app link',
}
export const docTypeLabel = (t: string) => DOC_TYPE_LABEL[t] || readableCode(t)

/** Inputs belong to the phase of their stage; every other document to the phase of its gate. */
export const INPUT_TYPES = ['input', 'brief', 'email', 'requirements']
export const isInputDoc = (d: Pick<Doc, 'type'>) => INPUT_TYPES.includes(d.type)

/* ---------- identity ---------- */
const same = (a: string, b: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase()

/** The viewer as an activity row names them: the platform user's name, else their email. */
export const meName = (me: Viewer) => me.name || me.email

/** A stored person is the viewer when the email matches, the full name matches, or the stored
 *  value's first name matches the viewer's first name. */
function matches(name: string, email: string, me: Viewer): boolean {
  if (!me.ready) return false
  return same(email, me.email) || same(name, me.name) || same(firstName(name), me.first)
}
export const isOwner = (p: Poc, me: Viewer) => matches(p.owner_name, p.owner_email, me)
export const isManager = (p: Poc, me: Viewer) => matches(p.manager_name, p.manager_email, me)

/* ---------- where a POC is ---------- */
export const isDemoReady = (p: Poc) => p.status === 'demo_ready' || p.stage === '8_demo_ready'
export const isHalted = (p: Poc) => p.status === 'stopped' || p.status === 'blocked'
/** The gate waiting on approval, if any. Deliver has no approval: g4 is never open. */
export const openGate = (p: Poc): GateKey | null =>
  p.current_gate !== 'none' && p.current_gate !== FINAL_GATE && !isDemoReady(p) ? p.current_gate : null
/** Deliver is complete only once the POC is demo-ready. */
export const gateApproved = (p: Poc, g: GateKey) =>
  isDemoReady(p) || (g !== FINAL_GATE && p.gates[g].status === 'approved')
/** Still being worked on: not demo-ready and not stopped. */
export const isLive = (p: Poc) => !isDemoReady(p) && p.status !== 'stopped'
/** Waiting at an open gate, and not blocked or stopped (Home's "Waiting on approval"). */
export const atGate = (p: Poc) => !!openGate(p) && !isHalted(p)
/** Feedback someone still has to deal with. */
export const isOpenFb = (f: Pick<Fb, 'status'>) => f.status === 'open' || f.status === 'in_review'

/** When the POC's open gate was posted: its newest gate_posted activity for that gate, else
 *  its last activity. 0 when it has no open gate. */
export function waitSince(p: Poc, acts: Act[]): number {
  const g = openGate(p)
  if (!g) return 0
  let at = 0
  for (const a of acts) {
    if (a.type === 'gate_posted' && normGate(a.gate) === g && refersTo(a.poc, p) && a.created_at > at) at = a.created_at
  }
  return at || p.last_activity_at || 0
}

/** The manager must act: a gate is open, the POC is not stopped or blocked, and the manager
 *  has not approved it yet. */
export function mustApprove(p: Poc, me: Viewer): boolean {
  const g = openGate(p)
  return !!g && !isHalted(p) && isManager(p, me) && !p.gates[g].manager
}

/** The phase the POC is in: the phase its open gate closes, else the phase of its stage. */
export function currentPhase(p: Poc): PhaseKey {
  if (isDemoReady(p) || p.current_gate === FINAL_GATE) return 'deliver'
  const g = openGate(p)
  return g ? phaseOfGate(g).key : phaseOf(p.stage)
}

export type PhaseState = 'done' | 'waiting' | 'building' | 'blocked' | 'stopped' | 'future'

export function phaseState(p: Poc, k: PhaseKey): PhaseState {
  const ph = phaseByKey(k)
  if (gateApproved(p, ph.gate)) return 'done'
  const cur = currentPhase(p)
  if (phaseIdx(k) < phaseIdx(cur)) return 'done'
  if (k !== cur) return 'future'
  if (p.status === 'blocked') return 'blocked'
  if (p.status === 'stopped') return 'stopped'
  if (openGate(p) === ph.gate) return 'waiting'
  return 'building'
}

/** Who has not approved the open gate yet, by the names the POC stores. */
export function waitingOn(p: Poc, g: GateKey): string[] {
  const out: string[] = []
  if (!p.gates[g].owner) out.push(p.owner_name || 'the owner')
  if (!p.gates[g].manager) out.push(p.manager_name || 'the manager')
  return out
}

export const joinNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

export type Tone = 'positive' | 'attention' | 'negative' | 'neutral' | 'brand'
export interface StatusView {
  tone: Tone
  label: string
  icon: string
}

/** The POC's status as one tag: who has to act, or what is happening. */
export function statusOf(p: Poc, me: Viewer): StatusView {
  if (isDemoReady(p)) return { tone: 'positive', label: 'Demo-ready', icon: 'check' }
  if (p.status === 'blocked') return { tone: 'negative', label: 'Blocked', icon: 'alert' }
  if (p.status === 'stopped') return { tone: 'neutral', label: 'Stopped', icon: 'stop' }
  const g = openGate(p)
  if (g) {
    if (mustApprove(p, me)) return { tone: 'attention', label: 'Waiting on you', icon: 'pause' }
    const { owner, manager } = p.gates[g]
    const label =
      !owner && !manager
        ? 'Waiting on owner and manager'
        : !owner
          ? 'Waiting on owner'
          : !manager
            ? 'Waiting on manager'
            : 'Waiting on approval'
    return { tone: 'attention', label, icon: 'pause' }
  }
  return { tone: 'brand', label: 'Building', icon: 'spark' }
}

/** Default order on Home: waiting on you, blocked, waiting on someone, building, the rest. */
export function statusRank(p: Poc, me: Viewer): number {
  if (mustApprove(p, me)) return 0
  if (p.status === 'blocked') return 1
  if (openGate(p)) return 2
  if (!isDemoReady(p) && p.status !== 'stopped') return 3
  return 4
}

/* ---------- lookups over a snapshot ---------- */
export const refersTo = (ref: string, p: Poc) => !!ref && (ref === p.poc_id || ref === p.id)

export function pocOf(s: Snapshot, ref: string | null | undefined): Poc | undefined {
  if (!ref) return undefined
  return s.pocs.find((p) => refersTo(ref, p))
}

/** Latest version of each document: one row per POC, stage and name. */
export function latestOnly(ds: Doc[]): Doc[] {
  const latest = new Map<string, Doc>()
  ds.forEach((d) => {
    const k = d.poc + '|' + d.stage + '|' + d.name
    const cur = latest.get(k)
    if (!cur || cur.version < d.version) latest.set(k, d)
  })
  return [...latest.values()]
}

export const docsOf = (s: Snapshot, p: Poc) => latestOnly(s.docs.filter((d) => refersTo(d.poc, p)))

export const docById = (s: Snapshot, id: string | null | undefined) =>
  id ? s.docs.find((d) => d.document_id === id || d.id === id) : undefined

export function docFormat(d: Pick<Doc, 'format' | 'content' | 'file_link'>): DocFormat {
  if (d.format) return d.format
  if (d.file_link && !d.content.trim()) return 'link'
  return 'markdown'
}

export const isUrl = (s: string) => /^https?:\/\//i.test(s.trim())

/** A phase's artifacts: the latest documents in its gate pack, plus the inputs that arrived
 *  during it. Newest first. */
export function artifactsOf(s: Snapshot, p: Poc, k: PhaseKey): Doc[] {
  const g = phaseByKey(k).gate
  return docsOf(s, p)
    .filter((d) => d.status !== 'superseded')
    .filter((d) => d.gate_pack === g || (isInputDoc(d) && d.gate_pack === 'none' && phaseOf(d.stage) === k))
    .sort((a, b) => b.saved_at - a.saved_at)
}

export const itsOf = (s: Snapshot, p: Poc) => s.its.filter((i) => refersTo(i.poc, p)).sort((a, b) => b.created_at - a.created_at)
export const actsOf = (s: Snapshot, p: Poc) => s.acts.filter((a) => refersTo(a.poc, p)).sort((a, b) => b.created_at - a.created_at)

/** One branch per iteration on the journey: numbered 1, 2, 3… across the POC in the order
 *  they were made, each stacked one layer below the phase's previous one. */
export interface Branch {
  it: Iteration
  n: number
  layer: number
}
export function branchesOf(its: Iteration[]): Branch[] {
  const depth = new Map<PhaseKey, number>()
  return its
    .slice()
    .sort((a, b) => (a.created_at || 0) - (b.created_at || 0) || a.id.localeCompare(b.id))
    .map((it, i) => {
      const layer = depth.get(it.phase) || 0
      depth.set(it.phase, layer + 1)
      return { it, n: i + 1, layer }
    })
}

export const isAiActor = (type: string, name: string) =>
  type === 'ai' || type === 'system' || /^(nebula|judge|system|ai\b)/i.test(name.trim())

