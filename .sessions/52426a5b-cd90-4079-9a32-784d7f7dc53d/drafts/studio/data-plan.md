# Data plan — UnifyApps POC Studio Live (internal tool)

## Summary
- Given: nothing. `studio/data/` does not exist and the request, profile and context notes name no file, link, screenshot or described schema for rows. The only given things are shapes: the five live Orbit objects (SOURCE, read-only) and the cloned UI's code (`source-ui.md` §3, §4, and the checkout's `model.ts`, `loop.ts`, `actions.ts`, `orbit.ts`). Every row is assumed (fictional) except the two words the request supplies (the prospect "Pentland" and the use case "Pentland Vulnerability Use Case") and one identity the rulings supply: on the story row only (and its child rows), the owner and the manager are the presenter, Gourav Mahunta (`seed.identity`, rulings.md §5). Every other person is invented.
- Seven new Storage objects, each shaped like its Orbit twin (same field names, same enum codes, same foreign keys, `psl_` prefix) plus only what the request needs and Orbit lacks. 54 seed rows in all, the largest object 15 rows (psl_activity), the largest single value a 6.8 KB PRD (HTML with an inline SVG flowchart). All of it goes in as named rows from files (the fde-agent, up to 20 per object, no automation).
- After the demo starts, almost every new row is live: the bot, the Slack poller, the cloud run's report-back and the app's own Approve write them. Seeds exist so every phase, gate and status shows on first open.

