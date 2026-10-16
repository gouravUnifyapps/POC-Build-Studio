// Orbit's ONE data module: every read of the app's objects goes through here. Records pass
// through with their stored field names; this file fills defaults on read.
//
// The app writes no record itself. Its three changes go through automations: Start build
// (./startBuild.ts), Approve gate (./approveGate.ts) and Approve skill suggestion
// (./approveSuggestion.ts).
import { useEffect, useMemo, useRef } from 'react'
import { ENTITY, useData } from '@/data'
import {
  FB_SEVERITIES,
  type Act,
  type Doc,
  type DocFormat,
  type Fb,
  type FbSeverity,
  type GateState,
  type Iteration,
  type Poc,
  type Skill,
  type Snapshot,
  type Suggestion,
} from '@/orbit/lib/model'
import { GATES, normGate, normPhase, type GateKey } from '@/orbit/lib/loop'
import { clientName } from '@/orbit/lib/format'

export const OBJECTS = {
  poc: ENTITY.pslPoc,
  document: ENTITY.pslDocument,
  feedback: ENTITY.pslFeedback,
  activity: ENTITY.pslActivity,
  iteration: ENTITY.pslIteration,
  skill: ENTITY.pslSkill,
  suggestion: ENTITY.pslSkillSuggestion,
} as const

/* ---------- reading ---------- */
type Row = Record<string, unknown> & { id: string; createdTime?: number; modifiedTime?: number }

const str = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'object' ? '' : String(v))
const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}
const bool = (v: unknown) => v === true || v === 'true' || v === 1
/** A lookup may arrive as its key or as an object carrying it; the app keeps the key. */
const ref = (v: unknown) => {
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return str(o.value ?? o.poc_id ?? o.document_id ?? o.id ?? o.key)
  }
  return str(v)
}

const FORMATS: DocFormat[] = ['markdown', 'html', 'link']

function gateOf(r: Row, g: GateKey): GateState {
  return {
    status: (str(r[`${g}_status`]) || 'pending') as GateState['status'],
    owner: bool(r[`${g}_owner_approved`]),
    manager: bool(r[`${g}_manager_approved`]),
    summary: str(r[`${g}_summary`]),
  }
}

function toPoc(r: Row): Poc {
  return {
    id: r.id,
    poc_id: str(r.poc_id) || r.id,
    client: clientName(str(r.client_name)),
    client_name: str(r.client_name),
    client_slug: str(r.client_slug),
    use_case: str(r.use_case),
    brief: str(r.brief),
    owner_name: str(r.owner_name),
    owner_email: str(r.owner_email),
    manager_name: str(r.manager_name),
    manager_email: str(r.manager_email),
    started_by: str(r.started_by),
    started_at: num(r.started_at) || num(r.createdTime),
    stage: str(r.stage) || '0_kickoff',
    current_gate: normGate(str(r.current_gate)),
    gates: Object.fromEntries(GATES.map((g) => [g, gateOf(r, g)])) as Record<GateKey, GateState>,
    gate_summary: str(r.gate_summary),
    status: (str(r.status) || 'running') as Poc['status'],
    blocked_on: str(r.blocked_on),
    slack_channel: str(r.slack_channel),
    build_run_id: str(r.build_run_id),
    last_activity: str(r.last_activity),
    last_activity_at: num(r.last_activity_at) || num(r.modifiedTime),
  }
}

function toDoc(r: Row): Doc {
  const format = str(r.format).toLowerCase() as DocFormat
  return {
    id: r.id,
    document_id: str(r.document_id) || r.id,
    poc: ref(r.poc),
    name: str(r.name) || str(r.document_id) || r.id,
    type: str(r.type),
    format: FORMATS.includes(format) ? format : '',
    stage: str(r.stage) || '0_kickoff',
    gate_pack: normGate(str(r.gate_pack)),
    version: num(r.version) || 1,
    status: (str(r.status) || 'draft') as Doc['status'],
    summary: str(r.summary),
    content: str(r.content),
    file_link: str(r.file_link),
    created_by: str(r.created_by),
    saved_at: num(r.saved_at) || num(r.createdTime),
  }
}

