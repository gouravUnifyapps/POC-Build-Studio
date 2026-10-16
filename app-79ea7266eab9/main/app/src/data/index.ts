// Data layer — ALL data access lives in this folder. Components import from '@/data'
// and never call a data hook directly.
//
// APP CODE MUST NOT USE THE PLATFORM ENTITY API. Not `/api/entity`, not
// `/api/aggregation`, and NONE of the entity hooks — useSearchEntities,
// useFindEntityById, useCreateEntity, useUpdateEntity, useDeleteEntity from
// '@unifyapps/app-builder-sdk/hooks/object'. Those exist for the AGENT at BUILD TIME
// (its create_object / create_record / query_records tools go the same way), authorized
// as the person running the build. A deployed app calling them is unauthorized, and its
// requests are invisible to the platform as things this app does.
//
// Reads:  useData(id, 'storage', { object, where, sort, limit }) from '@/lib/data'.
//         It executes the app's FETCH dataSource binding for you — whole stored input
//         set, filter shape, paging, envelope. Call it ONLY inside a wrapper here
//         (`export function useTickets() { return useData('tickets', 'storage', …) }`):
//         the Data panel shows each exported wrapper as a named function. A useData
//         call inside a component shows only as an anonymous `useData('obj_…')`, and a
//         read that goes around useData entirely is invisible there.
// Writes: the shipped useCreateRecord / useUpdateRecord / useDeleteRecord hooks from
//         '@/lib/data' (re-exported below). Wrap them one-per-object here, same as reads.
//         They own the response envelope (a create hands back the row's real id at
//         response.id) and the cache refresh — never call useExecuteWorkflowNodeMutation
//         yourself for a storage write.
//
// The bindings are OBJECT-AGNOSTIC — the object is passed per call — so the five cover
// every object this app has. `provision_data_sources` mints them and writes their ids
// into ./bindings.ts; never type an id in by hand.
//
// One wrapper per object is defined HERE (useTickets, useUsers, … plus the mutation
// helpers). See the `object-data` skill.
//
// SEED rows — demo data the app ships with — go in ./seed.ts, which is a worked example to
// REPLACE with this app's own model. Copy its TYPES, not its domain: content fields are
// `string` and render AS-IS (a seed row stands in for what a backend would return, and the
// app does not translate data — seeded or fetched alike); ids/slugs/urls/codes are `string`;
// money and measurements are `number`s formatted at the edge. The one `TKey` in a data file
// is a closed-set token's UI LABEL (`STATUS_LABELS`-style lookup) — the token is data, the
// label a screen shows for it is frontend copy. It is not re-exported here on purpose —
// replacing the file must not mean editing this one.

export * from './bindings'
export {
  useData,
  useRefresh,
  useCreateRecord,
  useUpdateRecord,
  useDeleteRecord,
} from '@/lib/data'
export type { StorageBinding, UseDataResult, WriteOptions } from '@/lib/data'
