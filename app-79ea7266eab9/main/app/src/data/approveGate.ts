// The gate approval: the app's one change to a POC, made by the automation "POC Studio Live ·
// Approve gate" and never by a write of its own. The binding (the dataSource id and its
// context) is APPROVE_GATE in ./callables.ts, written by create_code_app_data_sources: it goes
// on the wire whole, with `parameters` replaced by the real values.
import { useExecuteWorkflowNodeMutation } from '@unifyapps/app-builder-sdk/hooks/workflow'
import { ENTITY, useRefresh } from '@/data'
import { APPROVE_GATE } from '@/data/callables'

// this app's own global page, the one the dataSource is anchored to
const PAGE_SLUG = `global-page-of-${import.meta.env.VITE_APPLICATION_ID}`

export interface ApproveGateInput {
  poc_id: string
  /** the manager approves in the app; the owner approves in Slack */
  role: 'manager' | 'owner'
  caller_email: string
  caller_name: string
  /** only the Slack listener sets it; the app leaves it empty */
  caller_slack_id: string
}

/** What the automation answers. A refused call is still an HTTP 200, so `status` decides. */
export interface ApproveGateResult {
  status: 'decided' | 'already_decided' | 'forbidden' | 'error'
  /** both approvals are in: the gate passed and the POC moved on */
  gate_passed: boolean
  /** steps after the saved approval that failed (the direct message, the cloud run) */
  warnings: string[]
  message: string
}

const STATUSES: ApproveGateResult['status'][] = ['decided', 'already_decided', 'forbidden', 'error']

/** The automation's answer is `data.response`, shaped as its result schema says. An answer
 *  with no status of its own is not one this app knows how to show, so it is thrown. */
function outcome(envelope: unknown): ApproveGateResult {
  const r = ((envelope as { response?: Record<string, unknown> } | null)?.response ?? {}) as Record<string, unknown>
  const status = STATUSES.find((s) => s === r.status)
  if (!status) throw new Error('The approval did not answer.')
  return {
    status,
    gate_passed: r.gate_passed === true,
    warnings: Array.isArray(r.warnings) ? r.warnings.filter((w): w is string => typeof w === 'string' && w.trim() !== '') : [],
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

export function useApproveGate() {
  const { mutateAsync } = useExecuteWorkflowNodeMutation()
  const refresh = useRefresh()

  /** Asks the automation to record one approval, then waits until the lists have read the
   *  POC, its documents and its history again. */
  return async function approveGate(input: ApproveGateInput): Promise<ApproveGateResult> {
    let result: ApproveGateResult
    try {
      const envelope = await mutateAsync({
        data: {
          id: APPROVE_GATE.id,
          context: APPROVE_GATE.context,
          inputs: {
            ...APPROVE_GATE.storedInputs,
            parameters: {
              __internals__: { m: 'BUILDER', s: PAGE_SLUG, c: 'PLATFORM', p: 'browser' },
              poc_id: input.poc_id,
              role: input.role,
              caller_email: input.caller_email,
              caller_name: input.caller_name,
              caller_slack_id: input.caller_slack_id,
            },
          },
        },
      })
      result = outcome(envelope)
    } catch (failure) {
      throw readable(failure)
    }
    // a decided or already-decided gate changed the row, its documents and its history
    if (result.status === 'decided' || result.status === 'already_decided') {
      await refresh(ENTITY.pslPoc, ENTITY.pslDocument, ENTITY.pslActivity)
    }
    return result
  }
}
