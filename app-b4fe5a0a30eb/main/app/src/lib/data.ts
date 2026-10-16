import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getExecuteWorkflowNodeQueryKey,
  useExecuteWorkflowNode,
  useExecuteWorkflowNodeMutation,
} from '@unifyapps/app-builder-sdk/hooks/workflow'

import {
  CREATE,
  DELETE,
  FETCH,
  UPDATE,
  andFilter,
  extractPage,
  extractRecord,
  pageInput,
  type LeafFilter,
} from '@/data/bindings'

export type BindingKind = 'seed' | 'storage' | 'callable'

export interface UseDataResult<T> {
  data: T | undefined
  loading: boolean
  error: unknown
  refetch: () => void
  total?: number
  hasMore?: boolean
}

const NOOP = () => {}

/** Config for `kind: 'storage'` — records read from a backend object. */
export interface StorageBinding {
  /** the entityType `create_object` returned, e.g. ENTITY.ticket */
  object: string
  /** filter leaves; [] or omitted means "no filter" */
  where?: LeafFilter[]
  /** one box over several fields: the backend ORs `ICONTAINS` across them, ANDed with `where` */
  search?: { fields: string[]; expression: string }
  sort?: Array<{ field: string; order: 'ASC' | 'DESC' }>
  limit?: number
  offset?: number
}

/** Inert stand-in for a non-storage read: `object: ''` leaves the query disabled. */
const NO_BINDING: StorageBinding = { object: '' }

// The one convention the generator calls. The binding lives INLINE in the call, and the
// call lives in a WRAPPER in `src/data/`, never in a component:
//
//   // src/data/products.ts
//   export const useProducts = () => useData('products', 'seed', [ ... ])
//   // src/data/tickets.ts
//   export const useTickets = () => useData('tickets', 'storage', { object: ENTITY.ticket })
//
// The Data panel shows each exported wrapper as one named function (`useTickets`), tied
// to its object. A `useData` call written straight into a component works, but surfaces
// only as an anonymous `useData('obj_…')` entry — so the `build` tool refuses any call
// outside `src/data/` and names each one to move. `id` is the stable key the property
// panel / extractor use to locate this binding. A component that reaches for
// `useExecuteWorkflowNode` itself works at run time and is INVISIBLE to the panel.
//
// For 'seed', the third argument IS the data — returned as-is, no fetch.
// For 'storage', the read executes the app's FETCH dataSource binding (see
// `@/data/bindings`, written by provision_data_sources). 'callable' is still a
// declaration only.
export function useData<T>(id: string, kind: 'seed', seed: T): UseDataResult<T>
export function useData<T>(
  id: string,
  kind: 'storage',
  config: StorageBinding,
): UseDataResult<T>
export function useData<T>(id: string, kind: BindingKind, config: unknown): UseDataResult<T>
export function useData<T>(
  _id: string,
  kind: BindingKind,
  config: unknown,
): UseDataResult<T> {
  // `useStorage` runs on EVERY path, not only 'storage'. The third overload takes a
  // `kind` that is not a literal, so a caller can vary it between renders — and a hook
  // behind `if (kind === 'storage')` would then change the hook count mid-component,
  // which is React #310 in the data layer itself. `NO_BINDING` leaves `enabled` false,
  // so the query is registered and never issued.
  const stored = useStorage<T>(kind === 'storage' ? (config as StorageBinding) : NO_BINDING)
  if (kind === 'seed') {
    return { data: config as T, loading: false, error: undefined, refetch: NOOP }
  }
  if (kind === 'storage') {
    return stored
  }
  return { data: undefined, loading: false, error: undefined, refetch: NOOP }
}

/**
 * A full page is not evidence of another page. The node sets `response.hasMore` from
 * "this page came back FULL", so an exactly-full LAST page claims a page that does not
 * exist — 120 records read 15 at a time answered `hasMore: true` at offset 105, and the
 * app paged into an empty one (TTS-2213). A stated `total` settles it; with none, keep
 * the server's answer, because stopping early would hide rows.
 *
 * `total` here is the one the RESPONSE stated, never `extractPage`'s — that substitutes
 * the page size when none came back, which on a single full page is indistinguishable
 * from a real total.
 */
function pageHasMore(
  rows: number,
  limit: number,
  offset: number,
  total: number | undefined,
  serverHasMore: boolean,
): boolean {
  if (rows < limit) return false
  if (total !== undefined) return offset + rows < total
  return serverHasMore
}

