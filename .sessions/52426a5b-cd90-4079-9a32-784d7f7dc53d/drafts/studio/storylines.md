## Pentland, from the Slack tag to the manager's Approve  · safe

- Intent: use-case · the profile's line (no context-notes.md yet): "a working internal tool, not a pitch: build a new functional backend linking to this UI interface". No hood beats.
- Audience and moment: sales leadership, POC owners and their managers · leans forward when the manager clicks Approve in the app and the owner's Slack says "Manager approved, continue" while the Plan stage gate on the Journey flips to crossed with the PRD logged under it.
- Presenter's seat: Aarav Mehta (invented), POC owner of the Pentland POC, laptop, the Pentland Slack channel open beside the app. Priya Nair (invented), the manager, is a second login used in beat 7.
- Story row: "Pentland Vulnerability Use Case" · prospect Pentland (the request's name) · channel #pentland-poc (invented) · owner Aarav Mehta · manager Priya Nair · stage Plan · status Waiting on manager · Journey: Understand crossed by Judge, Plan "Waiting on Priya Nair" with the PRD (HTML preview) attached but not yet logged, Build and Deliver empty · 2 Gate Feedback rows on Plan (iteration 1 judge "flowchart skips the scan approval step", iteration 2 Priya Nair "mockup has no owner view"), so the Plan branch counter reads 2 · 6 History entries from 3 invented senders over the last 20 days · 4 Documents. The second use case, "Pentland Access Review Use Case", is created live in beat 2 and is not seeded.

### Beats
1. Open the POC Dashboard with Slack beside it → table of 10 POCs with prospect, use case, channel, owner, manager, stage, status, blocker; Pentland Vulnerability Use Case on top, Plan, "Waiting on manager"; the other nine cover every stage and every status, two with a blocker text.  · page POC Dashboard
2. In #pentland-poc tag @POC Studio Agent with "Pentland Access Review Use Case"; the bot asks "Who is the manager?"; presenter tags Priya Nair in the thread; the bot confirms → a new row appears on the dashboard: same channel, owner = the tagger, manager Priya Nair, Understand, Waiting on you.  · page POC Dashboard
3. Failure path: tag the bot again with "Pentland Vulnerability Use Case" → the bot answers that the name already belongs to #pentland-poc and links the row; the dashboard still shows 11 rows.  · page POC Dashboard
4. Open Pentland Vulnerability Use Case, History tab (the presenter posted two updates in Slack before the call, one naming each Pentland use case, and the scheduled read has run) → WhatsApp-style timeline: sender, profile picture, time, text, the new update at the bottom; the Access Review update is not here; open Access Review and it holds only its own. Documents tab lists the 4 files.  · page POC Detail
5. On Pentland Access Review Use Case click Build → status flips to AI working, Understand shows "Building", the bot posts "Build started" to the channel; the cloud run starts with the prospect and use case name. When it reports back it goes through Receive build result, the same path that posted Pentland's PRD earlier.  · page POC Detail
6. Back on Pentland Vulnerability Use Case, Journey tab → Understand, Plan, Build, Deliver with gates between; a branch line on Plan with counter 2; click the counter → drawer with both reasons, who gave each (judge, Priya Nair) and the skill each points at (PRD writer, Mockup drafter).  · page POC Detail
7. Priya Nair, signed in as manager, opens the Slack link, clicks the Plan stage and reviews the PRD preview, clicks Approve → Plan crossed with "Priya Nair" and the time, the PRD now listed as a logged artifact, Build "Waiting on Aarav Mehta"; Aarav's Slack receives "Manager approved, continue".  · page POC Detail

### Entities
- object · POC Use Case · OBJ_poc_use_case, new (mirrors the source's table if the Scout maps one) · name, prospect, slack channel, owner, owner Slack id, manager, manager Slack id, stage (Understand / Plan / Build / Deliver), status (AI working / Waiting on you / Waiting on manager / Blocked / Delivered), blocker · 10 seed rows incl. the story row; the nine others (invented prospects, dates in the last 90 days): Harborline Claims Triage (Understand, Waiting on you), Northgate Onboarding (Understand, AI working), Alder Returns (Plan, Blocked "sample data not shared"), Tidewater Invoice Match (Plan, AI working), Kestrel Fraud Alerts (Build, Waiting on you), Marlow Policy Q&A (Build, Blocked "VPN access pending"), Orchard Contract Review (Build, AI working), Sable Supplier Onboarding (Deliver, Waiting on you), Quill Helpdesk (Deliver, Delivered)
- object · History Entry · OBJ_poc_history, new · use case, sender name, sender picture, sent at, text, Slack message id (so a message is logged once) · 6 seed rows on the story row
- object · Document · OBJ_poc_document, new · use case, title, link, added on · 4 seed rows on the story row
- object · Journey Stage · OBJ_journey_stage, new · use case, stage, status (Building / Waiting on [name] / empty), artifact link, approved by, approved at · 2 seed rows on the story row (Understand, Plan); the rest render empty
- object · Gate Feedback · OBJ_gate_feedback, new · use case, iteration, stage, feedback text, source (human / judge), skill · 2 seed rows on the story row
- automation · Create POC from tag · new · called by POC Studio Agent with channel, tagger Slack id, use case name, manager if given · created / needs manager / exists (beats 2, 3)
- automation · Note manager · new · called by POC Studio Agent with row id and the manager's Slack id from the thread · noted (beat 2)
- automation · Read channel into History · new · scheduled; reads each linked channel since the last run, matches a message to its use case by the name it mentions, writes History Entry (and Document when a file is attached), skips ids already logged · count written (beat 4)
- automation · Start build · new · called by the Build button with the row id; calls the Claude Code routine API with prospect and use case name; sets status AI working and Understand "Building" · started (beat 5)
- automation · Receive build result · new · called from outside by the cloud run with row id, stage and link; posts the link to the channel through the bot and sets the stage to "Waiting on [manager]" · posted (beats 5, 7)
- automation · Approve plan · new · called by the Approve button with row id; sets approved by and at, lists the artifact, sets Build "Waiting on [owner]", sends the owner the Slack message · approved (beat 7)
- ai-agent · POC Studio Agent · answers from the POC Use Case list: asks for the manager when missing, replies with the existing row when the name is taken; its tools are Create POC from tag and Note manager
- page · POC Dashboard at /home · the table of all POCs (beats 1, 2, 3)
- page · POC Detail at /poc · Build and Approve buttons; Journey, History and Documents tabs; stage click opens the HTML preview (beats 4 to 7)
- connection · Slack · sandbox (the tenant's Slack connection if the Scout finds one) · carries beats 2, 3, 4, 5 and 7; the profile allows one credential stop
- connection · Claude Code routine API · sandbox (made in this session) · carries beat 5; one credential stop

### Needs
- A Slack app/bot able to read the linked channel, read thread replies and post; a Slack profile picture for each sender.
- A Claude Code routine with an API trigger that installs nebula and runs /build with prospect and use case name.
- A second signed-in user for the manager in another browser profile.
- One PRD HTML (flowchart and mockups) in UnifyApps Storage for the story row, and the earlier "PRD posted" message in the channel.

### Risk
- The scheduled read has not run when History opens. Post the two Slack updates ten minutes before the call; the 4 older seeded entries keep the timeline from ever being empty.

### Open rows
- bot.name: the request calls the bot "@Demo Studio" and later "@POC Studio Agent" · candidates @POC Studio Agent / @Demo Studio
- history.read_interval: how often the channel is read · candidates 5 minutes / 15 minutes
- history.unnamed_message: where a message that names no use case goes when the channel has two · candidates the use case last named in the channel / not logged until it is named
- manager.in_app_identity: how the app knows the person clicking Approve is the manager · candidates match the signed-in user's name to the manager field / a manager email on the row
- approval.notice_place: the request wants the owner told "Manager approved, continue", but the channel is prospect-facing · candidates a Slack message to the owner only / a post in the channel
- artifact.review_vs_logged: artifacts are logged at approval time, yet the manager reviews them before approving · candidates one link, listed as an artifact only once approved at is set / two fields, review link and logged link
- platform.inbound_call: platform question · can an automation be started by an outside HTTP call so the cloud run reports back · candidates API-triggered automation / the app polls the routine run on a schedule
- platform.thread_reply: platform question · can an AI agent behind a Slack bot ask a follow-up and read the thread reply · candidates agent flow handles the thread / an automation listens for thread replies

### Scout
- feasibility: 4 because every beat maps to a tool the Scout read (Slack trigger or poll, invoke-agent, HTTP node with an ENV bearer, callable API chain, Storage), but beats 2 to 5 and 7 stand on two things only the person can make (the Slack app with its pasted webhook URL, the Claude routine) and on a routine-call header no Nebula file states.
- size: 2 pages / 5 objects / 7 automations / 1 agents (the storyline lists 6 automations; the Slack-triggered listener that calls POC Studio Agent and posts its reply is the 7th) · plus 1 API Group/API/client chain for Receive build result, 2 manual connection stops (Slack, routine token), 1 to 2 environment variables
- no tool: deploying POC Studio Agent as a Slack bot → a Slack-trigger automation that calls the agent with ai_agents_by_unifyapps_invoke_agent and posts with slack_post_message_in_channel
- no tool: creating the Slack app, its bot user, scopes and event subscription (pasting the webhook URL) → manual task for the person; the connection then goes in at the credential stop
- no tool: creating the Claude Code routine with an API trigger, and putting the report-back API key into its secrets → manual by the person; the platform stores the routine id/token as environment variables and fires it with the HTTP node
- no tool: a named "bot added to channel" trigger → message event with subtype channel_join on slack_on_new_message (Check this), or a poll comparing the member list
- no tool: pushing live updates into the open page → code-app refetch interval (Check this in the first code-app task)

## One click, and the built assets land in Pentland's channel  · bold

- Intent: use-case · the profile's line (no context-notes.md yet): "a working internal tool, not a pitch". No hood beats.
- Audience and moment: sales leadership, POC owners and managers · leans forward when the finished built assets, with their links, arrive in the Pentland Slack channel, the owner is told "BUILD is complete", and the Journey has moved on its own from one Build click and one Approve.
- Presenter's seat: Aarav Mehta (invented), POC owner, laptop, Slack beside the app; Priya Nair (invented), the manager, is a second login used in beat 6.
- Story row: "Pentland Vulnerability Use Case" · prospect Pentland · channel #pentland-poc (invented) · owner Aarav Mehta · manager Priya Nair, already noted · stage Understand · status Waiting on you · no Journey Stage rows yet, so all four stages render empty and the Build button is live. The second use case, "Pentland Access Review Use Case", is created live in beat 4.

### Beats
1. Open the POC Dashboard with Slack beside it → table of 10 POCs; Pentland Vulnerability Use Case at Understand, "Waiting on you"; the other nine cover every stage and the statuses AI working, Waiting on you, Blocked and Delivered.  · page POC Dashboard
2. Open Pentland Vulnerability Use Case and click Build → status flips to AI working, Journey shows Understand "Building", the bot posts "Build started" in #pentland-poc; the cloud run begins (nebula installed, /build with prospect and use case name).  · page POC Detail
3. Failure path: click Build again → refused with "A build is already running for Pentland Vulnerability Use Case"; no second run, status unchanged.  · page POC Detail
4. While the run works, in #pentland-poc tag @POC Studio Agent with "Pentland Access Review Use Case"; the bot asks "Who is the manager?"; presenter tags Priya Nair in the thread → a second row appears on the dashboard: same channel, owner = the tagger, manager Priya Nair.  · page POC Dashboard
5. The run reports back → the PRD with flowchart and UI mockups lands in #pentland-poc through the bot; Journey: Understand crossed by Judge, Plan "Waiting on Priya Nair"; the dashboard row reads Plan, "Waiting on manager"; the PRD is not yet in the artifact list.  · page POC Detail
6. Priya Nair opens the Slack link, reviews the PRD preview on Plan, clicks Approve → Plan crossed with her name and time, PRD now logged as an artifact; Build flips to "Building"; Aarav's Slack gets "Manager approved, continue"; the build continues from the approved PRD.  · page POC Detail
7. The continued run reports back → the built assets with their links land in #pentland-poc, Aarav's Slack says "BUILD is complete", Journey Build shows the assets link awaiting sign-off, Deliver "Waiting on Aarav Mehta", the dashboard row reads Deliver, "Waiting on you".  · page POC Detail

### Entities
- object · POC Use Case · OBJ_poc_use_case, new (mirrors the source's table if the Scout maps one) · name, prospect, slack channel, owner, owner Slack id, manager, manager Slack id, stage (Understand / Plan / Build / Deliver), status (AI working / Waiting on you / Waiting on manager / Blocked / Delivered), blocker · 10 seed rows incl. the story row; the nine others (invented prospects, dates in the last 90 days): Harborline Claims Triage (Understand, Waiting on you), Northgate Onboarding (Understand, AI working), Alder Returns (Plan, Blocked "sample data not shared"), Tidewater Invoice Match (Plan, AI working), Kestrel Fraud Alerts (Build, Waiting on you), Marlow Policy Q&A (Build, Blocked "VPN access pending"), Orchard Contract Review (Build, AI working), Sable Supplier Onboarding (Deliver, Waiting on you), Quill Helpdesk (Deliver, Delivered) (Waiting on manager is not seeded; it appears on the story row in beat 5)
- object · Journey Stage · OBJ_journey_stage, new · use case, stage, status (Building / Waiting on [name] / empty), artifact link, approved by, approved at · none seeded on the story row; written by beats 2, 5, 6, 7
- automation · Create POC from tag · new · called by POC Studio Agent with channel, tagger Slack id, use case name, manager if given · created / needs manager (beat 4)
- automation · Note manager · new · called by POC Studio Agent with row id and the manager's Slack id from the thread · noted (beat 4)
- automation · Start build · new · called by the Build button with row id; refuses when status is AI working; calls the Claude Code routine API with prospect, use case name and mode plan; sets status AI working and Understand "Building" · started / already running (beats 2, 3)
- automation · Receive build result · new · called from outside by the cloud run with row id, kind (plan or final), link; posts to the channel through the bot; plan sets Understand crossed and Plan "Waiting on [manager]"; final sets Build's artifact link, Deliver "Waiting on [owner]" and sends the owner "BUILD is complete" · posted (beats 5, 7)
- automation · Approve plan and continue · new · called by the Approve button with row id; sets approved by and at, lists the PRD as an artifact, sends the owner "Manager approved, continue", sets Build "Building", calls the routine API again with mode build and the approved PRD link · approved (beat 6)
- ai-agent · POC Studio Agent · answers from the POC Use Case list: asks for the manager when missing; its tools are Create POC from tag and Note manager
- page · POC Dashboard at /home · the table of all POCs (beats 1, 4)
- page · POC Detail at /poc · Build and Approve buttons; the Journey diagram with the stage artifact preview (beats 2, 3, 5, 6, 7)
- connection · Slack · sandbox (the tenant's Slack connection if the Scout finds one) · carries beats 2, 4, 5, 6 and 7; the profile allows one credential stop
- connection · Claude Code routine API · sandbox (made in this session) · carries beats 2 and 6; one credential stop

### Needs
- The same Slack app/bot and Claude Code routine as the safe storyline, with the routine accepting mode plan and mode build.
- A second signed-in user for the manager.
- One rehearsed run for the story row whose two Slack posts (PRD, built assets) stay in the channel above the live ones, for the fallback below.

### Risk
- Two cloud runs may not finish inside 20 minutes. Click Build in the first minute so the first run overlaps beats 3 and 4; if either result is not back when its beat arrives, scroll to the rehearsal run's post in the channel and say that it is the earlier run of the same flow.

### Open rows
- bot.name: the request calls the bot "@Demo Studio" and later "@POC Studio Agent" · candidates @POC Studio Agent / @Demo Studio
- build.continue_by: the request says approval lets "you continue the build" and also "the owner returns to the Claude session and continues" · candidates approval starts the routine again / the owner continues in their own session
- build.final_assets_logging: artifacts are logged at approval time, but the request returns the built assets without a further approval · candidates shown as awaiting sign-off, logged when the owner signs off / logged when the run reports
- approval.notice_place: the channel is prospect-facing, yet the request puts the PRD and the BUILD complete notice there · candidates owner by Slack message only / in the channel
- manager.in_app_identity: how the app knows the person clicking Approve is the manager · candidates match the signed-in user's name to the manager field / a manager email on the row
- platform.inbound_call: platform question · can an automation be started by an outside HTTP call so the cloud run reports back · candidates API-triggered automation / the app polls the routine run on a schedule
- platform.thread_reply: platform question · can an AI agent behind a Slack bot ask a follow-up and read the thread reply · candidates agent flow handles the thread / an automation listens for thread replies

### Scout
- feasibility: 3 because it needs two live cloud runs and two inbound reports inside 20 minutes through the same unverified routine call, plus a second fire for "continue the build"; the platform side is the same as the safe storyline and sound.
- size: 2 pages / 2 objects / 6 automations / 1 agents (5 listed + the Slack-triggered listener that calls POC Studio Agent) · plus 1 API chain for Receive build result (called twice), 2 manual connection stops (Slack, routine token), 1 to 2 environment variables
- no tool: deploying POC Studio Agent as a Slack bot → a Slack-trigger automation that calls the agent with ai_agents_by_unifyapps_invoke_agent and posts with slack_post_message_in_channel
- no tool: creating the Slack app, bot user, scopes and event subscription → manual task for the person
- no tool: creating the Claude Code routine and handing it the report-back API key → manual by the person; id and token kept as environment variables
- no tool: a guarantee that the cloud run finishes inside the demo → the rehearsal run's earlier posts in the channel (the storyline's own fallback)

## Why did the Plan go back three times?  · unexpected

- Intent: use-case · the profile's line (no context-notes.md yet): "a working internal tool, not a pitch". The request's skill improvement loop becomes the whole show. No hood beats.
- Audience and moment: sales leadership, POC owners and managers · leans forward when the admin approves the AI's suggestion and the PRD writer skill moves from v3 to v4, with Pentland's sent-back reasons listed as its evidence.
- Presenter's seat: Priya Nair (invented), the manager who owns Pentland's Plan stage gate and is the skills admin for the FDE team. A deliberate shift from the owner's seat: sending a gate back and approving a skill are manager acts.
- Story row: "Pentland Vulnerability Use Case" · prospect Pentland · owner Aarav Mehta (invented) · manager Priya Nair · stage Plan · status Waiting on manager · blocker "Plan sent back 3 times" · Journey: Plan "Waiting on Priya Nair" · 3 Gate Feedback rows on Plan: iteration 1 judge "flowchart skips the scan approval step" (PRD writer), iteration 2 Priya Nair "mockup has no owner view" (Mockup drafter), iteration 3 judge "scope has no success measure" (PRD writer), so the Plan branch counter reads 3; beat 4 adds iteration 4. Its feedback points at the skills PRD writer v3 and Mockup drafter v2.

### Beats
1. Open the POC Dashboard → table of 10 POCs with stage, status, blocker; Pentland Vulnerability Use Case on top at Plan, "Waiting on manager", blocker "Plan sent back 3 times"; the other nine cover every stage and every status.  · page POC Dashboard
2. Click into Pentland Vulnerability Use Case → Journey: Understand, Plan, Build, Deliver with gates between; a branch line on Plan with counter 3; click the counter → drawer with the three feedback rows: iteration, source (judge or Priya Nair), the reason, and the skill each is linked to.  · page POC Detail
3. Failure path: click Send back on Plan and submit with the reason empty → refused with "Say why: the reason goes to the skill"; the counter stays 3, no branch is drawn.  · page POC Detail
4. Send back again with the reason "Flowchart does not show who approves the scan" and the skill PRD writer → counter becomes 4, a new branch line is drawn, Plan reads "Waiting on Aarav Mehta".  · page POC Detail
5. Open Skill Improvements and click Run now (the same automation that runs weekly) → one Pending suggestion appears for PRD writer, from 7 feedback rows across 4 POCs; Mockup drafter, with 2 rows, gets none.  · page Skill Improvements
6. Open the PRD writer suggestion → current prompt (v3) beside the proposed prompt (v4), and the 7 feedback rows it came from, Pentland's three among them (POC, iteration, stage, text).  · page Skill Improvements
7. Click Approve → PRD writer shows v4 as current; the suggestion reads Approved with approver and date; the version list gains v4 above v3 and v2.  · page Skill Improvements

### Entities
- object · POC Use Case · OBJ_poc_use_case, new (mirrors the source's table if the Scout maps one) · name, prospect, owner, manager, stage (Understand / Plan / Build / Deliver), status (AI working / Waiting on you / Waiting on manager / Blocked / Delivered), blocker · 10 seed rows incl. the story row; the nine others (invented prospects, dates in the last 90 days): Harborline Claims Triage (Understand, Waiting on you), Northgate Onboarding (Understand, AI working), Alder Returns (Plan, Blocked "sample data not shared"), Tidewater Invoice Match (Plan, AI working), Kestrel Fraud Alerts (Build, Waiting on you), Marlow Policy Q&A (Build, Blocked "VPN access pending"), Orchard Contract Review (Build, AI working), Sable Supplier Onboarding (Deliver, Waiting on you), Quill Helpdesk (Deliver, Delivered)
- object · Journey Stage · OBJ_journey_stage, new · use case, stage, status (Building / Waiting on [name] / empty) · 1 seed row on the story row (Plan)
- object · Gate Feedback · OBJ_gate_feedback, new · use case, iteration, stage, feedback text, source (human / judge), skill, logged on · 8 seed rows: the story row's 3 plus Tidewater Plan x2 (PRD writer), Alder Plan x1 (PRD writer), Kestrel Plan x1 (PRD writer), Marlow Plan x1 (Mockup drafter); beat 4 adds the ninth
- object · Skill · OBJ_skill, new · name, current version, prompt · 2 seed rows: PRD writer v3, Mockup drafter v2
- object · Skill Suggestion · OBJ_skill_suggestion, new · skill, proposed prompt, status (Pending / Approved), version, created on, approved by, approved on · 3 seed rows, all Approved (PRD writer v2 and v3, Mockup drafter v2) so the version list has history
- automation · Send back at a gate · new · called by the Send back form with use case, stage, reason, skill; refuses an empty reason; writes Gate Feedback with iteration = highest + 1 and source human; sets the Journey Stage "Waiting on [owner]" and the use case status Waiting on you · sent back / reason needed (beats 3, 4)
- automation · Suggest skill improvements · new · scheduled weekly and called by Run now; for each skill with at least the threshold of Gate Feedback rows since its last approved suggestion, asks Skill Coach for a revised prompt and writes a Pending Skill Suggestion · written / none (beat 5)
- automation · Approve skill suggestion · new · called by the Approve button with the suggestion id; sets it Approved with approver and date, sets the skill's current version and prompt · approved (beat 7)
- ai-agent · Skill Coach · answers from one skill's current prompt and its Gate Feedback rows since the last approved version; returns a revised prompt and nothing else
- page · POC Dashboard at /home · the table of all POCs (beat 1)
- page · POC Detail at /poc · Journey diagram with branch counter, feedback drawer and Send back form (beats 2, 3, 4)
- page · Skill Improvements at /skills · skills with version, Run now, pending suggestion with evidence and Approve, version list (beats 5, 6, 7)

### Needs
- None. No Slack and no Claude Code connection; the Slack half of the request is seeded, not shown.

### Risk
- The Skill Coach's rewrite reads vague. Write the seven feedback texts in rehearsal so three themes are plain (approval step missing in the flowchart, no owner view in the mockup, no success measure) and check the answer twice before the call; there is no live fallback.

### Open rows
- suggestion.threshold: how many feedback rows a skill needs before a suggestion is written · candidates 3 / 5
- suggestion.evidence_window: which feedback a suggestion is built from · candidates rows logged since the skill's last approved version / all rows for the skill
- skills.admin_role: who may approve a suggestion · candidates one named admin user / any manager
- platform.run_now: platform question · can one automation be both scheduled and started from a page button · candidates one automation with two triggers / two automations sharing a sub-flow (would take the count to 4)
- feedback.capture: the request says feedback happens in Claude, not in the app, yet beats 3 and 4 take it in the app · candidates a Send back form on the Plan stage gate / rows written by the cloud run through an inbound call

### Scout
- feasibility: 5 because everything it needs is verified in Nebula's files and stays inside the tenant (Storage, a scheduled automation, Simple Call LLM 66dfd76eb70dad256986b784 or an agent, code-app buttons through automation data sources); the price is that it leaves out the Slack and cloud-run half of the request.
- size: 3 pages / 5 objects / 4 automations / 1 agents (3 listed + the second automation "Run now" needs, since an automation has one trigger)
- no tool: one automation that is both scheduled weekly and started by the Run now button → two automations sharing a callable sub-flow (Suggest skill improvements as the callable, a small scheduled caller)
