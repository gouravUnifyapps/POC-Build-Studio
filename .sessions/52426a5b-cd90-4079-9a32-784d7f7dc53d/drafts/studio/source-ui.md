# Source UI inventory: Orbit · POC Studio (app-b4fe5a0a30eb)

Read-only inventory. No write was made to the tenant. Solution reply cached at `STUDIO/work/source-solution.json`.

## 1. Commit read

- App: `app-b4fe5a0a30eb`, "Orbit · POC Studio", code app (interface record version 9, mode `code`), NOT git-linked (work on `main` only), not busy when read.
- Branch read: `main`, head commit **91ab370a8d6f6cc3afa4f25fe1db155279a2b14a** (2026-10-16T05:29:09Z). Commit message: "The chips now say "iterations" and sit centred under their phase cards, joined by a short connector line. The build passes, but I haven't opened ..." (the newest commit was built but its author had not opened it in a preview).
- Head was re-checked after the read and had not moved.
- Deployed (live) version is **v5 at commit `86cd9ddf35db97b191895f7f0faa121ca209010e`** (entityVersion 8). The live app is 3 commits behind the head read here: `b9397c2a` (collapse loop-backs into a chip), `c2f9eef8` (full-width loop panel) and `91ab370a` ("iterations" wording, chip centred under its card), all by Rohil on 2026-10-16 between 05:12Z and 05:29Z, none published. Another person is editing this app. Earlier published versions (v1.0 to v1.2) had a My queue page, a New POC modal, stop/restart gate decisions and a POC Pilot assistant; the head no longer has any of them (the code today is read-only except for one Approve write).
- Downloaded by the Nebula bridge to `WORKDIR/app-b4fe5a0a30eb/main` (111 files on disk including a bridge-made `.git`). The bridge put the files on disk as expected.
- Source solution: `e_6ad1031ce0ef8b24527e9ed9` "POC Studio", status `built`, version 15.

### Solution member list (get_solution, 10 linked-asset rows, 3 plans, 0 specs, 0 documents)

| Kind | id | name / role |
|---|---|---|
| Object (entity type) | `orbit_studio_poc` | "Orbit · POC" (pk `poc_id`), 42 fields, USED by the app |
| Object | `orbit_studio_document` | "Orbit · Document" (pk `document_id`), 17 fields, USED |
| Object | `orbit_studio_feedback` | "Orbit · Feedback" (pk `ticket_no`), 22 fields, USED |
| Object | `orbit_studio_activity` | "Orbit · Activity" (pk `activity_id`), 15 fields, USED |
| Object | `orbit_studio_iteration` | "Orbit · Iteration" (pk `iteration_id`), 13 fields, USED |
| Object | `poc_studio_poc` | linked to the solution but NOT used by this app (written by the separate POC Studio loop) |
| Object | `poc_studio_document` | same, not used |
| Object | `poc_studio_feedback` | same, not used |
| Object | `poc_studio_activity` | same, not used |
| App (e_interface) | `app-b4fe5a0a30eb` | "Orbit · POC Studio" code app, linked at version 9, source_commit_hash 91ab370a... |
| Automations | none | the solution links no automation |
| AI agents | none | |
| Connections | none | |

