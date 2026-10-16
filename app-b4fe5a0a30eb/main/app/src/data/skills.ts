// Skills & Feedback data. Every field below is bound by name — no guessing.
//
//   obj_343xd  orbit_studio_skill              skill_key (pk), name, area, description, current_version,
//                                              current_content, updated_at (ms), updated_by
//   obj_p50bw  orbit_studio_skill_version      version_id, skill_key, version, content, change_summary,
//                                              change_type, approved_by, approved_at, incorporated_feedback_ids,
//                                              source_proposal, iterations_per_poc_before/after
//   obj_g8y4m  orbit_studio_skill_proposal     proposal_id, skill_key, from/to_version, current/proposed_content,
//                                              summary, linked_feedback_ids, iterations_saved_per_month, confidence,
//                                              affected_pocs, iterations_last_30d, pocs_last_30d,
//                                              expected_reduction_pct, rationale, risks, status, reviewer,
//                                              decision_note, release_note, decided_at, created_at, analysis_run_id
//   obj_w8ukz  orbit_studio_skill_admin        email, name
//   obj_8rauo  orbit_studio_skill_analysis_run run_id, run_at, status, feedback_total, feedback_new,
//                                              proposals_created, triggered_by, note
//   orbit_studio_iteration                     skill, created_at  (iterations caused, last 30 days)
//
// Reads go through the FETCH binding; every write goes through an automation.
import { useCallback, useMemo } from 'react'
import { useExecuteWorkflowNodeMutation } from '@unifyapps/app-builder-sdk/hooks/workflow'
import { ENTITY, useData, useRefresh } from '@/data'
import { DECIDE_SKILL_PROPOSAL, RESTORE_SKILL_VERSION, RUN_SKILL_ANALYSIS } from '@/data/callables'
import type {
  DecideSkillProposalInput,
  DecideSkillProposalOutput,
  RestoreSkillVersionOutput,
  RunSkillAnalysisOutput,
} from '@/data/automationTypes'

export const SKILL_OBJECTS = [ENTITY.skillObjW8ukz, ENTITY.skillObjP50bw, ENTITY.skillObjG8y4m, ENTITY.skillObj8rauo, ENTITY.skillObj343xd] as const
const OBJ = {
  skill: ENTITY.skillObj343xd,
  version: ENTITY.skillObjP50bw,
  proposal: ENTITY.skillObjG8y4m,
  admin: ENTITY.skillObjW8ukz,
  run: ENTITY.skillObj8rauo,
} as const

const READ_LIMIT = 500
const ITERATION_WINDOW_MS = 30 * 86_400_000
const PAGE_SLUG = `global-page-of-${import.meta.env.VITE_APPLICATION_ID}`
const INTERNALS = { m: 'BUILDER', s: PAGE_SLUG, c: 'PLATFORM', p: 'browser' }

type Row = Record<string, unknown> & { id: string; createdTime?: number; modifiedTime?: number }

function str(v: unknown): string {
  if (v === null || v === undefined || typeof v === 'object') return ''
  return String(v)
}
function num(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}
function time(v: unknown) {
  if (typeof v === 'number') return v
  const s = str(v)
  if (!s) return 0
  const n = Number(s)
  if (Number.isFinite(n)) return n
  const d = Date.parse(s)
  return Number.isFinite(d) ? d : 0
}
const csv = (v: unknown) => str(v).split(',').map((x) => x.trim()).filter(Boolean)

/* ---------- shapes ---------- */
export interface Skill {
  id: string
  key: string
  name: string
  area: string
  description: string
  version: number
  content: string
  updatedAt: number
  updatedBy: string
}
export interface SkillVersion {
  id: string
  versionId: string
  skillKey: string
  version: number
  content: string
  changeSummary: string
  changeType: string
  approvedBy: string
  approvedAt: number
  feedbackIds: string[]
}
export interface Proposal {
  id: string
  proposalId: string
  skillKey: string
  fromVersion: number
  toVersion: number
  currentContent: string
  proposedContent: string
  summary: string
  feedbackRefs: string[]
  iterationsSaved: number
  confidence: string
  rationale: string
  risks: string
  status: ProposalStatus | string
  reviewer: string
  decisionNote: string
  decidedAt: number
  createdAt: number
}
export interface AnalysisRun {
  id: string
  at: number
  status: string
  feedbackTotal: number
  feedbackNew: number
  proposalsCreated: number
}

export const AREAS = [
  'Demo Studio',
  'Nebula core',
  'Nebula apps',
  'Nebula automations',
  'Nebula AI agents and evaluation',
  'Nebula objects, APIs, connections',
  'Nebula governance',
  'UnifyApps builders',
  'Design',
  'Product management',
  'GTM and content',
  'Documents',
] as const