/** the stored severity code; a missing or unknown one reads as medium */
function normSeverity(v: string): FbSeverity {
  const s = v.toLowerCase()
  return (FB_SEVERITIES as string[]).includes(s) ? (s as FbSeverity) : 'medium'
}

function toFb(r: Row): Fb {
  return {
    id: r.id,
    ticket_no: str(r.ticket_no) || r.id,
    poc: ref(r.poc),
    client_name: str(r.client_name),
    poc_stage: str(r.poc_stage),
    gate: normGate(str(r.gate)),
    quote: str(r.quote),
    title: str(r.title) || str(r.feedback).slice(0, 70),
    feedback: str(r.feedback),
    target_skill: str(r.target_skill),
    status: str(r.status) || 'open',
    severity: normSeverity(str(r.severity)),
    action_taken: str(r.action_taken),
    reviewed_by: str(r.reviewed_by),
    given_by_name: str(r.given_by_name),
    created_at: num(r.created_at) || num(r.createdTime),
    resolved_at: num(r.resolved_at),
  }
}

function toAct(r: Row): Act {
  return {
    id: r.id,
    poc: ref(r.poc),
    type: str(r.type),
    stage: str(r.stage),
    gate: str(r.gate).toLowerCase(),
    decision: str(r.decision),
    actor_type: str(r.actor_type),
    actor_name: str(r.actor_name),
    actor_email: str(r.actor_email),
    actor_avatar_url: str(r.actor_avatar_url),
    message: str(r.message),
    slack_ts: str(r.slack_ts),
    slack_ref: str(r.slack_ref),
    created_at: num(r.created_at) || num(r.createdTime),
  }
}

function toIteration(r: Row): Iteration | null {
  const phase = normPhase(str(r.phase))
  if (!phase) return null
  return {
    id: r.id,
    iteration_id: str(r.iteration_id) || r.id,
    poc: ref(r.poc),
    phase,
    source: str(r.source).toLowerCase(),
    actor_name: str(r.actor_name),
    title: str(r.title),
    reason: str(r.reason),
    skill: str(r.skill),
    actor_email: str(r.actor_email),
    related_document: str(r.related_document),
    related_ticket: str(r.related_ticket),
    slack_ref: str(r.slack_ref),
    created_at: num(r.created_at) || num(r.createdTime),
  }
}

function toSkill(r: Row): Skill {
  return {
    id: r.id,
    skill_id: str(r.skill_id).trim() || r.id,
    name: str(r.name) || str(r.skill_id) || r.id,
    current_version: num(r.current_version),
    prompt: str(r.prompt),
  }
}

/** The ticket numbers a suggestion rests on: stored as one comma-separated string. */
const ticketList = (v: unknown) =>
  str(v)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

function toSuggestion(r: Row): Suggestion {
  return {
    id: r.id,
    suggestion_id: str(r.suggestion_id) || r.id,
    skill: str(r.skill).trim(),
    from_version: num(r.from_version),
    to_version: num(r.to_version),
    summary: str(r.summary),
    proposed_prompt: str(r.proposed_prompt),
    evidence_count: num(r.evidence_count),
    evidence_tickets: ticketList(r.evidence_tickets),
    status: str(r.status) || 'pending',
    created_at: num(r.created_at) || num(r.createdTime),
    approved_by: str(r.approved_by),
    approved_at: num(r.approved_at),
  }
}

const PAGE = 200

/** Reads up to three pages of one object; each next page is asked for only when the one
 *  before it came back full. */
function usePaged(id: string, object: string) {
  const p0 = useData<Row[]>(id, 'storage', { object, limit: PAGE, offset: 0 })
  const p1 = useData<Row[]>(`${id}-2`, 'storage', { object: p0.hasMore ? object : '', limit: PAGE, offset: PAGE })
  const p2 = useData<Row[]>(`${id}-3`, 'storage', {
    object: p0.hasMore && p1.hasMore ? object : '',
    limit: PAGE,
    offset: PAGE * 2,
  })
  const rows = useMemo(() => [...(p0.data ?? []), ...(p1.data ?? []), ...(p2.data ?? [])], [p0.data, p1.data, p2.data])
  return {
    rows,
    /** the first page has come back at least once */
    loaded: p0.data !== undefined,
    loading: p0.loading || p1.loading || p2.loading,
    error: p0.error || p1.error || p2.error,
    truncated: Boolean(p2.hasMore),
    refetch: () => {
      p0.refetch()
      if (p0.hasMore) p1.refetch()
      if (p0.hasMore && p1.hasMore) p2.refetch()
    },
  }
}

