// The one automation the app calls: "POC Studio Live · Start build". The binding (the
// dataSource id and its context) is START_BUILD in ./callables.ts, written by
// create_code_app_data_sources: it goes on the wire whole, with `parameters` replaced by the
// real values.
import { useExecuteWorkflowNodeMutation } from '@unifyapps/app-builder-sdk/hooks/workflow'
import { ENTITY, useRefresh } from '@/data'
import { START_BUILD } from '@/data/callables'

// this app's own global page, the one the dataSource is anchored to
const PAGE_SLUG = `global-page-of-${import.meta.env.VITE_APPLICATION_ID}`

export type StartBuildMode = 'plan' | 'build'

/** What the automation answers once a build was asked for. Any other answer is thrown. */
export interface StartBuildResult {
  status: 'started' | 'already_running'
  build_run_id: string
  message: string
}

/** The automation's answer is `data.response`. A refused call still comes back as HTTP 200,
 *  so its own `status` decides: `started` and `already_running` are answers, `not_found`,
 *  `error` and anything else are failures that carry its message. */
function outcome(envelope: unknown): StartBuildResult {
  const response = ((envelope as { response?: Record<string, unknown> } | null)?.response ?? {}) as Record<string, unknown>
  const status = typeof response.status === 'string' ? response.status : ''
  const message = typeof response.message === 'string' ? response.message : ''
  if (status === 'started' || status === 'already_running') {
    return { status, build_run_id: typeof response.build_run_id === 'string' ? response.build_run_id : '', message }
  }
  throw new Error(message || (status === 'not_found' ? 'This POC was not found.' : 'The build did not start.'))
}

/** A failed call rejects with the network layer's error, whose `.message` is a raw log line;
 *  the sentence for a person is on `.payload`. */
function readable(failure: unknown): Error {
  const payload = (failure as { payload?: { message?: string; errorMessage?: string } } | null)?.payload
  if (payload) return new Error(payload.message || payload.errorMessage || 'The build did not start.')
  return failure instanceof Error ? failure : new Error('The build did not start.')
}

export function useStartBuild() {
  const { mutateAsync } = useExecuteWorkflowNodeMutation()
  const refresh = useRefresh()

  /** Starts a build for one POC and waits until the lists have read the row again. */
  return async function startBuild(pocId: string, mode: StartBuildMode = 'plan'): Promise<StartBuildResult> {
    let result: StartBuildResult
    try {
      const envelope = await mutateAsync({
        data: {
          id: START_BUILD.id,
          context: START_BUILD.context,
          inputs: {
            ...START_BUILD.storedInputs,
            parameters: {
              __internals__: { m: 'BUILDER', s: PAGE_SLUG, c: 'PLATFORM', p: 'browser' },
              poc_id: pocId,
              mode,
            },
          },
        },
      })
      result = outcome(envelope)
    } catch (failure) {
      throw readable(failure)
    }
    // the automation writes the POC row and an activity row: read both again
    await refresh(ENTITY.pslPoc, ENTITY.pslActivity)
    return result
  }
}
