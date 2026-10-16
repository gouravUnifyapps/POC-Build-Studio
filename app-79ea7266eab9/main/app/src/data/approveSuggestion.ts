// The skill-suggestion approval: the app's one change to a skill, made by the automation "POC
// Studio Live · Approve skill suggestion" and never by a write of its own. The binding (the
// dataSource id and its context) is APPROVE_SKILL_SUGGESTION in ./callables.ts, written by
// create_code_app_data_sources: it goes on the wire whole, with `parameters` replaced by the
// real values.
import { useExecuteWorkflowNodeMutation } from '@unifyapps/app-builder-sdk/hooks/workflow'
import { ENTITY, useRefresh } from '@/data'
import { APPROVE_SKILL_SUGGESTION } from '@/data/callables'

// this app's own global page, the one the dataSource is anchored to
const PAGE_SLUG = `global-page-of-${import.meta.env.VITE_APPLICATION_ID}`

export interface ApproveSuggestionInput {
  suggestion_id: string
  caller_email: string
  caller_name: string
}

/** What the automation answers. A refused call is still an HTTP 200, so `status` decides. */
export interface ApproveSuggestionResult {
  status: 'approved' | 'already_decided' | 'forbidden' | 'not_found' | 'error'
  skill_id: string
  /** the version the skill runs now, when the approval went through */
  to_version: number
  message: string
}

const STATUSES: ApproveSuggestionResult['status'][] = ['approved', 'already_decided', 'forbidden', 'not_found', 'error']

/** The automation's answer is `data.response`, shaped as its result schema says. An answer
 *  with no status of its own is not one this app knows how to show, so it is thrown. */
function outcome(envelope: unknown): ApproveSuggestionResult {
  const r = ((envelope as { response?: Record<string, unknown> } | null)?.response ?? {}) as Record<string, unknown>
  const status = STATUSES.find((s) => s === r.status)
  if (!status) throw new Error('The approval did not answer.')
  const version = typeof r.to_version === 'number' ? r.to_version : Number(r.to_version)
  return {
    status,
    skill_id: typeof r.skill_id === 'string' ? r.skill_id : '',
    to_version: Number.isFinite(version) ? version : 0,
    message: typeof r.message === 'string' ? r.message : '',
  }
}

/** A failed call rejects with the network layer's error, whose `.message` is a raw log line;
 *  the sentence for a person is on `.payload`. */
function readable(failure: unknown): Error {
  const payload = (failure as { payload?: { message?: string; errorMessage?: string } } | null)?.payload
  if (payload) return new Error(payload.message || payload.errorMessage || 'The approval did not go through.')
  return failure instanceof Error ? failure : new Error('The approval did not go through.')
}

export function useApproveSuggestion() {
  const { mutateAsync } = useExecuteWorkflowNodeMutation()
  const refresh = useRefresh()

  /** The approval changes the suggestion, the skill and the tickets it resolves, so all three
   *  are read again. A call that failed may still have saved part of it, so they are read again
   *  then too; a failed read never replaces the answer being reported. */
  const readAgain = () => refresh(ENTITY.pslSkill, ENTITY.pslSkillSuggestion, ENTITY.pslFeedback).catch(() => undefined)

  /** Asks the automation to approve one suggestion, then waits until the lists have read the
   *  skill, its suggestions and the feedback again. */
  return async function approveSuggestion(input: ApproveSuggestionInput): Promise<ApproveSuggestionResult> {
    let result: ApproveSuggestionResult
    try {
      const envelope = await mutateAsync({
        data: {
          id: APPROVE_SKILL_SUGGESTION.id,
          context: APPROVE_SKILL_SUGGESTION.context,
          inputs: {
            ...APPROVE_SKILL_SUGGESTION.storedInputs,
            parameters: {
              __internals__: { m: 'BUILDER', s: PAGE_SLUG, c: 'PLATFORM', p: 'browser' },
              suggestion_id: input.suggestion_id,
              caller_email: input.caller_email,
              caller_name: input.caller_name,
            },
          },
        },
      })
      result = outcome(envelope)
    } catch (failure) {
      await readAgain()
      throw readable(failure)
    }
    await readAgain()
    return result
  }
}