export function useOrbitPocs() {
  return usePaged('orbit-pocs', OBJECTS.poc)
}
export function useOrbitDocuments() {
  return usePaged('orbit-documents', OBJECTS.document)
}
export function useOrbitFeedback() {
  return usePaged('orbit-feedback', OBJECTS.feedback)
}
export function useOrbitActivity() {
  return usePaged('orbit-activity', OBJECTS.activity)
}
/** Changes made between gates. Read on its own: a failure here never blocks the other
 *  objects, it only leaves the branches and the Changes card empty. */
export function useOrbitIterations() {
  return usePaged('orbit-iterations', OBJECTS.iteration)
}
/** The POC-builder skills, with the version each runs and its prompt. */
export function useOrbitSkills() {
  return usePaged('orbit-skills', OBJECTS.skill)
}
/** The suggested prompt changes, pending and approved. */
export function useOrbitSuggestions() {
  return usePaged('orbit-suggestions', OBJECTS.suggestion)
}

export interface OrbitData {
  snap: Snapshot
  /** the four core objects have loaded at least once; until then counts are not real */
  ready: boolean
  loading: boolean
  error: unknown
  truncated: boolean
  /** the skills and their suggestions have loaded at least once: the Feedback page waits for
   *  them, no other screen does */
  skillsReady: boolean
  /** reading the skills or their suggestions failed */
  skillsError: unknown
  /** read every object again, after a failed load */
  retry: () => void
}

/** How often the lists are read again, so rows the automations write (a POC started from
 *  Slack, a message read into History) appear without a reload. `useData` has no interval
 *  option of its own, only `refetch`, so one timer below calls it. */
export const REFETCH_MS = 15_000

/** All objects as one snapshot the screens derive from. */
export function useOrbitData(): OrbitData {
  const pocs = useOrbitPocs()
  const docs = useOrbitDocuments()
  const fb = useOrbitFeedback()
  const acts = useOrbitActivity()
  const its = useOrbitIterations()
  const skills = useOrbitSkills()
  const sugs = useOrbitSuggestions()
  const snap = useMemo<Snapshot>(
    () => ({
      pocs: pocs.rows.map(toPoc),
      docs: docs.rows.map(toDoc),
      fb: fb.rows.map(toFb),
      acts: acts.rows.map(toAct),
      its: its.rows.map(toIteration).filter((x): x is Iteration => x !== null),
      skills: skills.rows.map(toSkill),
      sugs: sugs.rows.map(toSuggestion),
    }),
    [pocs.rows, docs.rows, fb.rows, acts.rows, its.rows, skills.rows, sugs.rows],
  )
  const retry = () => {
    pocs.refetch()
    docs.refetch()
    fb.refetch()
    acts.refetch()
    its.refetch()
    skills.refetch()
    sugs.refetch()
  }
  // the timer always calls the newest `retry`, so it is set up once and never restarts
  const latest = useRef(retry)
  latest.current = retry
  useEffect(() => {
    const timer = setInterval(() => latest.current(), REFETCH_MS)
    return () => clearInterval(timer)
  }, [])
  return {
    snap,
    ready: pocs.loaded && docs.loaded && fb.loaded && acts.loaded,
    loading: pocs.loading || docs.loading || fb.loading || acts.loading,
    error: pocs.error || docs.error || fb.error || acts.error,
    truncated: pocs.truncated || docs.truncated || fb.truncated || acts.truncated,
    skillsReady: skills.loaded && sugs.loaded,
    skillsError: skills.error || sugs.error,
    retry,
  }
}
