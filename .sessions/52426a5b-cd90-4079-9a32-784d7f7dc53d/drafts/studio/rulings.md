# Rulings, round 1 (Judge) - UnifyApps POC Studio Live

Read: ledger.md, storylines.md (with Scout blocks), stand-in.md, external.md, data-plan.md, source-ui.md §2 and §4, the profile, request.md, demo-defaults.md. Intent is `use-case` (settled fact): no hood beats. Budget line: 3 pages, 7 objects, 8 automations, 2 AI agents, 3 discussion rounds, 2 rehearsal rounds, "the request's scope overrides the defaults".

## 1. The chosen storyline

**Pentland, from the Slack tag to the manager's Approve** (the Safe storyline), plus one borrowed beat from Bold.

Reason, three lines:
1. Score: Safe is highest on fit x feasibility, 4 x 4 = 16, against Unexpected 2 x 5 = 10 and Bold 3 x 3 = 9. Its beats are the profile's `show off` line in order (a tag makes the row; the journey and History stay current from Slack; one click starts the build; the manager's approval round-trips through Slack) and the lean-forward moment that line names comes last.
2. Rules 1 and 2: Safe and Bold need a Slack bot and a Claude routine the tenant has no fit connection for (external.md verdict). The Scout's `no tool` lines turn both into manual tasks for the person, the profile allows exactly one credential stop for each, and the request names both. Without Slack the lean-forward moment is gone, so the need cannot be cut and the storyline is not dropped. No storyline has a hood beat. Unexpected needs nothing external but drops the request's core flow and the profile's show-off.
3. Rule 4, the merge: exactly one beat is borrowed, Bold's beat 7 (the final built assets with their links and "BUILD is complete" in the channel). It fixes Safe's only fit gap (the request's "return the final Built assets ... notifying the user that BUILD is complete") and adds no entity: Receive build result and Approve gate are already in Safe. The Stand-in's other "Bold" beats are already Safe beats (Build click with "Build started" = Safe 5; Approve with the owner's Slack = Safe 7) or are automation rules with no beat of their own (Approve firing the second run is `build.continue_by`, silent). The Stand-in's skill-loop beat from Unexpected is out of the walk (see (a)).

### The walk: six beats, about 15 minutes, lean-forward last

Story row: **Pentland Vulnerability Use Case** (client Pentland, `poc_id` POC-pentland-vulnerability-20261001), identity per `seed.identity`: owner AND manager are the presenter (Gourav Mahunta, gourav.mahunta@unifyapps.com, his Slack id resolved from that email at build time); stage `4_design_system`, `current_gate g2`; Understand approved, Plan waiting; owner approval already given in Slack, manager approval not yet; PRD v3 and mockup v2 `in_review`, `gate_pack g2`; 2 Plan iterations (Judge, then the manager) so the Plan counter reads 2; seeded History bubbles; every child value that named Aarav Mehta or Priya Nair is swapped to the presenter. The presenter says once: "for the demo I am owner and manager". The row has no `build_run_id`, so its Approve starts no cloud run.

| # | The presenter does | The screen shows | Page | Mode |
|---|---|---|---|---|
| 1 | Opens the POC Dashboard with Slack (#pentland-poc) beside it | Table of 12 POCs: prospect, use case, journey strip, status, owner, manager, last activity; every stage and status present; two blockers; the story row under "Waiting on you"; Pentland Product Enrichment and Pentland PLM next to it in the same channel | POC Dashboard `/` | SEEDED (11 rows) + the rehearsal row (the 12th) |
| 2 | In #pentland-poc tags @POC Studio Agent with "Pentland MDM Use Case"; the bot asks "Who is the manager?"; the presenter tags a real teammate in the thread | The bot confirms in the thread; a 13th row appears on the dashboard without a reload: same channel, owner = the tagger, manager = the tagged person, Understand, "Waiting on you" | POC Dashboard | LIVE |
| 3 | Failure path: tags the bot again with "Pentland Vulnerability Use Case" | The bot answers that the name already belongs to this channel and links the row; the dashboard still shows 13 | POC Dashboard | LIVE |
| 4 | Opens Pentland Vulnerability Use Case. Journey: clicks the "2 iterations" chip on Plan. Then the History tab, then the Documents tab | Chip opens the panel: both reasons, who gave each (Judge, the manager), the skill each points at. History reads as a chat: round picture, sender, time, text in a bubble, two of them real Slack posts made before the call, the older ones seeded. Documents lists the use case's files | POC page `/pocs/:pocId` | SEEDED + poller-written (two real posts) |
| 5 | Back to the dashboard, opens the row created in beat 2, clicks Build. Then scrolls #pentland-poc up to the earlier PLM run | The row reads "Building . Understand" with the Claude session link; the bot posts "Build started" in the channel. Higher up in the channel: the earlier run's PRD post (flowchart and mockups, with the app link) posted through the same path | POC page | LIVE (click, fire, post) + REHEARSAL (PRD post) |
| 6 | **Lean-forward.** Opens the story row. Approval card shows Owner "Approved in Slack", Manager "Waiting", and a "To review" list with the PRD and the mockup; opens the PRD in the Reader; clicks Approve Plan. Then turns to Slack | Plan crosses with the presenter's name and the time, the PRD and mockup now listed under Plan, Build reads "Building"; the owner's Slack DM arrives from the bot: "Manager approved, continue". Tail (about 40 seconds): the same channel's earlier PLM thread shows the run continuing after its approval, the final built assets with their links, "BUILD is complete" to the owner | POC page, then Slack | LIVE (click, DM) + REHEARSAL (tail) |

LIVE: the Slack tag and manager thread (2), the duplicate refusal (3), the Build click, the outbound fire and "Build started" (5), the Approve click, the activity row, the document flips and the DM (6).
SEEDED: the 11 dashboard rows, the story row's gates, iterations, documents and older History, the feedback tickets, skills and suggestions.
Poller-written: two real posts the presenter makes in #pentland-poc at least 10 minutes before the call, one naming each Pentland use case (Vulnerability, Product Enrichment); they show with the real picture.
REHEARSAL (real earlier run, not staged): the "Pentland PLM Use Case" row (created by the same tag flow, Built, approved, continued) and its posts: the PRD post (5), the final assets and "BUILD is complete" (6 tail). It also makes the 12th dashboard row, which reads as a finished flow.
The live Build in beat 5 is real too; if its PRD lands during the call, the presenter says so; the walk never waits for it.

### (a) Does the slot hold seven beats? No. Beat dropped: the Stand-in's beat 6 (Feedback page, suggestion approved, PRD writer v3 to v4)

- Four beats wait on a live hop (Slack event and the agent, the dashboard refetch, the outbound fire, the DM). Seven beats at the Stand-in's pacing add to about 17 minutes before the greeting, the Q&A and one stall, so none is left; six beats come to about 15 (1.5 / 3 / 1 / 3.5 / 2.5 / 4), which leaves five in hand.
- It is a middle beat, the profile's `show off` line does not name the skill loop, and the build finishes it last, so a walk that stood on it would stand on the item most likely to be late.
- Stays in the build anyway: `psl_skill`, `psl_skill_suggestion`, automations 7 and 8, the Feedback page block (version, pending suggestion with its evidence, Approve for the manager). The request names them ("Skill improvement loop", "skill versions tracked") and the budget is already sized for them. Built last, thin, run once on the seeds so one pending PRD writer suggestion exists, and not walked. If asked in Q&A the presenter opens `/feedback`; that is not a beat.
- Stand-in beat 4 (History plus counter drawer) stays one beat: one visit to one page.

### (b) Final entity list against the budget

Pages 3 of 3 · objects 7 of 7 · automations 8 of 8 · AI agents 1 of 2 · plus 1 Slack connection, 1 API chain, 3 environment variables, 2 credential stops. Nothing here is above the profile's line.

## 2. The entity list that goes into the spec

Beat tags: 1 to 6 are the walk's beats; "R" is a request line with no walked beat (built, not walked); "T" is the rehearsal tail.

**Objects (7 of 7)**

| # | Id | Job | Used by |
|---|---|---|---|
| 1 | `psl_poc` | one row per use case: gates, status, owner/manager, channel link, `build_run_id` | 1, 2, 3, 5, 6 |
| 2 | `psl_activity` | History bubbles (rows with `slack_ts`) and system rows (`gate_posted`, approvals) | 4, 6 |
| 3 | `psl_document` | inputs, PRD (`brd`, html), mockups (`design`, html), built assets | 4, 5 (T), 6 |
| 4 | `psl_iteration` | the counter chips and panel | 4 |
| 5 | `psl_feedback` | the request's feedback object; Home "Open feedback" tile and rail badge; written by Receive build result | 1, R |
| 6 | `psl_skill` | skill versions | R |
| 7 | `psl_skill_suggestion` | pending and approved suggestions | R |

Schema is the Stand-in's "Schema" block with one change: `psl_feedback` also loses `category` and `channel` (see the table). Seeds: 54 rows in all, loaded skill, poc, document, feedback, iteration, activity, suggestion, with the three patches and the two dropped columns. Pocs seeded 11; the rehearsal makes the 12th, beat 2 the 13th.

**Automations (8 of 8)**

| # | Name | One-line job | Trigger kind | Used by |
|---|---|---|---|---|
| 1 | Slack listener | Hears a tag or the manager's thread reply and hands it to the agent; an owner "approve" reply goes to Approve gate; a bot-joined event links rows by channel name; posts the reply in the thread | Slack event (`slack_on_new_message`, webhook pasted into Event Subscriptions) | 2, 3, T |
| 2 | Save POC from Slack | Creates the row or notes the manager; results `created`, `needs_manager`, `exists`, `noted` | Callable, an agent tool | 2, 3 |
| 3 | Read channels into History | Every 60 s, one pass over distinct live channels; one `psl_activity` row per message keyed `SLK-<channel>-<ts>`; files become documents; skips the bot's posts | Scheduled, 60 s, sequential | 4 |
| 4 | Start build | Refuses when `build_run_id` is set; POSTs the routine fire call; stores the session URL; sets stage and status; posts "Build started" | Callable from the app (Build button) | 5 |
| 5 | Receive build result | Takes the cloud run's report (PRD at g2, final assets at g3, feedback and iteration rows); writes documents `in_review`; posts to the channel with the app link; DMs the owner "BUILD is complete" | `callableApi` behind the API chain | 5, T |
| 6 | Approve gate | Checks the caller is the manager, applies the source transitions, writes the activity, flips the gate's documents to `approved`, DMs "Manager approved, continue", fires the routine in build mode when the gate passes on a row with `build_run_id` | Callable from the app (Approve button) and from the listener (owner reply) | 6, T |
| 7 | Suggest skill improvements | Per skill with 3 or more open tickets since its last approval, one Simple Call LLM node writes a pending suggestion | Scheduled, weekly | R |
| 8 | Approve skill suggestion | Sets the skill's version and prompt, resolves the evidence tickets; manager-viewers only | Callable from the app (Feedback page) | R |

**AI agent (1 of 2):** POC Studio Agent, Claude Sonnet 4.6 (UnifyApps) `e_69b41a443d6f1815768c245f`, one tool (automation 2); asks for the manager when missing, answers `exists` for a taken name; beats 2, 3. The skill rewrite is a node in automation 7, not an agent.

**Pages (3 of 3):** Home `/` (beats 1, 2, 3); POC page `/pocs/:pocId` (4, 5, 6); Feedback `/feedback` (R; the Home "Open feedback" tile opens it).

**UI changes to the cloned code**, each tied to a beat (everything else in the clone is kept as it is):
- Rebind to the `psl_` objects with new provisioned bindings; port `src/orbit/**` and `src/data/orbit.ts` only (1 to 6).
- Brand strings (document title, empty-state copy); "Artifacts" tab renamed "Documents" (4).
- Header drops a leading client name from `use_case`; the channel prints with "#" (1, 4, 6).
- One derived status rule: `running` + `0_kickoff` + empty `build_run_id` reads "Waiting on you" to its owner; it feeds the filter, the badge and the Build button (2, 5). Northgate gets a `.invalid` `build_run_id`.
- Build button and the Claude session link; Start build through the app's automation data source (5).
- "To review" list on the approval card (the open gate's `in_review` documents, opens the Reader) and Approve through the Approve gate automation with `forbidden` and `already_decided` shown as page-default toasts (6).
- History tab: Slack rows as chat bubbles (avatar or initials, sender, text, time linking to `slack_ref`), other events as centred notices (4).
- Refetch interval on the lists so the pages follow the automations (2, 3, 5, 6).
- CSP allows `avatars.slack-edge.com`, `secure.gravatar.com` and the Spectral font host (4).
- Feedback page block: version, pending suggestion beside current prompt, evidence tickets, Approve (R, built last).
- Stylesheet untouched (`design.clone_vs_system`); new regions use kit classes only.

**Connections:** Slack, new "POC Studio Live Slack" (authType TOKEN, bot token; the user token only if the form refuses it empty; rotation off), created by the main session at credential stop 1; every Slack node uses `bot_token`; beats 2, 3, 4 (poller), 5, 6, T. Routine: no connection object, the person makes the routine (API trigger, GitHub repository, network allows `orbit.uat.unifyapps.com`, saved prompt); the fire is the HTTP node `custom_http_endpoint_execute` in automations 4 and 6; beats 5, 6, T.

**API chain for Receive build result:** `callableApi` automation, an API backed by it, API Group "POC Studio Live API", a new client, a new access profile limited to that group. Key shown once, written to a private file in the working folder, never to chat or the runbook, handed over inside credential stop 2 to paste into the routine's secrets. Beats 5, T.

**Environment variables (3):** `CLAUDE_ROUTINE_ID` (plain), `CLAUDE_ROUTINE_TOKEN` (sensitive), `POC_STUDIO_APP_URL` (plain, set after the app publishes; the app link in the PRD post and the DM). Beats 5, 6, T.

**Manual tasks for the person (not credentials):** create #pentland-poc (private) and invite the bot; paste the Request URL; make the two real pre-call posts.

## 3. Cuts and refusals, in three lines

- **Beats and storylines:** Stand-in beat 6 (skill loop) out of the walk for time, still built; Bold beat 3 (second Build click refused) because the failure beat is the duplicate and the check stays silent inside Start build; Bold beat 4 (same as beat 2); all of Unexpected (its Send back form contradicts "feedback happens in Claude", its Run now needs a ninth automation, its Skill Improvements page is a fourth page); Safe's invented "Access Review" name and second login for Priya Nair (real names, `seed.identity`).
- **Build side:** `psl_feedback.category` and `psl_feedback.channel` (no screen, no rule, the report-back would have to invent them); the `rejected` suggestion status; Safe's separate Journey Stage and History Entry objects (the psl_ clones carry them); `BranchMark.tsx`, dead CSS and every template file (not ported); the Raise Issue poll-only Slack fallback (wrong bot name in a prospect channel, and the bot must be invited either way). Regions of the cloned UI that no beat opens (Bell, Changes card, mini rail) stay as cloned: the request says "Clone this" and keeping them costs nothing.
- **Stand-in refusals:** all upheld, none overturned (Send back form, Run now, second scheduled caller, reject button, `admin_email`, Skills admin page, settings or roles page, channel-map and seen-ts objects, "Skill Coach" agent, Slack interactive buttons, Create POC modal, My queue, POC Pilot, right-aligned bubbles, reusing Orbit objects or an existing Slack connection, Approve on a seeded row firing a cloud run), each because no beat and no request line uses it. "Build the skill loop last, do not cut" is upheld: the request names it and the budget holds it, but it ships after the walk's flow is green and is not a beat.

## 4. Build order

Confirm the Stand-in's principle (manual stops first, core flow before the skill loop). Change its order: the rehearsal run is the long pole (two cloud runs, two approvals, no way to speed them), and it cannot start until the tag flow, Start build, Receive build result and Approve gate exist, so those move ahead of History and the rehearsal starts the moment they are green, not at a clock time.

0. At once, in parallel, no builder: the person creates the Slack app from the manifest, the private channel `pentland-poc` and the routine (credential stops 1 and 2). The Scout settles the platform questions (Request URL verification, `message.groups` and join events, DM by user id, ENV in the HTTP path) and the long-text limit.
1. Blocking, one builder: the 7 objects, then the seed in load order. The PRD is seeded first as the long-text test.
2. In parallel once the objects exist (they share only the objects):
   - **A** code app: create, port, rebind, publish v1 on the seeds; then, chained as later code-app tasks (never two at once), the status rule, Build button, "To review", Approve through the automation, History bubbles, Documents label, refetch. First demo-able state: dashboard, POC page and History on seeds.
   - **B** Slack connection (after stop 1), Slack listener, POC Studio Agent, Save POC from Slack: beats 2 and 3, duplicate refusal, join linking.
   - **C** Approve gate and the DM (needs B's connection, `POC_STUDIO_APP_URL` after A publishes): this is the lean-forward flow on the seeded story row, the first flow that must work end to end; wire A's Approve to it.
   - **D** Start build, Receive build result, the API chain and the env variables (after stop 2), then the one `DEMO-TEST` fire; hands the key to the person for the routine's secrets.
3. Rehearsal round 1 starts when B, C, D and A are live: tag "Pentland PLM Use Case", Build, approve the PRD in the app, owner replies "approve" in Slack, second run, final assets. Nothing else waits on it.
4. In parallel with the rehearsal: Read channels into History (after B and A); the person makes the two pre-call posts.
5. Last, after everything above is green: automations 7 and 8 and the Feedback page block (a code-app task chained after A), then one run of 7 on the seeds to leave a pending PRD writer suggestion. It may use an idle builder earlier but never delays a step above or the publish.
6. Rehearsal round 2: the full six-beat walk with a timer, signed in as the presenter, checking that Approve shows.

## 5. Rulings on rows

| Key | Ruling | Reason |
|---|---|---|
| data.long_text_limit | SENT BACK to the moderator for the Scout (platform question, no NEBULA answer). Plan B I accept: shrink the two seeded HTML values to the limit found (keep the inline SVG flowchart, drop prose and styles); `content` stays HTML in the object. `file_link` only as a last resort. The report-back contract uses the same limit | The Reader renders `html` in an iframe; a `file_link` makes the PRD open in a new tab and weakens beat 6. |
| story.row | JUDGE: the story row stays "Pentland Vulnerability Use Case". The live beat-2 name becomes "Pentland MDM Use Case"; "Pentland PLM Use Case" becomes the rehearsal run's row. The dashboard opens at 12 rows and beat 2 makes 13 | The Stand-in's fallback (the rehearsal run's posts) needs a real row to belong to; with PLM as the live name the rehearsal would take it and beat 2 would answer "exists". MDM/MDG is a real Pentland workstream in the ledger's evidence, so it is not invented. |
| seed.volume | JUDGE: 11 seeded `psl_poc` rows and 54 rows in all stay; the rehearsal row is the 12th, beat 2 the 13th | Follows story.row; the profile's 8 to 12 seeds is met by the seeds, the rest is live. |
| objects.unread_fields | JUDGE: also drop `psl_feedback.category` and `psl_feedback.channel`; the 10 feedback seeds lose two columns | source-ui §3.3 marks both "NOT read"; no beat or rule needs them; data-plan.md dropped `tier` for the same reason. Fewer fields in the contract the routine's saved prompt must satisfy. |
| time.budget | JUDGE: build order as in section 4; the 13:00 target applies to the six-beat walk without the rehearsal tail | The long pole moves to the front; see the Elephant. |
| cut.skill-loop | JUDGE: upheld, build last and thin; its beat is not in the walk | Request-named, inside the budget, but it must not stand on the walk or delay the publish. |
| approval.write_path | JUDGE: add the order inside Approve gate: commit the approval, the activity and the document flips first, then the DM, then the routine fire; a failed DM or fire returns `decided` with a warning toast and a log line, never rolls back | The lean-forward click must work when Slack or the routine is down. |
| env.app_url (new) | JUDGE: environment variable `POC_STUDIO_APP_URL` (plain), set after publish, used in the PRD post and the DM | Request: "Manager gets Slack link, reviews artifacts in app"; no row held the app's address; one place beats a constant in two automations. |
| ui.tab_label (new) | JUDGE: the POC page tab "Artifacts" is renamed "Documents" | The request's word ("Documents is just the crisp gathering..."); one string; beat 4 opens it. |
| seed.identity | JUDGE: upheld, with one addition: the manager tagged in beat 2 is a real workspace member the presenter names before the call (or the presenter himself); Priya Nair and the other invented people exist only on seeded rows and are never tagged | The bot resolves the manager through the Slack user lookup; an invented name resolves to nothing. Rehearsal 2 checks that Approve shows for the signed-in presenter. |

Rows ruled: 9 JUDGE, 1 sent back. No other row is open or settled badly enough to touch.

## 6. Pre-mortem

- **Tiger**: Slack's event URL and the routine's fire call are both unverified, and every live beat plus the rehearsal tail hangs on them; the brief must say: save the Request URL and answer one `DEMO-TEST` tag, and make the one `DEMO-TEST` fire (200, a session URL, Nebula installs, the report-back reaches orbit.uat) before anything is built on either; a rejected fire is fixed from `errorDetails.body` first, and if Slack refuses the URL the same new bot falls back to the 60 s mention poll.
- **Paper tiger**: "Two cloud runs will not finish in 20 minutes" looks fatal (it cut Bold to 3) and is not, because the walk never waits for a run: beat 5's moment is the Build click and the session link, and the results come from the rehearsal run's posts already in the channel.
- **Elephant**: The 13:00 target and the rehearsal run do not fit together (the run needs the tag flow, Start build, Receive build result and Approve gate live, then two cloud runs and two approvals), so the tail may land after 13:00 or not at all; the brief must call the demo ready at six beats without the tail (the PRD post in beat 5 and the assets in beat 6 dropped, said aloud), and a result posted by hand through Receive build result may never be shown as a run.