export type ProposalStatus = 'pending' | 'changes_requested' | 'approved' | 'rejected'
export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  pending: 'Pending',
  changes_requested: 'Changes requested',
  approved: 'Approved',
  rejected: 'Rejected',
}
export const proposalStatusLabel = (s: string) => PROPOSAL_STATUS_LABEL[s as ProposalStatus] ?? s
export const isPending = (s: string) => s === 'pending'

export const CHANGE_TYPE_LABEL: Record<string, string> = { initial: 'Initial', proposal: 'From proposal', restore: 'Restore' }
export const CONFIDENCE_LABEL: Record<string, string> = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' }

export const FB_SOURCES = ['self_llm', 'iteration', 'user', 'reviewer'] as const
export const FB_SOURCE_LABEL: Record<string, string> = { self_llm: 'Self (LLM)', iteration: 'Iteration', user: 'User', reviewer: 'Reviewer' }
export const fbSourceLabel = (s: string) => FB_SOURCE_LABEL[s] ?? (s || 'Unknown')

/** Feedback status groups for the inbox chips */
export type FbGroup = 'open' | 'in_proposal' | 'incorporated' | 'dismissed' | 'resolved'
export const FB_GROUPS: FbGroup[] = ['open', 'in_proposal', 'incorporated', 'dismissed', 'resolved']
export const FB_GROUP_LABEL: Record<FbGroup, string> = {
  open: 'Open',
  in_proposal: 'In proposal',
  incorporated: 'Incorporated',
  dismissed: 'Dismissed',
  resolved: 'Resolved',
}
export function fbGroupOf(status: string): FbGroup {
  if (status === 'in_proposal') return 'in_proposal'
  if (status === 'incorporated') return 'incorporated'
  if (status === 'dismissed' || status === 'not_incorporated') return 'dismissed'
  if (status === 'resolved') return 'resolved'
  return 'open'
}
export const isOpenFb = (status: string) => status === 'open' || status === 'in_review'

function read(id: string, object: string, sortField: string) {
  return { id, object, sort: [{ field: `properties.${sortField}`, order: 'DESC' as const }], limit: READ_LIMIT }
}

export function useSkillsData() {
  const s = useData<Row[]>('skills', 'storage', read('skills', OBJ.skill, 'updated_at'))
  const v = useData<Row[]>('skill-versions', 'storage', read('skill-versions', OBJ.version, 'approved_at'))
  const p = useData<Row[]>('skill-proposals', 'storage', read('skill-proposals', OBJ.proposal, 'created_at'))
  const r = useData<Row[]>('skill-analysis-runs', 'storage', { ...read('skill-analysis-runs', OBJ.run, 'run_at'), limit: 50 })
  const parts = [s, v, p, r]
  const loading = parts.some((x) => x.loading)
  const error = parts.find((x) => x.error)?.error
  const refetch = () => parts.forEach((x) => x.refetch())

  const model = useMemo(() => {
    const skills: Skill[] = (s.data ?? []).map((x) => ({
      id: x.id,
      key: str(x.skill_key),
      name: str(x.name) || str(x.skill_key),
      area: str(x.area),
      description: str(x.description),
      version: num(x.current_version) || 1,
      content: str(x.current_content),
      updatedAt: time(x.updated_at),
      updatedBy: str(x.updated_by),
    }))
    const versions: SkillVersion[] = (v.data ?? []).map((x) => ({
      id: x.id,
      versionId: str(x.version_id),
      skillKey: str(x.skill_key),
      version: num(x.version),
      content: str(x.content),
      changeSummary: str(x.change_summary),
      changeType: str(x.change_type),
      approvedBy: str(x.approved_by),
      approvedAt: time(x.approved_at) || time(x.createdTime),
      feedbackIds: csv(x.incorporated_feedback_ids),
    }))
    const proposals: Proposal[] = (p.data ?? []).map((x) => ({
      id: x.id,
      proposalId: str(x.proposal_id) || x.id,
      skillKey: str(x.skill_key),
      fromVersion: num(x.from_version),
      toVersion: num(x.to_version),
      currentContent: str(x.current_content),
      proposedContent: str(x.proposed_content),
      summary: str(x.summary),
      feedbackRefs: csv(x.linked_feedback_ids),
      iterationsSaved: num(x.iterations_saved_per_month),
      confidence: str(x.confidence),
      rationale: str(x.rationale),
      risks: str(x.risks),
      status: str(x.status),
      reviewer: str(x.reviewer),
      decisionNote: str(x.decision_note),
      decidedAt: time(x.decided_at),
      createdAt: time(x.created_at) || time(x.createdTime),
    }))
    const runs: AnalysisRun[] = (r.data ?? [])
      .map((x) => ({
        id: x.id,
        at: time(x.run_at) || time(x.createdTime),
        status: str(x.status),
        feedbackTotal: num(x.feedback_total),
        feedbackNew: num(x.feedback_new),
        proposalsCreated: num(x.proposals_created),
      }))
      .sort((a, b) => b.at - a.at)
    return { skills, versions, proposals, runs }
  }, [s.data, v.data, p.data, r.data])

  return { ...model, loading, error, refetch }
}

