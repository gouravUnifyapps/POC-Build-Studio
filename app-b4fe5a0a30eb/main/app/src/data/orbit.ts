// Orbit's ONE data module: every read and write of the app's objects goes through here.
// Records pass through with their stored field names; this file fills defaults on read and
// leaves empty values out on write (an enum or a lookup refuses "").
//
// No automations: writes go straight to the objects through the app's Storage dataSources.
import { useMemo } from 'react'
import { ENTITY, useCreateRecord, useData, useUpdateRecord, toPayload } from '@/data'
import { FB_SEVERITIES, type Act, type Doc, type DocFormat, type Fb, type FbSeverity, type GateState, type Iteration, type Poc, type Snapshot } from '@/orbit/lib/model'
import { GATES, normGate, normPhase, type GateKey } from '@/orbit/lib/loop'
import { clientName } from '@/orbit/lib/format'

export const OBJECTS = {
  poc: ENTITY.orbitPoc,
  document: ENTITY.orbitDocument,
  feedback: ENTITY.orbitFeedback,
  activity: ENTITY.orbitActivity,
  iteration: ENTITY.orbitIteration,
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
    last_activity: str(r.last_activity),
    last_activity_at: num(r.last_activity_at) || num(r.modifiedTime),
    _raw: r,
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
    source: str(r.source).toLowerCase(),
    skill_proposal: str(r.skill_proposal),
    incorporated_in_version: str(r.incorporated_in_version),
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
    message: str(r.message),
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

export interface OrbitData {
  snap: Snapshot
  /** the four core objects have loaded at least once; until then counts are not real */
  ready: boolean
  loading: boolean
  error: unknown
  truncated: boolean
  /** read every object again, after a failed load */
  retry: () => void
}

/** All objects as one snapshot the screens derive from. */
export function useOrbitData(): OrbitData {
  const pocs = useOrbitPocs()
  const docs = useOrbitDocuments()
  const fb = useOrbitFeedback()
  const acts = useOrbitActivity()
  const its = useOrbitIterations()
  const snap = useMemo<Snapshot>(
    () => ({
      pocs: pocs.rows.map(toPoc),
      docs: docs.rows.map(toDoc),
      fb: fb.rows.map(toFb),
      acts: acts.rows.map(toAct),
      its: its.rows.map(toIteration).filter((x): x is Iteration => x !== null),
    }),
    [pocs.rows, docs.rows, fb.rows, acts.rows, its.rows],
  )
  return {
    snap,
    ready: pocs.loaded && docs.loaded && fb.loaded && acts.loaded,
    loading: pocs.loading || docs.loading || fb.loading || acts.loading,
    error: pocs.error || docs.error || fb.error || acts.error,
    truncated: pocs.truncated || docs.truncated || fb.truncated || acts.truncated,
    retry: () => {
      pocs.refetch()
      docs.refetch()
      fb.refetch()
      acts.refetch()
      its.refetch()
    },
  }
}

/* ---------- writing ---------- */
type Fields = Record<string, unknown>
const LOOKUPS = ['poc', 'related_document']

/** Empty values are left out: an enum or a lookup refuses "" and null. */
function clean(fields: Fields): Fields {
  const out: Fields = {}
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === '' || v === null) continue
    out[k] = v
  }
  return out
}

/** The whole stored record with the edits on top: an update replaces the record. An edit of
 *  "" or null removes the field. */
function merged(raw: Fields, edits: Fields): Fields {
  const base = toPayload(raw)
  for (const [k, v] of Object.entries(base)) {
    if (v === '' || v === null) delete base[k]
    // a lookup read back as an object is written as its key
    else if (LOOKUPS.includes(k) && typeof v === 'object') base[k] = ref(v) || undefined
  }
  for (const [k, v] of Object.entries(edits)) {
    if (v === undefined) continue
    if (v === '' || v === null) delete base[k]
    else base[k] = v
  }
  return base
}

export const newActivityId = () => `ACT-${Date.now()}-${Math.floor(Math.random() * 1e4).toString().padStart(4, '0')}`

export interface OrbitWrites {
  updatePoc: (p: Poc, edits: Fields) => Promise<void>
  /** The audit trail: one Activity row per event. */
  logActivity: (fields: Fields) => Promise<void>
}

export function useOrbitWrites(): OrbitWrites {
  const all = [OBJECTS.poc, OBJECTS.document, OBJECTS.feedback, OBJECTS.activity]
  const updatePocRec = useUpdateRecord<Row>(OBJECTS.poc, { refresh: all })
  const createActRec = useCreateRecord<Row>(OBJECTS.activity, { refresh: all })

  return {
    async updatePoc(p, edits) {
      await updatePocRec(p.id, merged(p._raw, edits))
    },
    async logActivity(fields) {
      await createActRec(clean({ activity_id: newActivityId(), created_at: Date.now(), ...fields }))
    },
  }
}