function useStorage<T>(config: StorageBinding): UseDataResult<T> {
  const enabled = Boolean(config?.object) && Boolean(FETCH.id)
  const inputs = useMemo(
    () => ({
      // the WHOLE stored set — a subset is refused as "forbidden datasource :
      // invalid input", even one made only of overridable fields
      ...FETCH.storedInputs,
      object_type: config?.object,
      triggerInputCondition: andFilter(config?.where ?? []),
      sortBy: config?.sort ?? [],
      page: pageInput(config?.limit ?? 200, config?.offset ?? 0),
      // templated, so it must be SENT on every call; `{}` is "no search"
      searchField:
        config?.search?.expression && config.search.fields.length > 0 ? config.search : {},
    }),
    [config?.object, config?.where, config?.search, config?.sort, config?.limit, config?.offset],
  )

  const query = useExecuteWorkflowNode(
    { id: FETCH.id, context: FETCH.context, inputs },
    { query: { enabled } },
  )

  const page = useMemo(() => {
    if (!query.data) return undefined
    try {
      return extractPage<T extends Array<infer E> ? E : never>(query.data)
    } catch (error) {
      return { error } as never
    }
  }, [query.data])

  // what the RESPONSE stated, or nothing — see `pageHasMore`
  const envelope = query.data as { response?: { total?: unknown } } | null | undefined
  const rawTotal = envelope?.response?.total
  const statedTotal = typeof rawTotal === 'number' ? rawTotal : undefined

  return {
    data: (page && 'records' in page ? page.records : undefined) as T | undefined,
    loading: query.isLoading ?? false,
    error: query.error ?? (page && 'error' in page ? page.error : undefined),
    refetch: query.refetch ?? NOOP,
    total: page && 'total' in page ? page.total : undefined,
    hasMore:
      page && 'records' in page
        ? pageHasMore(
            page.records.length,
            config?.limit ?? 200,
            config?.offset ?? 0,
            statedTotal,
            page.hasMore,
          )
        : undefined,
  }
}

// ─── Writes ──────────────────────────────────────────────────────────────────
// The write side of `useData`. Every create/update/delete goes through these so the
// execute-node ENVELOPE is owned here, exactly as `useData` owns it for reads — that
// symmetry is the whole point. The envelope's top-level `id` is the dataSource (node)
// id, NOT the row. Nor do the three writes agree on where the row IS: a create returns it
// bare at `response`, an update nests it at `response.object` beside a `success` flag, and
// a delete returns none — see `extractRecord` in `@/data/bindings`, which is the one place
// that knows all four shapes. A component that calls `useExecuteWorkflowNodeMutation`
// itself and reads `.id` gets the node id and, used as a `recordId`, the update fails with
// "Entity … does not exist". Returning `extractRecord(envelope)` here makes both mistakes
// unreachable from app code.

const ENDPOINT = getExecuteWorkflowNodeQueryKey()[0]

export interface WriteOptions {
  // Objects OTHER than the one being written that a screen derives from it — an audit
  // row, a rollup, a count. The written object always refreshes; name the extras here.
  refresh?: string[]
}

/**
 * Re-read every list and detail of the named objects. Built into the write hooks below,
 * so a save refreshes what it changed on its own. A read and a write are the same POST to
 * the same endpoint, filed by React Query as unrelated cache entries — without this the
 * saved record stays off-screen until a reload, the most common defect in a backend app.
 */
export function useRefresh() {
  const queryClient = useQueryClient()
  return (...objects: string[]) =>
    queryClient.invalidateQueries({
      predicate: (query) => {
        const request = query.queryKey[1] as { inputs?: { object_type?: string } } | undefined
        const object = request?.inputs?.object_type
        return query.queryKey[0] === ENDPOINT && object !== undefined && objects.includes(object)
      },
    })
}

/**
 * Create a record and get the NEW RECORD back — its real id at `response.id`, flattened.
 * Not the envelope's top-level id (that is the dataSource/node id). Refreshes `object`
 * (plus any `options.refresh`) so the new row appears without a reload.
 */
export function useCreateRecord<T>(object: string, options?: WriteOptions) {
  const refresh = useRefresh()
  const mutation = useExecuteWorkflowNodeMutation({
    mutation: { onSuccess: () => void refresh(object, ...(options?.refresh ?? [])) },
  })
  return async (payload: Record<string, unknown>): Promise<T | undefined> => {
    const envelope = await mutation.mutateAsync({
      data: {
        id: CREATE.id,
        context: CREATE.context,
        inputs: { ...CREATE.storedInputs, object_type: object, rawPayload: payload },
      },
    })
    return extractRecord<T>(envelope)
  }
}

/**
 * Update a record by id. The endpoint REPLACES the properties map, so `payload` is the
 * WHOLE record — build it with `toPayload(current)` from `@/data/bindings` spread plus
 * your edits. Returns the updated record — which the node nests under `object`, not bare
 * like a create; `extractRecord` unwraps it. Refreshes `object` (plus `options.refresh`).
 */
export function useUpdateRecord<T>(object: string, options?: WriteOptions) {
  const refresh = useRefresh()
  const mutation = useExecuteWorkflowNodeMutation({
    mutation: { onSuccess: () => void refresh(object, ...(options?.refresh ?? [])) },
  })
  return async (recordId: string, payload: Record<string, unknown>): Promise<T | undefined> => {
    const envelope = await mutation.mutateAsync({
      data: {
        id: UPDATE.id,
        context: UPDATE.context,
        inputs: { ...UPDATE.storedInputs, object_type: object, recordId, rawPayload: payload },
      },
    })
    return extractRecord<T>(envelope)
  }
}

/** Delete a record by id. Refreshes `object` (plus any `options.refresh`). */
export function useDeleteRecord(object: string, options?: WriteOptions) {
  const refresh = useRefresh()
  const mutation = useExecuteWorkflowNodeMutation({
    mutation: { onSuccess: () => void refresh(object, ...(options?.refresh ?? [])) },
  })
  return async (recordId: string): Promise<void> => {
    await mutation.mutateAsync({
      data: {
        id: DELETE.id,
        context: DELETE.context,
        inputs: { ...DELETE.storedInputs, object_type: object, entityId: recordId },
      },
    })
  }
}
