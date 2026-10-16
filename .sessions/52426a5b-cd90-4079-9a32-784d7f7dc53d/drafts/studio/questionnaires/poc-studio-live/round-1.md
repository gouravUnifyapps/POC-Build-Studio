# POC Studio Live — decisions, round 1 (Stand-in, Scout, Designer, moderator)

## Settled decisions

| Decision key | Source | Answer or evidence |
|---|---|---|
| demo.intent | PROFILE, REQUEST, SLACK | use-case: the flow is the product, no hood beats, nobody opens the automation canvas or the object schema in the 20 minutes |
| solution.target | REQUEST | POC Studio Live e_6ad1b45199f8a565171d7f1c; the source stays untouched (request: "clone this and build a new functional backend") |
| source.members | READ | 1 code app (app-b4fe5a0a30eb), 5 used objects orbit_studio_{poc,document,feedback,activity,iteration}, 4 unused poc_studio_* objects; no automation, agent or connection (get_solution) |
| screens.confirm | READ | `/` Home (stat tiles, filters, POC table), `/pocs/:pocId` (header, approval card, 4-phase journey with iteration chips, changes card, Artifacts and History tabs, reader drawer), `/feedback` (read-only, grouped by skill); only write is Approve; every record bound to the 5 objects; no mock data (source-ui.md §2, §4) |
| clone.route | NEBULA | No tool copies a code app. Read-only get_branch_codebase on the source, create_code_app, port src/orbit/** and src/data/orbit.ts (not the engine/template files), re-provision bindings.ts for the new objects (source-ui.md §7) |
| design.hue | READ | Green: the source app's own tokens are the forest green #4a7c30 / #29461b with the bronze #857242 accent, Spectral + IBM Plex Mono; hue 103, secondary 74 |
| design.clone_vs_system | REQUEST, PROFILE, READ | Keep the source's own stylesheet (`orbit/ds/bundle.css`, `tokens.css`, `orbit.css`, Spectral plus IBM Plex Mono, forest green #4a7c30 and bronze #857242, cream ground, gradient rail) as is; build every new region (Build button, review list, Slack bubbles, skill block) only from its kit classes and tokens; do NOT run the fresh transform over it |
| objects.ids | STAND-IN, SCOUT | Prefix `psl_`: `psl_poc`, `psl_document`, `psl_activity`, `psl_iteration`, `psl_feedback`, `psl_skill`, `psl_skill_suggestion`; display names "POC Studio Live . POC" etc. |
| objects.schema | READ, STAND-IN | Mirror the five Orbit objects field for field (same names, types, enum codes, required flags, pk, FK to `psl_poc`) minus the 16 unread fields data-plan.md omits, plus only the additions listed in "Schema" below; keep data-plan.md's field maps as the loader's truth |
| objects.count | PROFILE, REQUEST | 7: poc, document, activity, iteration, feedback, skill, skill_suggestion; no 8th (no channel, gate or seen-ts object) |
| objects.reuse | REQUEST, PROFILE | New `psl_` objects only; no Orbit object is read or written and none of the five "Orbit Studio API" automations is called |
| bot.name | REQUEST, SLACK | "POC Studio Agent": Slack display name `POC Studio Agent`, the UnifyApps agent also `POC Studio Agent`; the word "Demo Studio" appears nowhere in the product |
| slack.trigger_mode | STAND-IN, SCOUT, REQUEST | Event trigger (`slack_on_new_message`, webhook pasted into Event Subscriptions: message.channels, message.groups, member_joined_channel) for the tag, the manager reply, the owner's "approve" reply and bot-joined-channel, plus the 60 s poll for History. On join the listener reads the channel name and, for every row whose `slack_channel` equals it, sets `slack_channel_id`, `slack_live true` and `slack_last_ts` to now; a join that matches no row answers "Tag me with the use case name to start a POC". If Slack refuses the Request URL, the same new bot is polled and the tag is found by `<@bot>` (60 s delay) |
| poll.interval | STAND-IN, SCOUT | 60 s, `sequential: true`, one pass over the distinct `slack_channel_id` of rows with `slack_live = true`, from the smallest `slack_last_ts` of that channel, then the same value written back to every live row of the channel |
| history.dedupe | READ, STAND-IN | `activity_id` = `SLK-<channel_id>-<ts>` is the primary key, so a second write is refused (data-plan.md), plus the `slack_last_ts` cursor on the row; a Slack file adds a `document_saved` activity and a `psl_document` (type `input`, format `link`); skip the bot's own posts, join/leave subtypes and messages that tag the bot (those are commands); Slack text rows use the existing types `input_added` / `document_saved`, no new enum value |
| history.unnamed_message | STAND-IN | A reply inside a thread takes the thread root's use case; otherwise the use case most recently named in that channel; a channel with exactly one live use case takes everything; before any name appears in a multi-use-case channel the message is skipped |
| channel.rule | REQUEST | A poc row carries one slack_channel_id; a channel id may repeat across rows; the poller reads distinct live channel ids and routes a message by the use case it names |
| manager.identity | READ, SLACK, STAND-IN | Signed-in tenant email equals `manager_email` on the row (case-insensitive), full name as fallback; the first-name-only fallback of the source is dropped in the UI and the automation; the bot stores `manager_slack_id`, `manager_name`, `manager_email` from the thread tag (`users.info`, users:read.email); the Approve automation re-checks the same rule and answers `forbidden` otherwise |
| approval.notice_place | REQUEST, STAND-IN | The owner by direct message from the bot: "Manager approved, continue" plus the new session link when one exists; the PRD, the built assets and the "Build started" lines go to the row's channel; if the bot cannot open a DM, a thread reply under the PRD post that @-mentions the owner |
| artifact.review_vs_logged | READ, REQUEST | The run's report writes each artifact as `status in_review` with `gate_pack` = the open gate (as the seeds do, PRD v3 and mockup v2 at g2); the source rule already hides them (the phase in session lists inputs only); a new "To review" list on the approval card shows the open gate's `in_review` documents and opens the Reader; when the gate passes (both approvals) the automation sets them `approved` and the done phase lists them. No second link field, no new column |
| gate.names | READ, SLACK, STAND-IN | Keep the source's three gates: G1 Scope check (closes Understand), G2 Design check (closes Plan), G3 Build sign-off (closes Build); G4 stays unshown. The PRD with flowcharts and mockups is G2's pack, the built assets are G3's; the report-back takes a `gate` value, and when a run first reaches G2 the Understand gate G1 is recorded as passed by the Judge (`gate_decided`, actor_type ai, both approval flags true) |
| trigger.build | REQUEST, READ | A Build button in the POC page header, shown to the owner under the "ready to build" predicate (see `ui.created_state`), calls the "Start build" automation, which POSTs to the Claude Code routine fire URL (ENV id and token, `anthropic-beta` header as in claude.beta_header) with `text` = `/build <client> - <use case>` plus key: value lines (row_id, mode plan, slack_channel_id, report-back path), stores the session URL in `build_run_id`, sets stage `1_signal_capture` and status running, and posts "Build started" to the channel; it refuses with "A build is already running" when `build_run_id` is set |
| claude.beta_header | READ | POST https://api.anthropic.com/v1/claude_code/routines/<trigger id>/fire · headers `Authorization: Bearer <routine token>`, `anthropic-beta: experimental-cc-routine-2026-04-01`, `anthropic-version: 2023-06-01`, `Content-Type: application/json` · body `{"text": "<free text>"}` · answer `{type: routine_fire, claude_code_session_id, claude_code_session_url}`. The text reaches the routine wrapped in a `<routine-fire-payload>` block as untrusted data, so the routine's saved prompt must say to act on it. Limits: 30 fires per hour per routine. A routine needs at least one GitHub repository and the environment's network access must allow orbit.uat.unifyapps.com for the report-back call (code.claude.com/docs/en/routines, read by the moderator) |
| cloud.folder | REQUEST, SLACK | The routine's saved prompt says: create a fresh empty folder outside the attached repository (not a git repository), install Nebula first, run `/build` for the client and use case from the fire text, push built code to the named repository, call the report-back API at each gate; the environment's network allows `orbit.uat.unifyapps.com` |
| inbound.api_key | STAND-IN, SCOUT | A `callableApi` automation "Receive build result" behind API Group "POC Studio Live API", a new client and a new access profile limited to that group; the key is shown once, written to a private file in the working folder, never to chat or the runbook, and handed over inside the Claude credential stop to paste into the routine's secrets |
| build.continue_by | REQUEST, STAND-IN | When the gate passes (both approvals in) on a row that has a `build_run_id`, the Approve gate automation fires the routine again with `mode: build` and the approved PRD link, and the owner's DM carries that new session link; the manager's approval alone sends the DM and waits for the owner. A seeded row without `build_run_id` never launches a run |
| build.final_assets_logging | REQUEST, PROFILE | Same rule as the PRD: written when the run reports (`in_review`, `gate_pack g3`) and the links posted to the channel at once with "BUILD is complete" to the owner; listed in Build's pack when G3 Build sign-off passes |
| feedback.capture | REQUEST, READ | Rows written by the cloud run through the report-back API (human and judge feedback): one call writes a `psl_feedback` row, the `psl_iteration` row that draws the branch and counter (linked by `related_ticket`) and an `iteration_logged` activity; NO "Send back" form in the app |
| cut.skill-loop | REQUEST | Build it, last and thin: one scheduled automation with a Simple Call LLM node, the Feedback page extended with versions, the pending suggestion with its evidence and Approve, and the approve automation |
| suggestion.threshold | STAND-IN | 3 open feedback tickets for one skill since its last approved suggestion |
| suggestion.evidence_window | STAND-IN, READ | Tickets for that skill with status `open` and `created_at` after the newest `approved_at` of that skill's suggestions; on approval those tickets turn `resolved` with `action_taken` "Included in <skill name> v<n>"; the suggestion stores `evidence_count` and `evidence_tickets` (comma-separated) so the page lists the evidence without recomputing; a skill that already has a pending suggestion is skipped |
| skills.admin_role | STAND-IN | Any signed-in viewer whose email is `manager_email` on at least one `psl_poc` row; the Approve button on the Feedback page shows only to them and the automation answers `forbidden` to anyone else; no admin field, no role, no group |
| agent.model | STAND-IN, SCOUT | Claude Sonnet 4.6 (UnifyApps) `e_69b41a443d6f1815768c245f` for POC Studio Agent and for the skill rewrite (Simple Call LLM node, JSON output); no second "Skill Coach" agent |
| app.access | PROFILE, READ | PRIVATE; managers sign in with their tenant accounts; CSP allows `avatars.slack-edge.com`, `secure.gravatar.com` and the Spectral font host |
| innovate | REQUEST | Off: the request is a precise functional spec for an internal tool, not a pitch; ideas beyond it would be cut as "nothing beyond the beats" |
| ui.created_state | REQUEST, READ, STAND-IN | One derived rule in the status function: a row with status `running`, stage `0_kickoff` and empty `build_run_id` reads "Waiting on you" to its owner and "Waiting on {owner}" to everyone else; it counts in the Waiting-on-you filter and the rail badge, and it is the predicate that shows the Build button. Storyline beat 2 stays "Waiting on you"; after Build the row reads "Building . Understand" with the session link. The seeded Northgate row (stage `0_kickoff`) gets a `build_run_id` so it still reads Building |
| ui.history_render | REQUEST, READ | Change the History tab so a row that carries `slack_ts` renders as a chat bubble: round avatar (the `actor_avatar_url` image, initials when empty), sender name, the text in a bubble, the time under it linking to `slack_ref`; the day groups (Today, Yesterday, weekday) stay as the date dividers; all bubbles left-aligned; every other event kind keeps the source's compact line with its badge, shown as a centred notice |
| data.prd_doc_type | READ | The PRD is type `brd` and the mockups type `design`, both format `html`; never `requirements` |
| data.client_name_rule | STAND-IN | The agent takes `client_name` and `client_slug` from an existing row of the same channel when there is one (Pentland for the PLM row), else from the first word of the typed name, capitalised; it never asks in the thread (the only question is the manager); `use_case` keeps the full typed name |
| slack.demo_channel | STAND-IN, READ | A new private channel named exactly `pentland-poc` (the name both seeded Pentland rows already carry in `slack_channel`), created by the person, the bot invited; the join event then links both Pentland rows to its real id by name. If that name is taken, the person picks another and updates `slack_channel` on the two rows before inviting the bot |
| owner.approval | READ, REQUEST, STAND-IN | The owner approves in Slack by replying "approve" in the thread of the bot's gate post; the listener accepts it only from `owner_slack_id` and calls the same Approve gate automation with role owner |
| seed.volume | PROFILE | 11 `psl_poc` rows (every phase, stage code, gate state and status, data-plan.md) and 54 rows in all across the 7 objects; the live PLM row is the 12th |
| data.long_text_limit | NEBULA |  |

## Questions

### Q-demo-intent

- Decision key: `demo.intent`
- Type: `select`
- Source: PROFILE, REQUEST, SLACK
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: What is this build for: the use case working, the platform configuration, or both?
- Options: use-case · platform · both
- Recommended: use-case: the flow is the product, no hood beats, nobody opens the automation canvas or the object schema in the 20 minutes
- Answer: use-case: the flow is the product, no hood beats, nobody opens the automation canvas or the object schema in the 20 minutes
- Status: `answered`

### Q-solution-target

- Decision key: `solution.target`
- Type: `select`
- Source: REQUEST
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Which solution do the new entities go into?
- Options: POC Studio Live (new) · the source POC Studio
- Recommended: POC Studio Live e_6ad1b45199f8a565171d7f1c; the source stays untouched (request: "clone this and build a new functional backend")
- Answer: POC Studio Live e_6ad1b45199f8a565171d7f1c; the source stays untouched (request: "clone this and build a new functional backend")
- Status: `answered`

### Q-source-members

- Decision key: `source.members`
- Type: `text`
- Source: READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: What does the source solution hold?
- Options: Free text
- Recommended: 1 code app (app-b4fe5a0a30eb), 5 used objects orbit_studio_{poc,document,feedback,activity,iteration}, 4 unused poc_studio_* objects; no automation, agent or connection (get_solution)
- Answer: 1 code app (app-b4fe5a0a30eb), 5 used objects orbit_studio_{poc,document,feedback,activity,iteration}, 4 unused poc_studio_* objects; no automation, agent or connection (get_solution)
- Status: `answered`

### Q-screens-confirm

- Decision key: `screens.confirm`
- Type: `text`
- Source: READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Which screens does the source UI have, and what is bound?
- Options: Free text
- Recommended: `/` Home (stat tiles, filters, POC table), `/pocs/:pocId` (header, approval card, 4-phase journey with iteration chips, changes card, Artifacts and History tabs, reader drawer), `/feedback` (read-only
- Answer: `/` Home (stat tiles, filters, POC table), `/pocs/:pocId` (header, approval card, 4-phase journey with iteration chips, changes card, Artifacts and History tabs, reader drawer), `/feedback` (read-only, grouped by skill); only write is Approve; every record bound to the 5 objects; no mock data (source-ui.md §2, §4)
- Status: `answered`

### Q-clone-route

- Decision key: `clone.route`
- Type: `select`
- Source: NEBULA
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: How is a code app cloned?
- Options: download-copy-rebind · build from scratch
- Recommended: No tool copies a code app. Read-only get_branch_codebase on the source, create_code_app, port src/orbit/** and src/data/orbit.ts (not the engine/template files), re-provision bindings.ts for the new o
- Answer: No tool copies a code app. Read-only get_branch_codebase on the source, create_code_app, port src/orbit/** and src/data/orbit.ts (not the engine/template files), re-provision bindings.ts for the new objects (source-ui.md §7)
- Status: `answered`

### Q-design-hue

- Decision key: `design.hue`
- Type: `select`
- Source: READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Which hue does the design system transform to?
- Options: green 103° · gold 43° (site)
- Recommended: Green: the source app's own tokens are the forest green #4a7c30 / #29461b with the bronze #857242 accent, Spectral + IBM Plex Mono; hue 103, secondary 74
- Answer: Green: the source app's own tokens are the forest green #4a7c30 / #29461b with the bronze #857242 accent, Spectral + IBM Plex Mono; hue 103, secondary 74
- Status: `answered`

### Q-design-clone-vs-system

- Decision key: `design.clone_vs_system`
- Type: `select`
- Source: REQUEST, PROFILE, READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: The request clones the source UI; the design system says every screen follows v3.4 on the transformed stylesheet. Which governs?
- Options: keep the source's own v3.4-on-UnifyApps stylesheet (orbit/ds/bundle.css + tokens.css) and build new regions from its kit classes · replace it with the freshly transformed client.css
- Recommended: Keep the source's own stylesheet (`orbit/ds/bundle.css`, `tokens.css`, `orbit.css`, Spectral plus IBM Plex Mono, forest green #4a7c30 and bronze #857242, cream ground, gradient rail) as is; build ever
- Answer: Keep the source's own stylesheet (`orbit/ds/bundle.css`, `tokens.css`, `orbit.css`, Spectral plus IBM Plex Mono, forest green #4a7c30 and bronze #857242, cream ground, gradient rail) as is; build every new region (Build button, review list, Slack bubbles, skill block) only from its kit classes and tokens; do NOT run the fresh transform over it
- Status: `answered`

### Q-objects-ids

- Decision key: `objects.ids`
- Type: `select`
- Source: STAND-IN, SCOUT
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: What id prefix do the new objects use?
- Options: psl_ (free) · poc_live_
- Recommended: Prefix `psl_`: `psl_poc`, `psl_document`, `psl_activity`, `psl_iteration`, `psl_feedback`, `psl_skill`, `psl_skill_suggestion`; display names "POC Studio Live . POC" etc.
- Answer: Prefix `psl_`: `psl_poc`, `psl_document`, `psl_activity`, `psl_iteration`, `psl_feedback`, `psl_skill`, `psl_skill_suggestion`; display names "POC Studio Live . POC" etc.
- Status: `answered`

### Q-objects-schema

- Decision key: `objects.schema`
- Type: `select`
- Source: READ, STAND-IN
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: How close are the new objects to the Orbit ones?
- Options: mirror field for field + additions · redesign
- Recommended: Mirror the five Orbit objects field for field (same names, types, enum codes, required flags, pk, FK to `psl_poc`) minus the 16 unread fields data-plan.md omits, plus only the additions listed in "Sch
- Answer: Mirror the five Orbit objects field for field (same names, types, enum codes, required flags, pk, FK to `psl_poc`) minus the 16 unread fields data-plan.md omits, plus only the additions listed in "Schema" below; keep data-plan.md's field maps as the loader's truth
- Status: `answered`

### Q-objects-count

- Decision key: `objects.count`
- Type: `select`
- Source: PROFILE, REQUEST
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: How many objects?
- Options: 3 (object owner) · 7 (profile)
- Recommended: 7: poc, document, activity, iteration, feedback, skill, skill_suggestion; no 8th (no channel, gate or seen-ts object)
- Answer: 7: poc, document, activity, iteration, feedback, skill, skill_suggestion; no 8th (no channel, gate or seen-ts object)
- Status: `answered`

### Q-objects-reuse

- Decision key: `objects.reuse`
- Type: `select`
- Source: REQUEST, PROFILE
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Does the new backend reuse the Orbit objects or the Orbit Studio API automations?
- Options: new psl_ objects only · point at Orbit
- Recommended: New `psl_` objects only; no Orbit object is read or written and none of the five "Orbit Studio API" automations is called
- Answer: New `psl_` objects only; no Orbit object is read or written and none of the five "Orbit Studio API" automations is called
- Status: `answered`

### Q-bot-name

- Decision key: `bot.name`
- Type: `select`
- Source: REQUEST, SLACK
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: What is the bot called?
- Options: Demo Studio · POC Studio Agent
- Recommended: "POC Studio Agent": Slack display name `POC Studio Agent`, the UnifyApps agent also `POC Studio Agent`; the word "Demo Studio" appears nowhere in the product
- Answer: "POC Studio Agent": Slack display name `POC Studio Agent`, the UnifyApps agent also `POC Studio Agent`; the word "Demo Studio" appears nowhere in the product
- Status: `answered`

### Q-slack-trigger-mode

- Decision key: `slack.trigger_mode`
- Type: `select`
- Source: STAND-IN, SCOUT, REQUEST
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: How does the bot hear a tag and how are channels read?
- Options: event trigger (webhook pasted in Slack) + 60 s poll · poll only
- Recommended: Event trigger (`slack_on_new_message`, webhook pasted into Event Subscriptions: message.channels, message.groups, member_joined_channel) for the tag, the manager reply, the owner's "approve" reply and
- Answer: Event trigger (`slack_on_new_message`, webhook pasted into Event Subscriptions: message.channels, message.groups, member_joined_channel) for the tag, the manager reply, the owner's "approve" reply and bot-joined-channel, plus the 60 s poll for History. On join the listener reads the channel name and, for every row whose `slack_channel` equals it, sets `slack_channel_id`, `slack_live true` and `slack_last_ts` to now; a join that matches no row answers "Tag me with the use case name to start a POC". If Slack refuses the Request URL, the same new bot is polled and the tag is found by `<@bot>` (60 s delay)
- Status: `answered`

### Q-poll-interval

- Decision key: `poll.interval`
- Type: `select`
- Source: STAND-IN, SCOUT
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: How often is a channel read?
- Options: 60 s · 5 min
- Recommended: 60 s, `sequential: true`, one pass over the distinct `slack_channel_id` of rows with `slack_live = true`, from the smallest `slack_last_ts` of that channel, then the same value written back to every l
- Answer: 60 s, `sequential: true`, one pass over the distinct `slack_channel_id` of rows with `slack_live = true`, from the smallest `slack_last_ts` of that channel, then the same value written back to every live row of the channel
- Status: `answered`

### Q-history-dedupe

- Decision key: `history.dedupe`
- Type: `select`
- Source: READ, STAND-IN
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: How is a message logged once?
- Options: channel id + ts as the activity key · seen-ts record
- Recommended: `activity_id` = `SLK-<channel_id>-<ts>` is the primary key, so a second write is refused (data-plan.md), plus the `slack_last_ts` cursor on the row; a Slack file adds a `document_saved` activity and a
- Answer: `activity_id` = `SLK-<channel_id>-<ts>` is the primary key, so a second write is refused (data-plan.md), plus the `slack_last_ts` cursor on the row; a Slack file adds a `document_saved` activity and a `psl_document` (type `input`, format `link`); skip the bot's own posts, join/leave subtypes and messages that tag the bot (those are commands); Slack text rows use the existing types `input_added` / `document_saved`, no new enum value
- Status: `answered`

### Q-history-unnamed-message

- Decision key: `history.unnamed_message`
- Type: `select`
- Source: STAND-IN
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Where does a message that names no use case go when a channel has several?
- Options: the use case last named in the channel · not logged until named
- Recommended: A reply inside a thread takes the thread root's use case; otherwise the use case most recently named in that channel; a channel with exactly one live use case takes everything; before any name appears
- Answer: A reply inside a thread takes the thread root's use case; otherwise the use case most recently named in that channel; a channel with exactly one live use case takes everything; before any name appears in a multi-use-case channel the message is skipped
- Status: `answered`

### Q-channel-rule

- Decision key: `channel.rule`
- Type: `text`
- Source: REQUEST
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: One channel, many use cases; one use case, one channel
- Options: Free text
- Recommended: A poc row carries one slack_channel_id; a channel id may repeat across rows; the poller reads distinct live channel ids and routes a message by the use case it names
- Answer: A poc row carries one slack_channel_id; a channel id may repeat across rows; the poller reads distinct live channel ids and routes a message by the use case it names
- Status: `answered`

### Q-manager-identity

- Decision key: `manager.identity`
- Type: `select`
- Source: READ, SLACK, STAND-IN
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: How does the app know the clicker is the manager?
- Options: signed-in email/name matched to manager_email/manager_name on the row (the source UI's rule) · other
- Recommended: Signed-in tenant email equals `manager_email` on the row (case-insensitive), full name as fallback; the first-name-only fallback of the source is dropped in the UI and the automation; the bot stores `
- Answer: Signed-in tenant email equals `manager_email` on the row (case-insensitive), full name as fallback; the first-name-only fallback of the source is dropped in the UI and the automation; the bot stores `manager_slack_id`, `manager_name`, `manager_email` from the thread tag (`users.info`, users:read.email); the Approve automation re-checks the same rule and answers `forbidden` otherwise
- Status: `answered`

### Q-approval-notice-place

- Decision key: `approval.notice_place`
- Type: `select`
- Source: REQUEST, STAND-IN
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Where does "Manager approved, continue" go?
- Options: the owner by Slack message (thread/DM) · the prospect-facing channel
- Recommended: The owner by direct message from the bot: "Manager approved, continue" plus the new session link when one exists; the PRD, the built assets and the "Build started" lines go to the row's channel; if th
- Answer: The owner by direct message from the bot: "Manager approved, continue" plus the new session link when one exists; the PRD, the built assets and the "Build started" lines go to the row's channel; if the bot cannot open a DM, a thread reply under the PRD post that @-mentions the owner
- Status: `answered`

### Q-artifact-review-vs-logged

- Decision key: `artifact.review_vs_logged`
- Type: `select`
- Source: READ, REQUEST
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: The manager reviews an artifact before approving, yet artifacts are logged at approval time
- Options: document row written when the run reports with status in_review; gate_pack set at approval · second link field
- Recommended: The run's report writes each artifact as `status in_review` with `gate_pack` = the open gate (as the seeds do, PRD v3 and mockup v2 at g2); the source rule already hides them (the phase in session lis
- Answer: The run's report writes each artifact as `status in_review` with `gate_pack` = the open gate (as the seeds do, PRD v3 and mockup v2 at g2); the source rule already hides them (the phase in session lists inputs only); a new "To review" list on the approval card shows the open gate's `in_review` documents and opens the Reader; when the gate passes (both approvals) the automation sets them `approved` and the done phase lists them. No second link field, no new column
- Status: `answered`

### Q-gate-names

- Decision key: `gate.names`
- Type: `select`
- Source: READ, SLACK, STAND-IN
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Gate names against the request's four stages
- Options: G1 Scope check, G2 Design check, G3 Build sign-off (source) · Scope/Design/Build Check (team)
- Recommended: Keep the source's three gates: G1 Scope check (closes Understand), G2 Design check (closes Plan), G3 Build sign-off (closes Build); G4 stays unshown. The PRD with flowcharts and mockups is G2's pack, 
- Answer: Keep the source's three gates: G1 Scope check (closes Understand), G2 Design check (closes Plan), G3 Build sign-off (closes Build); G4 stays unshown. The PRD with flowcharts and mockups is G2's pack, the built assets are G3's; the report-back takes a `gate` value, and when a run first reaches G2 the Understand gate G1 is recorded as passed by the Judge (`gate_decided`, actor_type ai, both approval flags true)
- Status: `answered`

### Q-trigger-build

- Decision key: `trigger.build`
- Type: `select`
- Source: REQUEST, READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: How does the Build CTA start a Claude Code cloud session?
- Options: outbound HTTP call to a Claude Code routine's API trigger from an automation · other
- Recommended: A Build button in the POC page header, shown to the owner under the "ready to build" predicate (see `ui.created_state`), calls the "Start build" automation, which POSTs to the Claude Code routine fire
- Answer: A Build button in the POC page header, shown to the owner under the "ready to build" predicate (see `ui.created_state`), calls the "Start build" automation, which POSTs to the Claude Code routine fire URL (ENV id and token, `anthropic-beta` header as in claude.beta_header) with `text` = `/build <client> - <use case>` plus key: value lines (row_id, mode plan, slack_channel_id, report-back path), stores the session URL in `build_run_id`, sets stage `1_signal_capture` and status running, and posts "Build started" to the channel; it refuses with "A build is already running" when `build_run_id` is set
- Status: `answered`

### Q-claude-beta-header

- Decision key: `claude.beta_header`
- Type: `text`
- Source: READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Exact header and body for the routine fire call
- Options: Free text
- Recommended: POST https://api.anthropic.com/v1/claude_code/routines/<trigger id>/fire · headers `Authorization: Bearer <routine token>`, `anthropic-beta: experimental-cc-routine-2026-04-01`, `anthropic-version: 20
- Answer: POST https://api.anthropic.com/v1/claude_code/routines/<trigger id>/fire · headers `Authorization: Bearer <routine token>`, `anthropic-beta: experimental-cc-routine-2026-04-01`, `anthropic-version: 2023-06-01`, `Content-Type: application/json` · body `{"text": "<free text>"}` · answer `{type: routine_fire, claude_code_session_id, claude_code_session_url}`. The text reaches the routine wrapped in a `<routine-fire-payload>` block as untrusted data, so the routine's saved prompt must say to act on it. Limits: 30 fires per hour per routine. A routine needs at least one GitHub repository and the environment's network access must allow orbit.uat.unifyapps.com for the report-back call (code.claude.com/docs/en/routines, read by the moderator)
- Status: `answered`

### Q-cloud-folder

- Decision key: `cloud.folder`
- Type: `select`
- Source: REQUEST, SLACK
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: What does the cloud run need?
- Options: empty non-git folder, nebula installed, explicit push repo
- Recommended: The routine's saved prompt says: create a fresh empty folder outside the attached repository (not a git repository), install Nebula first, run `/build` for the client and use case from the fire text, 
- Answer: The routine's saved prompt says: create a fresh empty folder outside the attached repository (not a git repository), install Nebula first, run `/build` for the client and use case from the fire text, push built code to the named repository, call the report-back API at each gate; the environment's network allows `orbit.uat.unifyapps.com`
- Status: `answered`

### Q-inbound-api-key

- Decision key: `inbound.api_key`
- Type: `select`
- Source: STAND-IN, SCOUT
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: How does the cloud run call back?
- Options: callableApi automation behind an API chain; key shown once, handed over privately · other
- Recommended: A `callableApi` automation "Receive build result" behind API Group "POC Studio Live API", a new client and a new access profile limited to that group; the key is shown once, written to a private file 
- Answer: A `callableApi` automation "Receive build result" behind API Group "POC Studio Live API", a new client and a new access profile limited to that group; the key is shown once, written to a private file in the working folder, never to chat or the runbook, and handed over inside the Claude credential stop to paste into the routine's secrets
- Status: `answered`

### Q-build-continue-by

- Decision key: `build.continue_by`
- Type: `select`
- Source: REQUEST, STAND-IN
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Who continues the build after approval?
- Options: approval fires the routine again with mode build · the owner continues in their own Claude session
- Recommended: When the gate passes (both approvals in) on a row that has a `build_run_id`, the Approve gate automation fires the routine again with `mode: build` and the approved PRD link, and the owner's DM carrie
- Answer: When the gate passes (both approvals in) on a row that has a `build_run_id`, the Approve gate automation fires the routine again with `mode: build` and the approved PRD link, and the owner's DM carries that new session link; the manager's approval alone sends the DM and waits for the owner. A seeded row without `build_run_id` never launches a run
- Status: `answered`

### Q-build-final-assets-logging

- Decision key: `build.final_assets_logging`
- Type: `select`
- Source: REQUEST, PROFILE
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Built assets: logged when reported or at sign-off?
- Options: logged at the Build gate approval · logged when the run reports
- Recommended: Same rule as the PRD: written when the run reports (`in_review`, `gate_pack g3`) and the links posted to the channel at once with "BUILD is complete" to the owner; listed in Build's pack when G3 Build
- Answer: Same rule as the PRD: written when the run reports (`in_review`, `gate_pack g3`) and the links posted to the channel at once with "BUILD is complete" to the owner; listed in Build's pack when G3 Build sign-off passes
- Status: `answered`

### Q-feedback-capture

- Decision key: `feedback.capture`
- Type: `select`
- Source: REQUEST, READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Where is gate feedback captured?
- Options: rows written by the cloud run through the report-back API (human and judge) + a Send back form in the app · API only
- Recommended: Rows written by the cloud run through the report-back API (human and judge feedback): one call writes a `psl_feedback` row, the `psl_iteration` row that draws the branch and counter (linked by `relate
- Answer: Rows written by the cloud run through the report-back API (human and judge feedback): one call writes a `psl_feedback` row, the `psl_iteration` row that draws the branch and counter (linked by `related_ticket`) and an `iteration_logged` activity; NO "Send back" form in the app
- Status: `answered`

### Q-cut-skill-loop

- Decision key: `cut.skill-loop`
- Type: `select`
- Source: REQUEST
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Is the skill-improvement loop in this build?
- Options: build, thin · cut
- Recommended: Build it, last and thin: one scheduled automation with a Simple Call LLM node, the Feedback page extended with versions, the pending suggestion with its evidence and Approve, and the approve automatio
- Answer: Build it, last and thin: one scheduled automation with a Simple Call LLM node, the Feedback page extended with versions, the pending suggestion with its evidence and Approve, and the approve automation
- Status: `answered`

### Q-suggestion-threshold

- Decision key: `suggestion.threshold`
- Type: `select`
- Source: STAND-IN
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: How many feedback rows trigger a suggestion?
- Options: 3 · 5
- Recommended: 3 open feedback tickets for one skill since its last approved suggestion
- Answer: 3 open feedback tickets for one skill since its last approved suggestion
- Status: `answered`

### Q-suggestion-evidence-window

- Decision key: `suggestion.evidence_window`
- Type: `select`
- Source: STAND-IN, READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Which feedback feeds a suggestion?
- Options: rows since the skill's last approved version · all rows
- Recommended: Tickets for that skill with status `open` and `created_at` after the newest `approved_at` of that skill's suggestions; on approval those tickets turn `resolved` with `action_taken` "Included in <skill
- Answer: Tickets for that skill with status `open` and `created_at` after the newest `approved_at` of that skill's suggestions; on approval those tickets turn `resolved` with `action_taken` "Included in <skill name> v<n>"; the suggestion stores `evidence_count` and `evidence_tickets` (comma-separated) so the page lists the evidence without recomputing; a skill that already has a pending suggestion is skipped
- Status: `answered`

### Q-skills-admin-role

- Decision key: `skills.admin_role`
- Type: `select`
- Source: STAND-IN
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Who approves a suggestion?
- Options: any signed-in manager/admin in the app · a named admin
- Recommended: Any signed-in viewer whose email is `manager_email` on at least one `psl_poc` row; the Approve button on the Feedback page shows only to them and the automation answers `forbidden` to anyone else; no 
- Answer: Any signed-in viewer whose email is `manager_email` on at least one `psl_poc` row; the Approve button on the Feedback page shows only to them and the automation answers `forbidden` to anyone else; no admin field, no role, no group
- Status: `answered`

### Q-agent-model

- Decision key: `agent.model`
- Type: `select`
- Source: STAND-IN, SCOUT
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Which model do the agents run on?
- Options: Claude Sonnet 4.6 (UnifyApps) e_69b41a443d6f1815768c245f · Claude Sonnet 5 e_6acca2af70b66f5702c8b59f
- Recommended: Claude Sonnet 4.6 (UnifyApps) `e_69b41a443d6f1815768c245f` for POC Studio Agent and for the skill rewrite (Simple Call LLM node, JSON output); no second "Skill Coach" agent
- Answer: Claude Sonnet 4.6 (UnifyApps) `e_69b41a443d6f1815768c245f` for POC Studio Agent and for the skill rewrite (Simple Call LLM node, JSON output); no second "Skill Coach" agent
- Status: `answered`

### Q-app-access

- Decision key: `app.access`
- Type: `select`
- Source: PROFILE, READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Visibility of the code app
- Options: PRIVATE (profile) · PUBLIC
- Recommended: PRIVATE; managers sign in with their tenant accounts; CSP allows `avatars.slack-edge.com`, `secure.gravatar.com` and the Spectral font host
- Answer: PRIVATE; managers sign in with their tenant accounts; CSP allows `avatars.slack-edge.com`, `secure.gravatar.com` and the Spectral font host
- Status: `answered`

### Q-innovate

- Decision key: `innovate`
- Type: `select`
- Source: REQUEST
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Does the Innovator run?
- Options: off · nebula
- Recommended: Off: the request is a precise functional spec for an internal tool, not a pitch; ideas beyond it would be cut as "nothing beyond the beats"
- Answer: Off: the request is a precise functional spec for an internal tool, not a pitch; ideas beyond it would be cut as "nothing beyond the beats"
- Status: `answered`

### Q-ui-created-state

- Decision key: `ui.created_state`
- Type: `text`
- Source: REQUEST, READ, STAND-IN
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: (added by the Stand-in)
- Options: Free text
- Recommended: One derived rule in the status function: a row with status `running`, stage `0_kickoff` and empty `build_run_id` reads "Waiting on you" to its owner and "Waiting on {owner}" to everyone else; it count
- Answer: One derived rule in the status function: a row with status `running`, stage `0_kickoff` and empty `build_run_id` reads "Waiting on you" to its owner and "Waiting on {owner}" to everyone else; it counts in the Waiting-on-you filter and the rail badge, and it is the predicate that shows the Build button. Storyline beat 2 stays "Waiting on you"; after Build the row reads "Building . Understand" with the session link. The seeded Northgate row (stage `0_kickoff`) gets a `build_run_id` so it still reads Building
- Status: `answered`

### Q-ui-history-render

- Decision key: `ui.history_render`
- Type: `text`
- Source: REQUEST, READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: (added by the Stand-in)
- Options: Free text
- Recommended: Change the History tab so a row that carries `slack_ts` renders as a chat bubble: round avatar (the `actor_avatar_url` image, initials when empty), sender name, the text in a bubble, the time under it
- Answer: Change the History tab so a row that carries `slack_ts` renders as a chat bubble: round avatar (the `actor_avatar_url` image, initials when empty), sender name, the text in a bubble, the time under it linking to `slack_ref`; the day groups (Today, Yesterday, weekday) stay as the date dividers; all bubbles left-aligned; every other event kind keeps the source's compact line with its badge, shown as a centred notice
- Status: `answered`

### Q-data-prd-doc-type

- Decision key: `data.prd_doc_type`
- Type: `text`
- Source: READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: (added by the Stand-in)
- Options: Free text
- Recommended: The PRD is type `brd` and the mockups type `design`, both format `html`; never `requirements`
- Answer: The PRD is type `brd` and the mockups type `design`, both format `html`; never `requirements`
- Status: `answered`

### Q-data-client-name-rule

- Decision key: `data.client_name_rule`
- Type: `text`
- Source: STAND-IN
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: (added by the Stand-in)
- Options: Free text
- Recommended: The agent takes `client_name` and `client_slug` from an existing row of the same channel when there is one (Pentland for the PLM row), else from the first word of the typed name, capitalised; it never
- Answer: The agent takes `client_name` and `client_slug` from an existing row of the same channel when there is one (Pentland for the PLM row), else from the first word of the typed name, capitalised; it never asks in the thread (the only question is the manager); `use_case` keeps the full typed name
- Status: `answered`

### Q-slack-demo-channel

- Decision key: `slack.demo_channel`
- Type: `text`
- Source: STAND-IN, READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: (added by the Stand-in)
- Options: Free text
- Recommended: A new private channel named exactly `pentland-poc` (the name both seeded Pentland rows already carry in `slack_channel`), created by the person, the bot invited; the join event then links both Pentlan
- Answer: A new private channel named exactly `pentland-poc` (the name both seeded Pentland rows already carry in `slack_channel`), created by the person, the bot invited; the join event then links both Pentland rows to its real id by name. If that name is taken, the person picks another and updates `slack_channel` on the two rows before inviting the bot
- Status: `answered`

### Q-owner-approval

- Decision key: `owner.approval`
- Type: `text`
- Source: READ, REQUEST, STAND-IN
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: (added by the Stand-in)
- Options: Free text
- Recommended: The owner approves in Slack by replying "approve" in the thread of the bot's gate post; the listener accepts it only from `owner_slack_id` and calls the same Approve gate automation with role owner
- Answer: The owner approves in Slack by replying "approve" in the thread of the bot's gate post; the listener accepts it only from `owner_slack_id` and calls the same Approve gate automation with role owner
- Status: `answered`

### Q-seed-volume

- Decision key: `seed.volume`
- Type: `text`
- Source: PROFILE
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: (added by the Stand-in)
- Options: Free text
- Recommended: 11 `psl_poc` rows (every phase, stage code, gate state and status, data-plan.md) and 54 rows in all across the 7 objects; the live PLM row is the 12th
- Answer: 11 `psl_poc` rows (every phase, stage code, gate state and status, data-plan.md) and 54 rows in all across the 7 objects; the live PLM row is the 12th
- Status: `answered`

### Q-data-long-text-limit

- Decision key: `data.long_text_limit`
- Type: `text`
- Source: NEBULA
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Can a `textarea` hold a 6.7 KB HTML value?
- Options: Free text
- Recommended: 
- Answer: 
- Status: `open`