/** The signed-in user is an admin when their email is in orbit_studio_skill_admin. */
export function useIsSkillAdmin(email: string) {
  const { data, loading } = useData<Row[]>('skill-admins', 'storage', { object: OBJ.admin, limit: READ_LIMIT })
  const me = email.trim().toLowerCase()
  const isAdmin = Boolean(me) && (data ?? []).some((a) => str(a.email).trim().toLowerCase() === me)
  return { isAdmin, loading }
}

/** Iterations caused per skill key in the last 30 days. */
export function useSkillIterations30d() {
  const since = useMemo(() => Date.now() - ITERATION_WINDOW_MS, [])
  const { data, loading } = useData<Row[]>('skill-iterations-30d', 'storage', {
    object: ENTITY.orbitIteration,
    where: [{ property: 'properties.created_at', filter: { operator: 'GTE', value: since } }],
    limit: 1000,
  })
  const byKey = useMemo(() => {
    const m = new Map<string, number>()
    for (const it of data ?? []) {
      const k = str(it.skill)
      if (k) m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }, [data])
  return { byKey, loading }
}

/* ---------- automations ---------- */
export function failureMessage(failure: unknown, fallback: string): string {
  const payload = (failure as { payload?: { message?: string; errorMessage?: string } } | null)?.payload
  if (payload) return payload.message || payload.errorMessage || fallback
  if (failure instanceof Error && failure.message && !failure.message.startsWith('[UAFetchError]')) return failure.message
  return fallback
}

function useRefreshSkills() {
  const refresh = useRefresh()
  return () => refresh(...SKILL_OBJECTS, ENTITY.orbitFeedback)
}

export function useRunSkillAnalysis() {
  const { mutateAsync, isPending } = useExecuteWorkflowNodeMutation()
  const refresh = useRefreshSkills()
  const run = useCallback(async () => {
    const envelope = await mutateAsync({
      data: {
        context: RUN_SKILL_ANALYSIS.context,
        id: RUN_SKILL_ANALYSIS.id,
        inputs: { ...RUN_SKILL_ANALYSIS.storedInputs, parameters: { __internals__: INTERNALS } },
        options: {},
      },
    })
    const result = ((envelope as { response?: unknown } | null)?.response ?? {}) as RunSkillAnalysisOutput
    if (result.success === false) throw new Error(result.message || 'The analysis could not run.')
    refresh()
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutateAsync])
  return { run, isPending }
}

export function useDecideProposal() {
  const { mutateAsync, isPending } = useExecuteWorkflowNodeMutation()
  const refresh = useRefreshSkills()
  const decide = useCallback(
    async (input: DecideSkillProposalInput) => {
      const parameters: DecideSkillProposalInput & { __internals__: typeof INTERNALS } = {
        __internals__: INTERNALS,
        proposal_id: input.proposal_id,
        decision: input.decision,
        ...(input.note ? { note: input.note } : {}),
        ...(input.edited_content !== undefined ? { edited_content: input.edited_content } : {}),
      }
      const envelope = await mutateAsync({
        data: {
          context: DECIDE_SKILL_PROPOSAL.context,
          id: DECIDE_SKILL_PROPOSAL.id,
          inputs: { ...DECIDE_SKILL_PROPOSAL.storedInputs, parameters },
          options: {},
        },
      })
      const result = ((envelope as { response?: unknown } | null)?.response ?? {}) as DecideSkillProposalOutput
      if (result.success === false) throw new Error(result.message || 'The decision could not be saved.')
      refresh()
      return result
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutateAsync],
  )
  return { decide, isPending }
}

export function useRestoreSkillVersion() {
  const { mutateAsync, isPending } = useExecuteWorkflowNodeMutation()
  const refresh = useRefreshSkills()
  const restore = useCallback(
    async (skillKey: string, version: number) => {
      const envelope = await mutateAsync({
        data: {
          context: RESTORE_SKILL_VERSION.context,
          id: RESTORE_SKILL_VERSION.id,
          inputs: { ...RESTORE_SKILL_VERSION.storedInputs, parameters: { __internals__: INTERNALS, skill_key: skillKey, version } },
          options: {},
        },
      })
      const result = ((envelope as { response?: unknown } | null)?.response ?? {}) as RestoreSkillVersionOutput
      if (result.success === false) throw new Error(result.message || 'The version could not be restored.')
      refresh()
      return result
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutateAsync],
  )
  return { restore, isPending }
}