## Entities
| Entity | Source | Rows | Lives in | Gets in by | Masking | Story row |
|---|---|---|---|---|---|---|
| psl_poc | assumed, shaped like `orbit_studio_poc` (14 rows there: not reused, not copied) | 11 seeded, then live | Storage object | seed from `psl_poc.json`; live: Create POC from tag, Note manager, Start build, Receive build result, the app's Approve | none, fictional | Pentland Vulnerability Use Case |
| psl_activity | assumed, shaped like `orbit_studio_activity` (71 rows there: not reused) | 15 seeded (8 Slack messages, 7 system rows), then live | Storage object | seed; live: Slack poller, automations, the app's Approve | none | 6 Slack messages + gate rows |
| psl_document | assumed, shaped like `orbit_studio_document` | 6 seeded, then live | Storage object | seed with the HTML/markdown inline in the row; live: cloud run report-back, poller (files) | none | PRD v3 (HTML) + mockup v2 (HTML) + brief + 2 inputs |
| psl_feedback | assumed, shaped like `orbit_studio_feedback` | 10 seeded (3 incorporated, 7 open), then live | Storage object | seed; live: Receive build result (person or judge feedback from the Claude session) | none (FB-10 names the presenter) | FB-8, FB-10 |
| psl_iteration | assumed, shaped like `orbit_studio_iteration` (44 rows there: not reused) | 7 seeded, then live | Storage object | seed; live: Receive build result | none (the story row's manager loop names the presenter) | 2 Plan loops (Judge, the manager = presenter) |
| psl_skill | assumed (no Orbit twin; `skill` strings in Orbit are slugs) | 3 | Storage object | seed; changed only by Approve skill suggestion | none | PRD writer v3 |
| psl_skill_suggestion | assumed (no Orbit twin) | 2 seeded (both Approved), then live | Storage object | seed; live: Suggest skill improvements | none | — |

Budget: 7 objects, as the profile allows. `psl_channel` is NOT an object (see Disagreements).

## Where the data lives (the sentences the presenter will be asked to say)
- "Every POC, its history, its documents and its feedback are records in UnifyApps Storage. Slack is where the team talks: a poller copies each message that names a use case into History, with the sender's name and picture, so the app shows who said what without Slack open. The cloud build is where the work happens; it reports back and its PRD and mockups are saved as documents."
- "The skills' real prompts live in the Claude plugin. The three prompts in the app are stand-ins; the app's job is the version history and the improvement suggestions."
- Nothing is copied from the team's live Orbit objects: they hold real prospects and staff.

## Client's systems of record (the team's, today)
- Slack workspace (prospect-facing channels, the bot) · holds the conversation, files, sender profile pictures, channel membership · reached by the tenant's Slack connection (poller and listener; the connection is a manual stop for the person) · live rows copy: text, sender name, avatar URL, Slack ts (dedupe key), permalink.
- Claude Code cloud session (the /build run) · holds the build, its PRD, mockups, built assets · reached by the routine's API trigger (manual stop) and a callable API for the report-back · copy: `build_run_id` on the POC, documents returned by the run.
- `orbit_studio_*` objects on this tenant (what the POC Studio Claude plugin writes through the five "Orbit Studio API" automations today) · holds 14 POCs, 71 activity rows, 44 iteration rows (counts read; documents and feedback not counted) · NOT reached by the new app, not reused, not copied.
- The plugin's skill files · hold the real skill prompts · not reached; `psl_skill` holds invented stand-ins.

## Disagreements and one flag for the coordinator
1. **Agree: `psl_channel` becomes fields on `psl_poc`.** Three consequences. (a) The Slack cursor lives on each POC row (`slack_last_ts`), so a channel with two use cases has it twice: the poller reads the channel's smallest cursor and writes the same value to every live row of that channel. (b) A channel exists in the data only once a use case is tagged in it; a bot added to a channel with no tag writes nothing (it can reply "tag me with the use case name"). (c) The poller reads the distinct `slack_channel_id` of rows where `slack_live = true`; all 11 seeds are `false`, so it never reads a seed channel.
2. **Partial disagreement: mirror every field the UI reads or writes and every field the request needs, but leave out fields no screen reads.** `psl_poc` omits 7 of Orbit's 42 (`tier`, a required enum nothing reads and the bot would have to invent; `approvers`, `demo_date`, `watch_email`, `documents_count`, `open_feedback_count`, `tenant_host`). `psl_document` omits `path_in_build_session`, `size_bytes`, `file`. `psl_feedback` omits `channel_ref`, `parent_ticket`, `given_by_email`, `related_document`. `psl_activity` omits `note`, `related_ticket`. Checked by grep: the checkout reads none of these (`model.ts`, `orbit.ts`, every view). Putting the omitted ones back is a pure addition and nothing in the seeds depends on them. **Outcome:** the Stand-in agreed (objects.unread_fields) and the Judge dropped two more, `psl_feedback.category` and `psl_feedback.channel` (rulings.md §5), so the seeds carry neither; the loop's number is added as `psl_feedback.iteration`.
3. **Flag: a freshly tagged POC does not read "Waiting on you" in the source UI.** There "Waiting on you" exists only for the signed-in manager of a POC whose gate is open (`mustApprove`); a new bot-created row (stage `0_kickoff`, `current_gate none`, status `running`) reads "Building". **Outcome:** the Stand-in added one derived UI rule (`ui.created_state`): `running` + `0_kickoff` + empty `build_run_id` reads "Waiting on you" to its owner. Its data consequence is in the seeds: Northgate Onboarding (`0_kickoff`) has a `build_run_id`, so it still reads Building; every other seed leaves `build_run_id` out (which also keeps an Approve click on a seeded row from firing a cloud run).

## Field maps (Orbit field mirrored, or "new")
Conventions from the UI that the data must keep: every date is epoch milliseconds; `poc` on child rows holds the parent's `poc_id` string; an enum or lookup refuses `""`/null, so empty values are omitted in every seed and every automation write; an update replaces the whole record (so new fields must be in the schema before the app first updates a row); `additionalProperties` is false.

### psl_poc (pk `poc_id`, name field `client_name`, index on `status`) — 35 mirrored + 7 new
| psl field | mirrors `orbit_studio_poc` | Notes |
|---|---|---|
| poc_id | poc_id | seeds and live: `POC-<client_slug>-<use-case-slug>-<yyyymmdd>` (Orbit's pattern has no use case, so two use cases of one client on one day would collide) |
| client_name, client_slug, use_case | same | `use_case` holds the full name the bot receives ("Pentland Vulnerability Use Case"); the UI prints "{client} . {use_case}", so it reads "Pentland . Pentland Vulnerability Use Case" unless the Coder strips the client from the title |
| brief | brief | optional |
| owner_name, owner_email, started_by, started_at | same | `started_by` = tagger |
| manager_name, manager_email | same | optional until the manager is noted |
| stage | stage | the 9 Orbit codes `0_kickoff` … `8_demo_ready` (phase = understand 0-2, plan 3-4, build 5-6, deliver 7-8) |
| current_gate | current_gate | `none` g1 g2 g3 g4. `none` while building; `gN` only while gate N waits (g4 = Deliver in progress, never shown as open) |
| g1_status … g4_status | same | pending waiting approved changes_requested |
| g1_owner_approved … g4_owner_approved, g1_manager_approved … g4_manager_approved | same | owner approves in Slack, manager in the app; gate passes when both are true |
| status | status | `running` `waiting` `blocked` `stopped` `demo_ready` (not the 5 names of the earlier brief: Building = running with no open gate; the waiting labels are derived) |
| blocked_on, slack_channel, last_activity, last_activity_at | same | `slack_channel` = channel name, no "#" in seeds (the UI prints it raw in "Suggestions go in {slack_channel}"; the Coder decides whether to prefix "#") |
| gate_summary, g1_summary … g4_summary | same | text for the open gate / what each phase produced |
| slack_channel_id | new | Slack channel id (Orbit holds the name only); seeds `C0SEED0001`…`C0SEED0010` |
| owner_slack_id, manager_slack_id | new | Slack user ids (seeds `U0SEED0001`…`U0SEED0009`); needed for the owner's "Manager approved, continue" message and thread replies |
| build_run_id | new | the cloud session URL; omitted until Start build. Seeds: only Northgate Onboarding has one (`https://claude.invalid/code/session_northgate`, opens nothing), so the "ready to build" rule keeps it at Building |
| slack_live | new | boolean; true only for a channel the bot is really in; the poller reads only these |
| slack_last_ts | new | Slack ts of the newest message read; the poller's cursor |
| bot_thread_ts | new | ts of the bot's "who is the manager?" thread while the manager is missing; cleared when noted |

### psl_activity (pk `activity_id`, name field `message`, index poc asc / created_at desc) — 13 mirrored + 3 new
| psl field | mirrors `orbit_studio_activity` | Notes |
|---|---|---|
| activity_id | activity_id | system rows keep `ACT-<epoch>-<n>`; Slack rows use `SLK-<channel id>-<slack ts>` so a second write of the same message is refused by the primary key (this is the dedupe; the UI never parses the id) |
| poc, type, stage, gate, decision, actor_type, actor_name, actor_email, message, related_document, posted_to, created_at | same | `type` is one of Orbit's 15 codes; Slack messages are `input_added` (new info, announcements, status updates) or `document_saved` (a file); `stage` is free text (seeds use the stage code) |
| actor_avatar_url | new | Slack `image_72`; empty in seeds (the UI shows initials); live rows carry the URL |
| slack_ts | new | Slack message ts |
| slack_ref | new (name borrowed from `orbit_studio_iteration.slack_ref`) | Slack permalink |

### psl_document (pk `document_id`, name field `name`, index `poc`) — 14 mirrored, 0 new
Fields: document_id (`<poc_id>__<stage>__<name-slug>__v<n>`), poc, name, type (the 20 Orbit codes), stage (9 codes), gate_pack, version, status (draft in_review approved final superseded), summary, content, file_link, created_by, saved_at, format (markdown html link). No field was added: "logged at approval" is the UI's rule (a done phase lists its pack; the phase in session lists inputs only).

### psl_feedback (pk `ticket_no`, name field `title`) — 16 mirrored, 1 new
Fields: ticket_no (`FB-<n>`), poc, client_name, poc_stage, gate, quote, title, feedback, severity, target_skill, status (open in_review resolved not_incorporated), action_taken, reviewed_by, given_by_name, created_at, resolved_at, plus new `iteration` (optional integer: the loop's number within its POC; from the request's "POC name, iteration, stage, feedback text"). `category` and `channel` are NOT in the object (dropped by the Judge). This is the Feedback board: tickets that ask a skill to change, grouped by `target_skill`.

### psl_iteration (pk `iteration_id`, name field `title`) — 13 mirrored, 0 new
Fields: iteration_id (`ITR-<epoch>-<n>`), poc, phase (understand plan build deliver), source (nebula judge person), actor_name, actor_email, title, reason, skill, related_document, related_ticket, slack_ref, created_at. This is the request's "feedback object: POC, iteration, stage, feedback text": one row per gate loop, human or judge; the journey's "N iterations" chip and panel read it. A loop that asks for a skill change also has a `psl_feedback` ticket and points at it with `related_ticket`; `skill` holds the skill slug.

### psl_skill (pk `skill_id`) — new
`skill_id` (slug, the value `skill` / `target_skill` carry), `name`, `current_version` (integer), `prompt` (long text).

### psl_skill_suggestion (pk `suggestion_id`) — new
`suggestion_id`, `skill` (slug), `from_version`, `to_version`, `summary`, `proposed_prompt` (long text), `evidence_count`, `evidence_tickets` (comma-separated `ticket_no`), `status` (`pending` or `approved` only; `rejected` is dropped, no beat or button uses it), `created_at`, `approved_by`, `approved_at`. A suggestion is built from the skill's open `psl_feedback` tickets created after its last `approved_at`; Approve sets the skill's `current_version` and `prompt`, and marks those tickets `resolved` with `action_taken`.

## Seed rows
All seed files are in `$STUDIO/data/seed/` (JSON per object, empty values already left out, `count` and `primary_key` in each). Load order, because children point at parents: `psl_skill`, `psl_poc`, `psl_document`, `psl_feedback`, `psl_iteration`, `psl_activity`, `psl_skill_suggestion`.

### psl_poc (11) — every phase, all 9 stage codes, every gate state and every status
| poc_id | use_case | channel (id) | owner / manager | stage (phase) | current_gate | g1/g2/g3/g4 status | owner appr. g1-g4 | mgr appr. g1-g4 | status | shows as | blocked_on | last_activity_at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| POC-pentland-vulnerability-20261001 | Pentland Vulnerability Use Case | pentland-poc (C0SEED0001) | Gourav Mahunta / Gourav Mahunta (presenter) | 4_design_system (Plan) | g2 | appr/wait/pend/pend | YY-- | Y--- | waiting | Waiting on you (signed in as the presenter; "Waiting on manager" for anyone else) | | 2026-10-14 16:35 |
| POC-pentland-product-enrichment-20261008 | Pentland Product Enrichment Use Case | pentland-poc (C0SEED0001) | Diya Rao / Rahul Sen | 1_signal_capture (Understand) | none | pend x4 | ---- | ---- | running | Building | | 2026-10-13 14:05 |
| POC-harborline-claims-triage-20260921 | Harborline Claims Triage | harborline-poc (C0SEED0002) | Diya Rao / Anika Bose | 2_research_assess (Understand) | g1 | wait/pend/pend/pend | ---- | ---- | waiting | Waiting on owner and manager | | 2026-10-12 11:20 |
| POC-northgate-onboarding-20261009 | Northgate Onboarding | northgate-poc (C0SEED0003) | Kabir Shah / Rahul Sen | 0_kickoff (Understand) | none | pend x4 | ---- | ---- | running | Building | | 2026-10-13 09:10 |
| POC-alder-returns-20260902 | Alder Returns | alder-poc (C0SEED0004) | Kabir Shah / Anika Bose | 3_scope (Plan) | none | appr/pend/pend/pend | Y--- | Y--- | blocked | Blocked | Sample data not shared | 2026-10-05 17:45 |
| POC-tidewater-invoice-match-20260915 | Tidewater Invoice Match | tidewater-poc (C0SEED0005) | Ishita Verma / Priya Nair | 4_design_system (Plan) | none | appr/pend/pend/pend | Y--- | Y--- | running | Building | | 2026-10-13 18:00 |
| POC-kestrel-fraud-alerts-20260826 | Kestrel Fraud Alerts | kestrel-poc (C0SEED0006) | Ishita Verma / Rahul Sen | 6_finalize (Build) | g3 | appr/appr/wait/pend | YY-- | YYY- | waiting | Waiting on owner | | 2026-10-13 09:20 |
| POC-marlow-policy-q-a-20260829 | Marlow Policy Q&A | marlow-poc (C0SEED0007) | Neel Joshi / Anika Bose | 5_build (Build) | none | appr/appr/pend/pend | YY-- | YY-- | blocked | Blocked | VPN access pending | 2026-10-07 10:30 |
| POC-orchard-contract-review-20260903 | Orchard Contract Review | orchard-poc (C0SEED0008) | Neel Joshi / Priya Nair | 5_build (Build) | none | appr/appr/pend/pend | YY-- | YY-- | running | Building | | 2026-10-13 13:40 |
| POC-sable-supplier-onboarding-20260817 | Sable Supplier Onboarding | sable-poc (C0SEED0009) | Sana Qureshi / Anika Bose | 7_collaterals (Deliver) | g4 | appr/appr/appr/pend | YYY- | YYY- | running | Building (Deliver) | | 2026-10-10 15:00 |
| POC-quill-helpdesk-20260805 | Quill Helpdesk | quill-poc (C0SEED0010) | Sana Qureshi / Rahul Sen | 8_demo_ready (Deliver) | none | appr x4 | YYY- | YYY- | demo_ready | Demo-ready | | 2026-09-30 12:00 |

Northgate Onboarding is the only seed with a `build_run_id` (a `claude.invalid` URL). Totals: Building 5, Waiting 3 (three different labels), Blocked 2 (the two blockers), Demo-ready 1; Understand 3, Plan 3, Build 3, Deliver 2. Prospects other than Pentland (Harborline, Northgate, Alder, Tidewater, Kestrel, Marlow, Orchard, Sable, Quill) are invented; started dates are 2026-08-05 to 2026-10-09 (inside the last 90 days). Every open gate has a `gate_posted` activity row (the UI measures "Waiting at a gate" and "Longest" from it): story g2, Harborline g1, Kestrel g3.

### Story row
"Pentland Vulnerability Use Case", prospect Pentland, channel `pentland-poc` / `C0SEED0001` (shared with the second Pentland row), owner AND manager are the presenter, Gourav Mahunta (`gourav.mahunta@unifyapps.com`, Slack id `U09EK0B6NKD`, both given in the coordinator's message and rulings.md `seed.identity`; the presenter says once "for the demo I am owner and manager"). Stage `4_design_system`, `current_gate g2`: Understand approved on 2026-10-06; Plan waiting, owner approved in Slack, manager not yet, so the signed-in presenter sees "Waiting on you" and Approve. Plan carries 2 iterations (Judge: "Flowchart skips the scan approval step", the manager: "Mockup has no owner view"), so the chip reads "2 iterations". Its PRD v3 and mockup v2 are `in_review`, `gate_pack g2`. 6 Slack messages in History: 5 from the presenter (kickoff, asset sample, scope announcement, two status updates) and 1 from the invented prospect contact Marcus Hale, dated 2026-10-02 to 2026-10-14. Every child value that named Aarav Mehta or Priya Nair on this row (activity actors, the Plan manager loop, FB-10, document `created_by`, the PRD and brief text) now says Gourav Mahunta. No other POC's people changed (the Product Enrichment row stays Diya Rao / Rahul Sen).

### psl_activity (15): 8 Slack messages (6 story, 2 Product Enrichment) + 7 system rows
Story: kickoff (10-02), prospect's new info (10-03), asset sample shared as `document_saved` (10-03), scope announcement (10-06), `gate_posted g1` (10-06), `gate_decided g1` by the presenter (10-06), status update (10-07), `gate_posted g2` (10-14), status update PRD v3 (10-14), `owner_approved g2` (10-14). Product Enrichment: kickoff (10-08), prospect's attribute list v2 as `document_saved` (10-13). Others: Harborline `gate_posted g1`, Kestrel `gate_posted g3` and `manager_approved g3`. Every `avatar_url` is empty; every `slack_ref` is on `slack.invalid`. The Product Enrichment and the Vulnerability messages each name their use case in full, so the poller's match-by-name rule has real examples to match.

### psl_document (6)
| document_id (short) | type | stage / gate_pack | format | status | v | bytes |
|---|---|---|---|---|---|---|
| …vulnerability…__2_research_assess__understand-brief__v1 | brief | 2_research_assess / g1 | markdown | approved | 1 | 629 |
| …vulnerability…__1_signal_capture__scope-call-notes__v1 | input | 1_signal_capture / none | markdown | final | 1 | 322 |
| …vulnerability…__1_signal_capture__asset-inventory-sample-masked__v1 | input | 1_signal_capture / none | link | final | 1 | link only |
| …vulnerability…__4_design_system__prd-with-flowchart__v3 | brd | 4_design_system / g2 | html | in_review | 3 | 6,763 |
| …vulnerability…__4_design_system__remediation-queue-mockup__v2 | design | 4_design_system / g2 | html | in_review | 2 | 2,561 |
| …product-enrichment…__1_signal_capture__attribute-list__v2 | input | 1_signal_capture / none | link | final | 2 | link only |

The PRD is invented content with no script and no external file (inline CSS, inline SVG flowchart, a "What changed in v3" note that answers both Plan feedback rows, so the story reads consistently); a preview copy is `prd-pentland-vulnerability-v3.html`, the mockup `mockup-pentland-vulnerability-v2.html`. Links point at `files.invalid` and open nothing.

### psl_feedback (10) and psl_iteration (7)
| ticket_no | iteration | POC | skill | status | by | created | title |
|---|---|---|---|---|---|---|---|
| FB-1 | 1 | Quill | prd-writer | resolved ("Included in PRD writer v3") | Judge | 2026-08-20 | Goal has no number to measure |
| FB-2 | 1 | Sable | prd-writer | resolved (v3) | Judge | 2026-09-02 | Out-of-scope list is missing |
| FB-3 | 2 | Quill | mockup-drafter | resolved ("Included in Mockup drafter v2") | Judge | 2026-08-21 | Mockup shows one role only |
| FB-4 | 1 | Kestrel | prd-writer | open | Judge | 2026-10-03 | Flowchart skips the analyst approval step |
| FB-5 | 1 | Alder | prd-writer | open | Judge | 2026-10-04 | Success measure missing from the scope |
| FB-6 | 1 | Orchard | mockup-drafter | open | Priya Nair (invented) | 2026-10-05 | Mockup is desktop only and has no owner view |
| FB-7 | 1 | Tidewater | prd-writer | open | Priya Nair (invented) | 2026-10-06 | Flowchart does not show who approves exceptions |
| FB-8 | 1 | Pentland Vulnerability | prd-writer | open | Judge | 2026-10-08 | Flowchart skips the scan approval step |
| FB-9 | 2 | Tidewater | prd-writer | open | Judge | 2026-10-09 | Success measure missing from the scope |
| FB-10 | 2 | Pentland Vulnerability | mockup-drafter | open | Gourav Mahunta | 2026-10-11 | Mockup has no owner view |

The `iteration` column is the loop's number within its POC (Quill 1 and 2, Tidewater 1 and 2, Pentland Vulnerability 1 and 2, the rest 1). `category` and `channel` are not in the object. The 7 iteration rows are FB-4 to FB-10, one each (phase `plan`; sources Judge or Person; `related_ticket` set; the person ones carry a `slack_ref`). Tickets FB-1 to FB-3 are older and have no iteration row. Linked skills: prd-writer (5 open, 2 resolved), mockup-drafter (2 open, 1 resolved), build-report-writer none. Only the two Pentland loops belong to the story row, so its Plan counter reads 2; the other five loops show on their own POCs.

### psl_skill (3), psl_skill_suggestion (2)
Skills: PRD writer v3, Mockup drafter v2, Build report writer v1 (short invented prompts). Suggestions, both Approved, none pending: PRD writer v2 to v3 (evidence FB-1, FB-2; approved 2026-10-02 by Rahul Sen) and Mockup drafter v1 to v2 (evidence FB-3; approved 2026-09-25). Seed consequence worth knowing: one run of Suggest skill improvements on these seeds (threshold 3) writes one `pending` suggestion for PRD writer (5 open tickets since 2026-10-02) and none for Mockup drafter (2); the rehearsal does that once. There is no "Run now" button.

## How live rows get in, and where each lives (automation names as in rulings.md §2)
| Rows | Written by | Into | Notes |
|---|---|---|---|
| New POC | Save POC from Slack (the POC Studio Agent's tool, after the Slack listener hears the tag) | psl_poc | stage `0_kickoff`, `current_gate none`, g1-g4 `pending`, approvals false, status `running`, owner = tagger (name, email, Slack id from the Slack user lookup), `slack_channel_id` and `slack_channel`, `slack_live true`, `slack_last_ts` = now; `bot_thread_ts` set while the manager is missing; `client_name`/`client_slug` taken from an existing row of the same channel, else the first word of the typed name; `poc_id` = `POC-<client_slug>-<use-case-slug>-<yyyymmdd>` |
| Manager | Save POC from Slack (the thread reply) | psl_poc | manager name, email, Slack id; clears `bot_thread_ts` |
| Channel link | Slack listener on the bot's join event | psl_poc | for every row whose `slack_channel` equals the channel's name: sets `slack_channel_id`, `slack_live true`, `slack_last_ts` = now (this links both Pentland seed rows to the real channel; their seeded History keeps its `SLK-C0SEED0001-` keys) |
| Build started | Start build (the new Build button) | psl_poc, psl_activity | refuses when `build_run_id` is set; stores the session URL in `build_run_id`, status `running`, `last_activity` |
| Gate posted | Receive build result (callable API, called by the cloud run) | psl_poc, psl_document, psl_activity, psl_iteration, psl_feedback | sets `current_gate`, `gN_status waiting`, `gate_summary`, the phase's last stage; writes documents `in_review`, one `gate_posted` row, and any loop and ticket rows (a ticket and its loop are linked by `related_ticket`); when a run first reaches G2 it records G1 as passed by the Judge |
| Approval | Approve gate (the app's Approve button, and the Slack listener for the owner's reply) | psl_poc, psl_activity, psl_document | the source transitions; `manager_approved` or `gate_decided` row; the gate's `in_review` documents become `approved` when the gate passes; then the owner's DM; then, on a row with `build_run_id`, the second fire |
| History | Read channels into History (60 s, sequential) | psl_activity, psl_document | per distinct channel of rows with `slack_live true`, from the smallest `slack_last_ts` of that channel (written back to every live row of it): one row per message, key `SLK-<channel>-<ts>`, sender name + `image_72` + permalink from Slack lookups; matched to a use case by the full name in the text (a thread reply takes the root's use case); files become a `document_saved` row plus an `input` document |
| Skill suggestions | Suggest skill improvements (weekly; run once on the seeds in rehearsal) | psl_skill_suggestion | status `pending`; 3 or more open tickets for a skill since its last `approved_at` |
| Suggestion approved | Approve skill suggestion | psl_skill, psl_skill_suggestion, psl_feedback | version and prompt move; its tickets become `resolved` with `action_taken` |

## Before the call (the three steps that touch seeded rows)
1. Identity: done in the seeds. The story row's owner and manager are the presenter, so the signed-in presenter sees "Waiting on you", Approve and the bell with no update. If a real colleague will click Approve on the call, change that row's `manager_name`, `manager_email` and `manager_slack_id` to theirs (one update). The first-name fallback of the source matches too, so no other seeded person shares the presenter's first name.
2. Channel: the seed channel `C0SEED0001` is fake. The person creates a private channel named exactly `pentland-poc` (the `slack_channel` both Pentland rows carry) and invites the bot; the join event links both rows to the real id. If that name is taken, update `slack_channel` on the two rows first.
3. Live names: the use case created live in beat 2 is "Pentland MDM Use Case"; "Pentland PLM Use Case" is the rehearsal run's row (rulings.md `story.row`). Neither is seeded.

## Masking rules
Nothing was given, so there is no original to mask and no masked copy was written. The rules the data follows:
- No client, staff, channel, email or id from the Orbit rows (`scout.md` §1), the Slack-derived context notes or `source-ui.md` is copied. A scan of every seed value for the real names in those files (more than 20 tokens, including the real prospects and staff) found 0 hits.
- People are invented, with one exception: the presenter (Gourav Mahunta) on the story row and its children, per `seed.identity` and the coordinator's message. His email `gourav.mahunta@unifyapps.com` and Slack id `U09EK0B6NKD` appear on 4 rows only: the story POC, its two person-actor system activity rows and FB-10's loop. The Slack id is as given; it was not checked against Slack. Everything else uses `example.com` emails, `C0SEED####` / `U0SEED####` ids, `slack.invalid`, `files.invalid` and `claude.invalid` links, and empty avatars.
- Only the request's own words are real: "Pentland" and "Pentland Vulnerability Use Case". "Pentland Product Enrichment Use Case" is the real workstream name from the context notes, used because the moderator asked and the audience is internal. The PRD's facts about Pentland (three scanners, retail estate) are invented and the PRD says so.
- Dates are in the last 20 days for Pentland's History and in the last 90 days for the other POCs (today is 2026-10-16).

## Files
- `$STUDIO/data/seed/psl_skill.json` (3), `psl_poc.json` (11), `psl_document.json` (6), `psl_feedback.json` (10), `psl_iteration.json` (7), `psl_activity.json` (15), `psl_skill_suggestion.json` (2) · assumed · 54 rows in all, in load order · no masked copy (nothing given) · revalidated after the round-2 patches: enums are Orbit codes, every `poc` points at a seeded `poc_id`, ids unique, no empty value, dates are epoch ms integers
- `$STUDIO/data/seed/prd-pentland-vulnerability-v3.html`, `mockup-pentland-vulnerability-v2.html` · preview copies of the two HTML values inside `psl_document.json` (no script, no external file)

## Settled since the first draft (stand-in.md and rulings.md §5)
- Identity and channel: `seed.identity` (presenter as owner and manager, in the seeds), `slack.demo_channel` (`pentland-poc`, linked by the join event), `story.row` (live "Pentland MDM Use Case", rehearsal "Pentland PLM Use Case"), `data.client_name_rule` (existing row of the channel, else first word).
- UI and write path: `ui.created_state` (Northgate carries a `build_run_id`), `artifact.review_vs_logged` (a "To review" list; the seeds are `in_review`), `data.prd_doc_type` (`brd`, never `requirements`), `ui.history_render` (bubbles for rows with `slack_ts`), `approval.write_path` (Approve gate automation; no record trigger, so `psl_activity` needs no `supportsWebhook`).
- Feedback and skills: `feedback.capture` (written by the cloud run's report-back; no Send back form), `suggestion.threshold` 3 and `suggestion.evidence_window` (open tickets after the skill's newest `approved_at`; at the seeds PRD writer has 5 and Mockup drafter 2, so a run writes one suggestion, for PRD writer), `objects.unread_fields` (plus `category` and `channel` dropped), suggestion status `pending` | `approved` only.

## Open rows
- data.long_text_limit: the platform's limit for a long-text value is unknown; the PRD is 6.8 KB (6,763 bytes) · sent to the Scout by the Judge · candidates seed the PRD first as the test, then shrink both HTML values to the limit found, keeping the inline SVG flowchart / move the content behind `file_link` (last resort: the Reader then opens it in a new tab)

## Not given
- Any file, export or screenshot of Pentland's data or of the team's real POC list. The 11 POCs, 15 activity rows, 6 documents, 10 tickets, 7 loops, 3 skills and 2 suggestions are invented; the prospect names other than Pentland are fictional.
- Real Slack ids, channel names, users and profile pictures (live rows carry them; seeds do not, except the presenter's own id on the story row, which the coordinator supplied).
- A real PRD, mockup or build asset for any POC (the story row's two are written for this demo).
- The real skill prompts (they sit in the Claude plugin; not read).
- A Pentland vulnerability workstream: nothing in the Slack evidence mentions it; the use case is the request's word, and its content is assumed.