The solution plans (3, all presentation-only edits to the journey strip's iterations chip) and the memory say: the app uses its own `orbit_studio_*` objects, never `poc_studio_*`; a gate's wait time comes from the newest `gate_posted` Activity row for that gate (else newest pack document `saved_at`), so whatever posts a gate must write a `gate_posted` row to `orbit_studio_activity`; example rows carry a `[Example] ` prefix on `client_name`.

### File tree (paths with line counts; `.git` omitted)

```
.agents/rules/project-guidelines.md  (78 lines)
.githooks/pre-push  (42 lines)
PRODUCT.md  (22 lines)
README.md  (374 lines)
app/.env  (6 lines)
app/.oxlintrc.json  (9 lines)
app/README.md  (374 lines)
app/bun.lock  (98454 bytes)
app/components.json  (25 lines)
app/i18next.config.mjs  (74 lines)
app/index.html  (35 lines)
app/package.json  (47 lines)
app/public/icons.svg  (5031 bytes)
app/public/unifyapps-app-32.png  (2691 bytes)
app/scripts/check-core-stack.mjs  (108 lines)
app/scripts/install-hooks.mjs  (34 lines)
app/src/App.tsx  (59 lines)
app/src/assets/hero.png  (13057 bytes)
app/src/assets/unifyapps-lockup-reversed.png  (54953 bytes)
app/src/assets/unifyapps-mark-reversed.png  (21267 bytes)
app/src/assets/vite.svg  (8709 bytes)
app/src/components/artifacts.tsx  (86 lines)
app/src/components/copilot.tsx  (275 lines)
app/src/components/ui/alert-dialog.tsx  (199 lines)
app/src/components/ui/avatar.tsx  (110 lines)
app/src/components/ui/badge.tsx  (67 lines)
app/src/components/ui/button.tsx  (70 lines)
app/src/components/ui/card.tsx  (103 lines)
app/src/components/ui/checkbox.tsx  (36 lines)
app/src/components/ui/dialog.tsx  (166 lines)
app/src/components/ui/dropdown-menu.tsx  (267 lines)
app/src/components/ui/input.tsx  (22 lines)
app/src/components/ui/label.tsx  (27 lines)
app/src/components/ui/password-input.tsx  (35 lines)
app/src/components/ui/popover.tsx  (87 lines)
app/src/components/ui/progress.tsx  (31 lines)
app/src/components/ui/radio-group.tsx  (45 lines)
app/src/components/ui/scroll-area.tsx  (55 lines)
app/src/components/ui/select.tsx  (204 lines)
app/src/components/ui/separator.tsx  (28 lines)
app/src/components/ui/sheet.tsx  (226 lines)
app/src/components/ui/skeleton.tsx  (13 lines)
app/src/components/ui/sonner.tsx  (92 lines)
app/src/components/ui/switch.tsx  (36 lines)
app/src/components/ui/table.tsx  (114 lines)
app/src/components/ui/tabs.tsx  (95 lines)
app/src/components/ui/textarea.tsx  (23 lines)
app/src/components/ui/tooltip.tsx  (55 lines)
app/src/data/bindings.ts  (322 lines)
app/src/data/index.ts  (49 lines)
app/src/data/orbit.ts  (305 lines)
app/src/data/seed.ts  (77 lines)
app/src/i18n/i18next.d.ts  (16 lines)
app/src/i18n/languages.json  (6 lines)
app/src/i18n/resources.d.ts  (4 lines)
app/src/index.css  (282 lines)
app/src/lib/data.ts  (273 lines)
app/src/lib/i18n/index.tsx  (192 lines)
app/src/lib/i18n/keys.ts  (70 lines)
app/src/lib/i18n/language.ts  (46 lines)
app/src/lib/passwordPolicy.ts  (221 lines)
app/src/lib/selectionBridge.ts  (672 lines)
app/src/lib/testId.ts  (65 lines)
app/src/lib/useMediaQuery.ts  (53 lines)
app/src/lib/utils.ts  (26 lines)
app/src/main.tsx  (62 lines)
app/src/orbit/Shell.tsx  (224 lines)
app/src/orbit/components/DataNotice.tsx  (45 lines)
app/src/orbit/components/DocView.tsx  (55 lines)
app/src/orbit/components/Drawer.tsx  (59 lines)
app/src/orbit/components/bits.tsx  (112 lines)
app/src/orbit/ds/bundle.css  (318 lines)
app/src/orbit/ds/tokens.css  (174 lines)
app/src/orbit/lib/actions.ts  (79 lines)
app/src/orbit/lib/context.tsx  (25 lines)
app/src/orbit/lib/format.ts  (41 lines)
app/src/orbit/lib/icons.ts  (56 lines)
app/src/orbit/lib/loop.ts  (105 lines)
app/src/orbit/lib/markdown.ts  (99 lines)
app/src/orbit/lib/model.ts  (386 lines)
app/src/orbit/lib/nav.ts  (27 lines)
app/src/orbit/lib/notifications.ts  (57 lines)
app/src/orbit/lib/notify.ts  (6 lines)
app/src/orbit/lib/store.ts  (35 lines)
app/src/orbit/lib/useViewer.ts  (26 lines)
app/src/orbit/orbit.css  (1571 lines)
app/src/orbit/views/FeedbackBoard.tsx  (164 lines)
app/src/orbit/views/Home.tsx  (283 lines)
app/src/orbit/views/HomeStats.tsx  (96 lines)
app/src/orbit/views/Overlays.tsx  (12 lines)
app/src/orbit/views/PocPage.tsx  (127 lines)
app/src/orbit/views/Reader.tsx  (38 lines)
app/src/orbit/views/poc/ApprovalCard.tsx  (114 lines)
app/src/orbit/views/poc/ArtifactsTab.tsx  (107 lines)
app/src/orbit/views/poc/BranchMark.tsx  (216 lines)
app/src/orbit/views/poc/ChangesCard.tsx  (71 lines)
app/src/orbit/views/poc/HistoryTab.tsx  (98 lines)
app/src/orbit/views/poc/Journey.tsx  (144 lines)
app/src/orbit/views/poc/PhaseLoops.tsx  (139 lines)
app/src/routes/ForgotPassword.tsx  (121 lines)
app/src/routes/Login.tsx  (415 lines)
app/src/routes/UpdatePassword.tsx  (176 lines)
app/src/shadcn-tailwind.css  (114 lines)
app/src/vite-env.d.ts  (23 lines)
app/tsconfig.app.json  (38 lines)
app/tsconfig.json  (18 lines)
app/tsconfig.node.json  (24 lines)
app/vercel.json  (6 lines)
app/vite.config.ts  (370 lines)
app/vite/sdkImportMapBlock.ts  (97 lines)
app/vite/uaSdkRuntime.ts  (181 lines)
```

Hand-authored (the "Orbit" layer) = `app/src/App.tsx`, everything under `app/src/orbit/`, `app/src/data/orbit.ts`, `app/src/data/bindings.ts` (generated by provisioning). Everything else is the Code Builder template or engine scaffolding (see section 7).

## 2. Screens / routes

Router (`app/src/App.tsx`): `BrowserRouter` with the engine basename block. Routes:

| Route | Component | Notes |
|---|---|---|
| `/login`, `/forgot-password`, `/update-password` | `routes/Login.tsx`, `ForgotPassword.tsx`, `UpdatePassword.tsx` | Unmodified template auth pages (shadcn + lucide, platform identity-provider hooks). Outside the Orbit shell. Not Orbit-styled. |
| `/` | `orbit/views/Home.tsx` | POC list |
| `/waiting` | redirect to `/` | |
| `/pocs/:pocId` | `orbit/views/PocPage.tsx` | `:pocId` is the POC's `poc_id` (URL-encoded); matched against `poc_id` or the record id |
| `/feedback` | `orbit/views/FeedbackBoard.tsx` | |
| `*` (inside the shell) | Home | |

All Orbit routes sit inside `OrbitProvider` (loads all five objects once as one snapshot, the viewer and the actions) and `Shell`.

### Shell (every Orbit route) `orbit/Shell.tsx`

Regions in order, left to right:
1. **Rail** (`nav.ps-rail.ob-rail`, 236px wide, 68px collapsed, 60px icon-only under 760px): UnifyApps lockup image (mark image when collapsed), label "POC Studio", nav item "POCs" (icon `grid`, count badge = POCs waiting on the viewer's approval, "hot" style), nav item "Feedback" (icon `msg`, count badge = feedback with status `open`), Collapse toggle at the bottom. STATIC: all labels and logos. BOUND: the two counts (`orbit_studio_poc` + `orbit_studio_feedback`).
2. **Header** (`header.ps-top`, transparent, hairline underline): breadcrumb ("POCs" / "{client}" on a POC page, else "POCs" or "Feedback"), spacer, **Bell** (notification popover), signed-in person (avatar initials + name, from the platform user context `useGetApiUserContext`, not from an object).
3. **Main** (`main.ob-main` > `.ob-page`, max-width 1240px, padding 28/28/56).
4. **Overlays**: the document Reader drawer (state-driven, not a route).

Bell: lists approvals on POCs the viewer owns (activity rows of type `manager_approved`, `owner_approved`, or `gate_decided` with decision `approve`; max 20, newest first), unseen count badge, and fires up to 3 `toast.success` for new manager approvals. BOUND: `orbit_studio_activity` + `orbit_studio_poc`. Seen/toasted marks are kept in `localStorage` per viewer (`orbit-notes-seen:<email>`, `orbit-notes-toasted:<email>`).

### `/` Home (`views/Home.tsx`, `HomeStats.tsx`)

Regions in order:
1. Page head: micro greeting ("Good morning/afternoon/evening, {first name}", chosen by local hour) STATIC logic + BOUND name from platform user; display title "POC *journeys*" (italic accent on "journeys"); sub line "Every POC and where it stands in its journey." STATIC.
2. `DataNotice` (one line if a refresh failed, with Retry, or "Showing the first 600 records of each kind.").
3. **Stat tiles** (4): "Active POCs" (count of live POCs; sub "{n} building"), "Waiting at a gate" (button, toggles the `gate` filter; sub "Longest: {client}" from the oldest `gate_posted` activity, else "None waiting"), "Blocked" (button, toggles the `blocked` filter; sub "Nothing blocked" / "Each has a reason noted" / "{n} with no reason noted"), "Open feedback" (button, goes to `/feedback`; sub "{n} high severity"). All BOUND (`orbit_studio_poc`, `orbit_studio_activity`, `orbit_studio_feedback`), derived in the browser.
4. **Toolbar**: segmented status filter [All, Waiting on you, Waiting on approval, Building, Blocked, Demo-ready] each with a count; spacer; Phase select (Any, Understand, Plan, Build, Deliver); Owner select (Anyone + distinct `owner_name`); "Clear all" when any filter is on. Filters and sort live in the URL query: `status`, `phase`, `owner`, `sort` (`poc`|`journey`|`status`|`last`), `dir` (`asc`|`desc`). Default sort `status` ascending.
5. **Table** (`table.tbl.ob-ptable`), one row per POC, row is clickable and keyboard operable (Enter): columns POC (client tile with initials + client name + use case), Journey (MiniRail of 4 phase bars with 3 gate pips + a label like "Build · approval"), Status (tag), Owner, Manager, Last activity (text + date). Sortable headers: POC, Journey, Status, Last activity. All BOUND to `orbit_studio_poc` (fields listed in section 3).
6. Footer count "{n} POC(s)". States: loading ("Loading POCs..."), load error with Retry, empty ("No POCs yet", "A POC appears here once it is started from Slack."), no match ("No POCs match these filters" + Clear all).

### `/pocs/:pocId` POC page (`views/PocPage.tsx` + `views/poc/*`)

Regions in order:
1. **PocHeader**: large client tile (initials, tone from a hash of the name), h1 "{client} . {use_case}", "Waiting on you" tag when the viewer is the manager and the gate is open, meta line "Manager X . Started by Y . Started {date}". BOUND `orbit_studio_poc`.
2. **ApprovalCard** (`ps-banner`): one of five banners: Demo-ready . complete (green), Blocked . {phase} (shows `blocked_on`), Stopped . {phase}, Building . {phase} (shows `last_activity`), or "{Phase} is waiting on approval" with `gate_summary`, two approval chips (Owner: "Approved in Slack" / "Waiting in Slack"; Manager: "Approved" / "Waiting"), a note "The details for this stage are below. Suggestions go in {slack_channel}.", and the **Approve {Phase}** button (only for the POC's manager). BOUND `orbit_studio_poc`.
3. **Journey** (`section.ob-journey`): grid of 4 phase cards (Understand "What the client needs", Plan "What we will build", Build "Make it work", Deliver "Get it demo-ready") with 3 gate diamonds between them (G1, G2, G3; Deliver has no approval gate). Each card shows a status tag (Approved/Complete, Building, Waiting on {owner and manager}, Blocked, Stopped) and tints by state. Clicking a card selects that phase in the Artifacts tab and smooth-scrolls to it. Under each card with iterations: a centred chip "N iterations" with loop icon and chevron, joined to the card by a short hairline; hover shows a tooltip previewing the latest iteration; click opens ONE shared full-width panel below all cards (caret under the chip, newest first, "Latest" pill, row click expands the full text; Esc closes). STATIC: phases, descriptions, gate labels. BOUND: card states from `orbit_studio_poc`; chips and panel from `orbit_studio_iteration`.
4. **ChangesCard** ("Changes during the journey" + count, collapsed by default, hidden when none): rows grouped by phase, each with avatar (person initials or AI mark), title, reason, source tag (person name + "Slack", or Nebula/Judge), skill code, date. BOUND `orbit_studio_iteration`.
5. **Tabs card**: tabs **Artifacts** | **History**.
   - Artifacts: segmented [All, Understand, Plan, Build, Deliver] with counts; document rows (type label with format icon, name, "{stage} . {date}", chevron or external icon). Rules: a done phase lists its pack documents; the current phase lists only input-type documents under an "in session" empty state; a future phase says it has not started. Row click opens the Reader drawer (or opens the link in a new tab for link-only docs). BOUND `orbit_studio_document`.
   - History: the POC's activity newest first grouped by day (Today / Yesterday / weekday), avatar with event-kind badge, "{actor} {message}" and time. BOUND `orbit_studio_activity`.
6. **Reader drawer** (`views/Reader.tsx`, `components/Drawer.tsx`, `DocView.tsx`): right drawer, wide, title = document name, meta = type tag + "{client} . {stage} . {date}" + "v{n}" when version > 1. Body by format: `markdown` (rendered by an in-house escaping renderer `lib/markdown.ts`), `html` (sandboxed iframe with no scripts), `link` (summary + "Open {type}" external button). Esc, scrim click or X closes. BOUND `orbit_studio_document` (`content`, `file_link`, `summary`).
   Not found state: "This POC isn't here" with a "Back to POCs" button.

### `/feedback` Feedback board (`views/FeedbackBoard.tsx`)

Regions in order: page head ("Feedback", "Changes asked for the POC-builder skills, grouped by the skill they affect."); DataNotice; status segmented filter [All, New, Under review, Incorporated, Not incorporated, plus any other code found in data] with counts; list of **skill groups**, one per distinct `target_skill` (blank = "No skill named"), each a sticky summary card (skill name, counts: feedback / open / incorporated) beside a stack of feedback articles (status tag, "{client} . {phase}" code chip, ticket number chip, the quote, key/value rows Skill / Change needed / Change made or Why not, byline "given by . date . reviewed by . closed date"). Read-only. BOUND `orbit_studio_feedback` (+ `orbit_studio_poc` to resolve client name). States: loading, error, "No feedback yet", "No {status} feedback" + Show all.

STATIC vs BOUND summary: there is NO mock data in the source. `src/data/seed.ts` is the untouched template placeholder (an `Item` type with one example row) and is imported by nothing. Every record on screen is BOUND to the five `orbit_studio_*` objects through the Storage dataSources. STATIC = labels, headings, the phase/stage/gate model, label maps for codes, empty-state copy, icons, tone logic.

## 3. Data needs (entities the UI implies, exact from the live object definitions and the TypeScript types)

Common conventions: every record also carries platform stamps `id`, `createdTime`, `modifiedTime` (the app flattens `properties.*` and keeps those three; it strips them before writing). All dates are **epoch milliseconds integers**. `poc` on child records is a foreign key (`ENTITY_ID:orbit_studio_poc`) holding the parent's `poc_id` string (the app also tolerates the record id). Schema validation is on; an enum or lookup refuses `""` or null, so empty values must be omitted. `[Example] ` / `[Test] ` prefixes on `client_name` are stripped for display.

Create order (foreign keys): poc, then document, then feedback / activity / iteration.

### 3.1 `orbit_studio_poc` ("Orbit · POC", plural "Orbit · POCs"), pk/unique/name-field mapping: pk `poc_id`, nameField `client_name`, searchable poc_id, client_name, use_case; custom index `idx_status` (properties.status asc)

| field | type | notes |
|---|---|---|
| poc_id | string | PK, unique. Pattern `POC-<client-slug>-<yyyymmdd>`, client-sent |
| client_name | string | required, nameField |
| client_slug | string | required |
| use_case | string | required |
| brief | textarea | |
| tier | enum | required: `express` "Express (3 days)", `standard` "Standard (7 days)", `full` "Full (14 days)". NOT read by the UI |
| owner_name | string | required |
| owner_email | string | |
| approvers | string | comma-separated emails. NOT read |
| started_by | string | required |
| started_at | integer epoch date-time | required |
| demo_date | integer epoch date | NOT read |
| stage | enum | required, 9 values: `0_kickoff` "Kickoff", `1_signal_capture` "Signal capture", `2_research_assess` "Research & assess", `3_scope` "Scope the demo", `4_design_system` "Design system", `5_build` "Build with Nebula", `6_finalize` "Finalize", `7_collaterals` "Collaterals", `8_demo_ready` "Demo-ready" |
| current_gate | enum | required, default `none`: `none`, `g1` "G1 . Scope check", `g2` "G2 . Design check", `g3` "G3 . Build sign-off", `g4` "G4 . Release" |
| g1_status, g2_status, g3_status, g4_status | enum | required, default `pending`: `pending`, `waiting`, `approved`, `changes_requested` |
| status | enum | required, default `running`: `running`, `waiting`, `blocked`, `stopped`, `demo_ready` |
| blocked_on | string | |
| slack_channel | string | |
| watch_email | string | NOT read |
| last_activity | string | one-line text |
| last_activity_at | integer epoch date-time | |
| documents_count, open_feedback_count | integer | NOT read |
| tenant_host | string | NOT read |
| manager_name, manager_email | string | the manager who approves gates in the app |
| g1_owner_approved .. g4_owner_approved | boolean | owner's approval, given in Slack |
| g1_manager_approved .. g4_manager_approved | boolean | manager's approval, given in the app |
| gate_summary | textarea | summary for the currently open gate |
| g1_summary .. g4_summary | textarea | titled "Understand/Plan/Build/Deliver summary"; read into `gates[g].summary` |

Required: poc_id, client_name, client_slug, use_case, tier, owner_name, started_by, started_at, stage, current_gate, g1_status..g4_status, status. TS type `Poc` (orbit/lib/model.ts) holds `gates: Record<'g1'|'g2'|'g3'|'g4', {status, owner, manager, summary}>` and `_raw` (the flat record, re-sent whole on update).

Derived rules the UI relies on (must stay true in the new data): `stage` maps to a phase (kickoff, signal_capture, research_assess = understand; scope, design_system = plan; build, finalize = build; collaterals, demo_ready = deliver); a POC is demo-ready when `status = demo_ready` or `stage = 8_demo_ready`; the open gate is `current_gate` unless it is `none` or `g4` or demo-ready (g4 only files Deliver's artifacts and is never approved or shown); a gate passes when both owner and manager are approved.

### 3.2 `orbit_studio_document` ("Orbit · Document"); pk `document_id`, nameField `name`; index `idx_poc` (poc asc)

| field | type | notes |
|---|---|---|
| document_id | string | PK. Pattern `<poc_id>__<stage>__<name-slug>__v<n>` |
| poc | FK to orbit_studio_poc (string) | required |
| name | string | required, nameField |
| type | enum | required, 20 values: `brief`, `input`, `requirements`, `scope`, `email`, `brd` "BRD", `design_system` "Design system", `build_report` "Build report", `app`, `evidence_pack` "Evidence pack", `demo_script` "Demo script", `deck`, `video`, `use_case` "Use case", `design`, `automation`, `object`, `agent` "AI agent", `walkthrough`, `poc_link` "POC app link" |
| stage | enum | required, the 9 stage codes above |
| gate_pack | enum | default `none`: `none`, `g1`..`g4` |
| version | integer | required, latest version per (poc, stage, name) is shown |
| status | enum | required: `draft`, `in_review`, `approved`, `final`, `superseded` (superseded hidden) |
| summary | string | |
| content | textarea | Markdown, or HTML when format = html |
| file_link | string | URL |
| path_in_build_session | string | NOT read |
| size_bytes | integer | NOT read |
| file | object (file-uploader) | NOT read |
| created_by | string | required |
| saved_at | integer epoch date-time | required |
| format | enum | `markdown`, `html`, `link`; missing means markdown, or link when only file_link is set |

Input-type documents (`input`, `brief`, `email`, `requirements`) belong to the phase of their stage; all others to the phase of their gate pack.

### 3.3 `orbit_studio_feedback` ("Orbit · Feedback"); pk `ticket_no`, nameField `title`; index `idx_poc_status` (poc, status)

| field | type | notes |
|---|---|---|
| ticket_no | string | PK. Pattern `FB-<n>` |
| poc | FK to orbit_studio_poc | required |
| client_name | string | |
| poc_stage | enum | the 9 stage codes |
| gate | enum | default `none`, `g1`..`g4` |
| related_document | FK to orbit_studio_document | NOT read |
| quote | textarea | |
| title | string | required, nameField |
| feedback | textarea | required |
| category | enum | required: `process`, `output`, `skill`, `ux`, `bug`, `other`. NOT read |
| severity | enum | required: `low`, `medium`, `high` (unknown reads as medium) |
| channel | enum | required, default `app`: `app`, `gate`, `slack`, `email`, `session`. NOT read |
| channel_ref | string | NOT read |
| target_skill | string | grouping key on the Feedback page |
| parent_ticket | string | NOT read |
| status | enum | required, default `open`: `open` "New", `in_review` "Under review", `resolved` "Incorporated", `not_incorporated` "Not incorporated" (the UI also tolerates other codes, shown through `readableCode`) |
| action_taken | textarea | |
| reviewed_by | string | |
| given_by_name | string | required |
| given_by_email | string | NOT read |
| created_at | integer epoch date-time | required |
| resolved_at | integer epoch date-time | |

### 3.4 `orbit_studio_activity` ("Orbit · Activity"); pk `activity_id`, nameField `message`; index `idx_poc_created` (poc asc, created_at desc)

| field | type | notes |
|---|---|---|
| activity_id | string | PK. Pattern `ACT-<epoch>-<n>`; the app generates `ACT-{Date.now()}-{0000..9999}` |
| poc | FK to orbit_studio_poc | required |
| type | enum | required, 15 values: `poc_started`, `stage_started`, `stage_completed`, `document_saved`, `gate_posted`, `gate_decided`, `feedback_created`, `feedback_reviewed`, `input_added`, `nudge_sent`, `poc_stopped`, `poc_restarted`, `owner_approved`, `manager_approved`, `iteration_logged` ("Change made") |
| stage | string (free text, not an enum) | |
| gate | enum | `none`, `g1`..`g4` |
| decision | enum | `approve`, `request_changes`, `stop` |
| actor_type | enum | required: `ai`, `person`, `system` |
| actor_name | string | required |
| actor_email | string | |
| message | string | required, nameField; History prints "{actor} {message}" |
| note | textarea | NOT read |
| related_document, related_ticket | string | NOT read |
| posted_to | string | written by the app on approval (the POC's slack channel) |
| created_at | integer epoch date-time | required |

### 3.5 `orbit_studio_iteration` ("Orbit · Iteration"); pk `iteration_id`, nameField `title`; index `idx_poc_created`

| field | type | notes |
|---|---|---|
| iteration_id | string | PK. Pattern `ITR-<epoch>-<n>` |
| poc | FK to orbit_studio_poc | required |
| phase | enum | required: `understand`, `plan`, `build`, `deliver` (a record with another value is dropped by the UI) |
| source | enum | required: `nebula`, `judge`, `person` (labels Nebula, Judge, Person; unknown codes shown readable) |
| actor_name | string | required |
| actor_email | string | |
| title | string | required, nameField |
| reason | textarea | shown as the iteration's text; falls back to `title` |
| skill | string | |
| related_document, related_ticket | string | NOT read |
| slack_ref | string | Slack permalink; non-empty adds "Slack" to a person's tag |
| created_at | integer epoch date-time | required |

Iterations are numbered 1, 2, 3 across the whole POC in creation order (`branchesOf`), then grouped by `phase`.

**Number of entities implied by the UI: 5** (poc, document, feedback, activity, iteration). Seven further "entities" exist only in code as closed vocabularies: stages (9), phases (4), gates (g1..g4), POC status (5), gate status (4), doc status (5), doc format (3).

### Closed sets and label maps declared in code (copy these into the new app's label maps)

- Phases (`orbit/lib/loop.ts`): understand "Understand" ("What the client needs", gate g1), plan "Plan" ("What we will build", g2), build "Build" ("Make it work", g3), deliver "Deliver" ("Get it demo-ready", g4).
- Stage display names (`STAGES`): Kickoff, Signal capture, Research and assess, Scope, Design system, Build, Finalize, Collaterals, Demo-ready.
- Statuses shown as tags (`statusOf`): Demo-ready (positive), Blocked (negative), Stopped (neutral), Waiting on you / Waiting on owner and manager / Waiting on owner / Waiting on manager / Waiting on approval (attention), Building (brand).
- Home status filter keys: all, mine, gate, building, blocked, done.
- Feedback status tones: open = attention + msg icon, in_review = brand + eye, resolved = positive + check, not_incorporated = neutral + x.
- Activity kind icons (History): poc_started plus, stage_started layers, stage_completed check (pos), document_saved file, input_added upload, gate_posted pause-c (att), gate_decided/manager_approved/owner_approved check (pos), iteration_logged loop (acc), feedback_created/feedback_reviewed msg, poc_stopped stop (neg), poc_restarted play.
- Doc type labels: brief Brief, input Input, requirements Requirements, scope Scope, email Email, brd BRD, design_system Design system, build_report Build report, app App, evidence_pack Evidence pack, demo_script Demo script, deck Deck, video Video, use_case Use case, design Design, automation Automation, object Object, agent AI agent, walkthrough Walkthrough, poc_link POC app link.
- Why labels are in code: a deployed app cannot read an object's picklist titles (only the Storage fetch binding is allowed), so every code needs its label declared in the app.

## 4. Actions (every button / CTA / handler)

| Where | Control | What it does today |
|---|---|---|
| Rail | POCs / Feedback | navigate to `/` or `/feedback` (POCs also lit on a POC page) |
| Rail | Collapse / Expand | UI state, stored in `localStorage` key `orbit-nav-collapsed` |
| Header | Breadcrumb "POCs" link | navigate home |
| Header | Bell | opens notifications popover; marks all as seen; click a note opens that POC; Esc / outside click closes |
| Home | Status segmented filter, Phase select, Owner select, Clear all | set URL query params (`status`, `phase`, `owner`) |
| Home | Stat tiles "Waiting at a gate", "Blocked" | toggle the `gate` / `blocked` status filter |
| Home | Stat tile "Open feedback" | navigate to `/feedback` |
| Home | Sortable headers POC / Journey / Status / Last activity | set `sort` and `dir` in the URL |
| Home | Table row (click or Enter) | navigate to `/pocs/{poc_id}` |
| Any list | Retry (DataNotice / LoadError) | re-fetch all five objects |
| POC page | Phase card | selects the phase in the Artifacts tab and smooth-scrolls to the tabs card |
| POC page | "N iterations" chip | click toggles the shared panel for that phase (one open at a time); hover shows a latest-iteration tooltip; Esc closes and returns focus to the chip |
| POC page | Iteration row | expands / collapses its full text |
| POC page | "Changes during the journey" header | expands / collapses the card |
| POC page | Tabs Artifacts / History; artifact phase segmented control | UI state only |
| POC page | Document row | opens the Reader drawer; a link-only document opens its URL in a new tab |
| Reader | X, scrim, Esc | close; "Open {type}" link button opens `file_link` in a new tab |
| POC page | **Approve {Phase}** (primary button) | **The only write in the app.** Shown only when the viewer is the POC's manager (matched by email, full name, or first name against `manager_email` / `manager_name`) and a gate is open. Does: (1) UPDATE `orbit_studio_poc` with the whole record plus `gN_manager_approved = true`; if the owner has already approved (`gN_owner_approved`), also `gN_status = approved`, `current_gate = none`, `stage = first stage of the next phase` (or `8_demo_ready`), `status = running` (or `demo_ready` after the last gate), and always `last_activity` / `last_activity_at` ("{who} approved {Phase} . {NextPhase} starts" or "... . waiting on {owner} in Slack"); (2) CREATE one `orbit_studio_activity` row (`type` `gate_decided` when the gate passed, else `manager_approved`; `decision` approve; `actor_type` person; actor name / email from the platform user; `message` as above; `posted_to` = `slack_channel`). Toasts: success "{Phase} approved" / "Your approval of {Phase} is saved", warning if the activity row fails to save, error if the POC write fails. No callable or automation is involved; both writes go straight to the objects through the Storage dataSources. |
| Feedback | Status segmented filter, "Show all" | UI state only |

Not present in the source (do not expect them): Build, Send back / Request changes, Add comment, Create POC, Reject, any sign-out or user menu. POCs are created from Slack; the owner approves in Slack; the Feedback page is read-only. A POC's `stop`/`blocked` states are shown, never set, by the app.

## 5. Design tokens

**Does it already follow Design Language v3.4?** Yes, structurally. `app/src/orbit/ds/bundle.css` is headed "UnifyApps . POC Studio . Design Language v3.4 ported to the UnifyApps brand" and `app/src/orbit/ds/tokens.css` is "GENERATED from the UnifyApps . POC Studio design system (tokens.json)". It uses v3.4's tonal surfaces (`--inner`, `--glass-1/2/3`, `--glass-solid`, hairlines `--hair`/`--hair-2`, `--edge` and `--lift-1/2` shadows), the unprefixed kit classes (`.tile`, `.solid`, `.tag`, `.seg`, `.tbl`/`.tblwrap`, `.btn .btn-p/.btn-s/.btn-t`, `.micro`, `.display`, `.accent-i`, `.empty`, `.tabs`/`.tab`, `.toolbar`, `.crumb`, `.av`), the `ps-` component classes (the prefix is `ps-` = POC Studio, NOT `ds-`: `ps-rail`, `ps-nav-item`, `ps-top`, `ps-banner`, `ps-mini`, `ps-skill`, `ps-fb`, `ps-drawer`, `ps-scrim`, `ps-tip`, `ps-iconbtn`, plus unused `ps-loop`, `ps-life`, `ps-agent`, `ps-modal` etc.), and the **gradient nav rail** (`.ps-rail`: `linear-gradient(199deg, --nav-1 1.43%, --nav-2 35.22%, --nav-3 70.99%)`, dark forest green with cream text and a bronze active marker). The app's own layer is `orbit.css` with `ob-` classes, which only uses tokens. The palette is the UnifyApps POC Studio port (cream, forest green, bronze), not a client colourway and not the UnifyApps blue.

**Colours (light, `:root`)**
- Ground `--base` #f8f4ee (cream); page tint rgba(41,70,27,.022); surfaces: `--glass-1` rgba(255,255,255,.72), `--glass-2` .82, `--glass-3` .93, `--glass-solid` rgba(255,255,255,.965), `--inner` rgba(41,70,27,.045); hairlines `--hair` rgba(15,20,12,.07), `--hair-2` .12.
- Ink: `--ink` #0f140c, `--ink-2` #4e5849, `--ink-3` #667061, `--ink-mute` #9a9b86.
- Brand green: `--brand` #4a7c30, `--brand-deep` #29461b, `--brand-tint` rgba(74,124,48,.10); button/fill gradient `--fill-1` #4e582d, `--fill-2` #2e3f1a, `--fill-3` #0f2805, `--on-fill` #ffffff; focus #4a7c30 with halo rgba(74,124,48,.18).
- Bronze accent: `--accent` #857242, `--accent-soft` #b39f6e, `--accent-text` #6a5a32, `--accent-tint` rgba(132,115,71,.12).
- Status: neutral #4e5849, attention #9f4e07, negative #94322a, positive #276e5f (each with a ~.10 to .11 alpha tint); positive fills #358978 to #276e5f.
- Charts (green ramp): #203715, #355923, #497b30, #5e9f3e, #86b26f, #accb9d.
- Rail: `--nav-1` #324223, `--nav-2` #012a00, `--nav-3` #071a05; ink `--nav-ink` #ede6d7 (80% / 64% variants), `--nav-mark` #b3a378, hover rgba(237,230,215,.08), active .14, line .12. Tooltip bg #0f140c on #f8f4ee text. Scrim rgba(15,20,12,.36).
- Aurora ambient layers (`--aurora-1..3`) and `.amb` rules exist in the CSS but no component renders an `.amb` element.
- The only raw hex typed in `orbit.css` is in a comment (#806f44). No hex in TSX.

**Dark mode**: tokens exist (`:root[data-theme="dark"]`: base #202117, ink #e0e1d2, brand #8fb87a, accent #baa571, glass-solid #3e3e2d, etc.), but it is NOT wired: `Shell.tsx` forces `document.documentElement.dataset.theme = 'light'` on mount and there is no toggle (icons `moon`/`sun` exist unused). The template's `.dark` class tokens in `index.css` are neutral grey and unused. Effectively light-only; dark would have to be switched on.

**Fonts**: `--font-serif` Spectral (300/400/500/600 + italics) for ALL text including UI (the shadcn `--app-font-sans` is remapped to serif); `--font-mono` IBM Plex Mono (400/500/600) for micro labels, table heads, counters, times. Both loaded from Google Fonts in `index.html`. Geist is also loaded by the template `ua:theme-font` block but overridden. Type scale (px / line-height / weight): display 34 / 1.12 / 400 (page h1) , title 19 / 1.3 / 600, body 15 / 1.6 / 400, small 13 / 1.45, micro 11 mono 600 uppercase tracking .09em, table head 10.5 mono.

**Radius / spacing / motion**: `--r` 10px, `--r-sm` 6px, `--r-pill` 999px, `--r-shell` 28, `--r-canvas` 22, `--r-sheet` 16, `--r-tile` 12. Spacing tokens 4, 6, 8, 10, 12, 14, 16, 18, 22, 28 px. Motion `--ease` 150ms cubic-bezier(.22,.7,.28,1); reduced-motion respected globally.

**Layout**: full-height CSS grid `236px | 1fr` (68px collapsed, 60px under 760px, with labels hidden); right column = header (min-height 60px, transparent, hairline bottom) over a scrolling main; page content max-width 1240px centred. Stat tiles 4 columns (2 under 900px). Journey grid: 4 flexible cards (min 128px) with 44px gate columns (30px under 1280px); min width 600px then horizontal scroll. Drawer slides from the right over a scrim.

**Icons**: NOT lucide in the Orbit screens. A hand-written inline-SVG set of 53 line icons (24px grid, stroke 1.6, round caps) in `orbit/lib/icons.ts`, rendered by `<Icon name size>` (14 / 16 / 20px). Lucide-react is used only by the template auth pages and shadcn primitives.

**Logos / assets**: `src/assets/unifyapps-lockup-reversed.png` (expanded rail), `unifyapps-mark-reversed.png` (collapsed rail), `public/unifyapps-app-32.png` (favicon), template leftovers `hero.png`, `vite.svg`, `public/icons.svg`. Avatars: initials on 6 tone classes (`ob-tone-0..5`, picked by a hash of the name); AI actors get a square spark mark.

**shadcn bridge**: `orbit.css` re-points the template's shadcn variables (`--background`, `--foreground`, `--card`, `--primary` = `--fill-2`, `--border`, `--ring`, status subtles, etc.) to the design tokens, so any shadcn primitive (only `Tooltip` and `Sonner` toaster are used) inherits the look.

## 6. Bindings and callables

`app/src/data/bindings.ts` (GENERATED by `provision_data_sources`, "do not edit the ids or storedInputs"):
- `ENTITY` (as const): `orbitPoc: 'orbit_studio_poc'`, `orbitDocument: 'orbit_studio_document'`, `orbitFeedback: 'orbit_studio_feedback'`, `orbitActivity: 'orbit_studio_activity'`, `orbitIteration: 'orbit_studio_iteration'`.
- Five object-agnostic Storage dataSource bindings (the object is chosen per call by `object_type`), resource `storage_by_unifyapps`:
  - `FETCH` id `e_6ad1044bfdf8d85093c1ca1f` (`storage_by_unifyapps_fetch_records`, MULTIPLE, includeTotalCount; overridable: object_type, triggerInputCondition, page, sortBy, searchField) , used for all reads.
  - `FETCH_ONE` id `e_6ad1044bfdf8d85093c1ca22` (SINGLE fetch), defined, not used.
  - `CREATE` id `e_6ad1044be0ef8b24527eabcf` (`..._create_record`, raw payload) , used to log Activity.
  - `UPDATE` id `e_6ad1044be0ef8b24527eabd2` (`..._update_record_by_id`, raw payload, upsert false) , used to update a POC on approval.
  - `DELETE` id `e_6ad1044be0ef8b24527eabd5` (`..._delete_record_by_id`), defined, wrapped by the template, not used.
- Helpers: `pageInput`, `FilterOperator`, `andFilter`, `gt/gte/lt/lte`, `extractPage/extractRecords/extractRecord`, `toPayload` (strips id/createdTime/modifiedTime before a write).

`app/src/data/orbit.ts` (the app's one data module): `OBJECTS` map, `usePaged` (reads up to 3 pages of 200 per object, next page only when the previous came back full, so max 600 records per object; shows a "first 600" notice), `useOrbitPocs/Documents/Feedback/Activity/Iterations`, `useOrbitData()` (one snapshot; `ready` waits for the first four, iterations load independently), `useOrbitWrites()` with `updatePoc` and `logActivity`. Row-to-type converters `toPoc`, `toDoc`, `toFb`, `toAct`, `toIteration` default every missing value (strings to "", numbers to 0, status to a default) and fall back to `createdTime`/`modifiedTime` for `started_at`, `saved_at`, `created_at`, `last_activity_at`.

Callables / automations: **none**. There is no `callables.ts`; `useData`'s `'callable'` kind is a template stub that returns nothing. The solution links no automation. No AI agent, no connection.

Env (`app/.env`, names only; all three are "managed by agent-platform, refreshed on build"): `API_PROXY_TARGET` (the tenant origin, https://orbit.uat.unifyapps.com), `VITE_APPLICATION_ID`, `APP_AUTH_TOKEN`. Values not copied here.

Platform hooks used: `useGetApiUserContext({ includeRoles: true })` (the viewer, from `@unifyapps/app-builder-sdk/hooks/user`), `useExecuteWorkflowNode` / `useExecuteWorkflowNodeMutation` (inside `src/lib/data.ts`, template), `useIdentityProviders` / `useIdentityProviderLogin` (auth pages).

package.json deps: react 19.2, react-dom, react-router-dom 7.17, `@unifyapps/app-builder-sdk` ^0.6.0, `@tanstack/react-query` 5, zustand 5, tailwindcss 4.3 (+ `@tailwindcss/vite`), radix-ui 1.5, class-variance-authority, clsx, tailwind-merge, tw-animate-css, cmdk, lucide-react, sonner, date-fns, recharts 3.8 (unused by Orbit), next-themes (only in the template toaster), i18next + react-i18next (template; one language, `languages.json` = en only, so the app is not translated; `I18nProvider` stays mounted because it owns `<html lang/dir>` and the formatters `useFormatters()` used for every date, number, relative time and sort). Dev: vite 8, typescript 7 rc, oxlint. Build script: `tsc -b && oxlint -A correctness src && vite build`. Package manager bun.

Template rules in `.agents/rules/project-guidelines.md` (78 long lines): `@/` alias; never edit `main.tsx` or `vite.config.ts`; keep the APPLICATION_ID/basename block in `App.tsx`; data only through `useData` wrappers in `src/data/`; no raw hex or inline styles in TSX (tokens only); no enums (use `as const`); no persona switchers; typed `toast.success/error/warning`; English-only apps write strings inline; closed-set labels declared once beside the set.

## 7. Clone notes

**Engine-owned or template files: do NOT copy into the new app** (the new app gets its own from Code Builder): `app/src/main.tsx`, `app/vite.config.ts`, `app/vite/*` (`sdkImportMapBlock.ts`, `uaSdkRuntime.ts`), `app/src/lib/selectionBridge.ts`, `app/scripts/*`, `.githooks/*`, `app/.env` (engine-written, holds a per-app `APP_AUTH_TOKEN` and `VITE_APPLICATION_ID`), `app/bun.lock`, `app/tsconfig*.json`, `app/components.json`, `app/.oxlintrc.json`, `app/vercel.json`, `app/i18next.config.mjs`, `app/src/i18n/*`, `app/src/lib/*` (data.ts, i18n, utils, passwordPolicy, testId, useMediaQuery), `app/src/data/index.ts`, `app/src/components/ui/*`, `app/src/components/copilot.tsx` and `artifacts.tsx` (template, referenced by nothing), `app/src/routes/Login.tsx` / `ForgotPassword.tsx` / `UpdatePassword.tsx`, `app/src/index.css`, `app/src/shadcn-tailwind.css`, `app/index.html` (copy only its font links), `README.md`, `app/README.md`, `PRODUCT.md` (refers to a `PLAN.md` that is not in the checkout), `.agents/rules/project-guidelines.md`, and the bridge-created `.git` folder. Also template-only: `app/src/data/seed.ts` (placeholder `Item`), `src/assets/hero.png`, `vite.svg`.

**App-authored files worth reading as a reference** (not copying blindly): `app/src/App.tsx` (the `basename` block must stay as generated), `app/src/orbit/**`, `app/src/data/orbit.ts`.

**Source ids and names that must be rewired in any copy**
1. `app/src/data/bindings.ts`: the five dataSource ids (`e_6ad1044bfdf8d85093c1ca1f`, `...ca22`, `e_6ad1044be0ef8b24527eabcf`, `...abd2`, `...abd5`) belong to the source app; the new app needs its own provisioned bindings. The `ENTITY` map holds the object ids `orbit_studio_*`; the new objects will have their own ids (and the source names `orbit_poc`/`orbit_feedback` were already taken on this tenant, so expect id collisions; pick fresh ids).
2. `app/src/data/orbit.ts`: `OBJECTS` is built from `ENTITY`; `LOOKUPS = ['poc','related_document']`; field names throughout `toPoc`, `toDoc`, ... and `actions.ts` (`${g}_manager_approved`, `${g}_status`, `current_gate`, `stage`, `status`, `last_activity`, `last_activity_at`, activity `type` strings `gate_decided` / `manager_approved`) must match the new object schemas exactly, or the screens read blanks and the write is rejected (`additionalProperties: false`, full-record replace on update).
3. Brand strings: `Shell.tsx` (`document.title = 'Orbit . POC Studio'`, rail label "POC Studio", lockup and mark images), `index.html` `<title>` and favicon, empty-state copy ("started from Slack"), `FeedbackBoard` subtitle ("POC-builder skills"), the Home heading ("POC journeys"), stage and phase names in `loop.ts`. `localStorage` keys `orbit-nav-collapsed`, `orbit-notes-seen:*`, `orbit-notes-toasted:*` are harmless to keep.
4. Viewer matching: "Waiting on you", the Approve button and the bell depend on `manager_email` / `manager_name` / `owner_*` matching the signed-in platform user (email, full name, or first name). Seed rows need a real test user's email or name in `manager_*` / `owner_*`, or those states never show.
5. Seed data in the source carries `[Example] ` prefixes on `client_name`; the UI strips them. Row counts in the source objects were not read.
6. Gate wait time depends on `gate_posted` activity rows; without them the wait falls back to `last_activity_at`.
7. Foreign keys: `poc` on document / feedback / activity / iteration references `orbit_studio_poc`; feedback `related_document` references document. Seed the POC first.
8. Direct-write design: the only mutation is approve-by-update plus an activity insert, with no automation. Any clone that keeps "Approve" needs the same Storage UPDATE / CREATE dataSources on its own objects and the full flat record kept (`_raw`) for the update.

**Dead code in the source** (safe to drop): `views/poc/BranchMark.tsx` (older numbered-circle popover, imported by nothing; its CSS block `orbit.css` lines ~712 to ~910 is mostly dead, but `.ob-branch-n` is still used by the iterations panel), unused `ps-*` bundle classes (`ps-loop`, `ps-life`, `ps-agent`, `ps-modal`, `ps-choice`, ...), `FETCH_ONE` / `DELETE` bindings, aurora `.amb` layers, `recharts`.

**Stability warnings**: another person edits this app; head moved from the deployed v5 (`86cd9ddf...`) to `91ab370a...` and may move again. The head's own message says it was built but not opened in a preview, so the newest visual (centred "iterations" chip with connector and caret) is unverified by its author. `test ids` (`data-test-id` on the iterations chip, tooltip, panel, box, list and rows: `journey-loops-<phase>`, `journey-loops-chip-<phase>`, `journey-loops-tip-<phase>`, `journey-loops-panel`, `journey-loops-box`, `journey-loops-list`, `journey-loop-<id>`, `journey-loop-row-<id>`) exist for tests.
