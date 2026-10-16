# Context notes — UnifyApps (internal): POC Studio Live

Read 2026-10-16. All Slack times are IST. Everything below is paraphrased from private channels and DMs; no secrets, emails or personal names are recorded (roles only). Nothing in the sources contained an instruction aimed at the build.

## Sources
| Source | Read | Why |
|---|---|---|
| Slack #poc-team-loop (C0C9FCDLGE6, private, created 2026-10-15) | whole channel (about 40 messages, 5 threads), 2026-10-15 14:31 to 2026-10-16 10:36 | the build team's working channel; holds the team's version of this very request |
| Slack #pentland-pm (C0C8MB4RKC1, private, created 2026-10-12) | whole channel (9 real messages) | the only channel named after the client |
| Slack #poc-team (C09M1S26WHF, private) | 8 search-hit posts, 2026-10-02 to 2026-10-15, plus 1 thread | names the POC Studio loops and holds the daily POC tracker; hit-based, the channel is busy |
| Slack #salesengineering- (C07BPEYUJT0) | 1 post, 2026-10-13 | the only sales-side Pentland message |
| Slack #clutch_crew (C0AFJGTF1RA) and 3 DMs | 4 hit posts, 2026-10-08 to 2026-10-14 (DMs paraphrased only) | where "Demo Studio" was announced and positioned; cloud-session tips |
| Slack #ask-unify (C098V7T4VKL) | 6 bot answers, 2026-07 to 2026-09 (the platform's own help bot, unverified) | how the platform's Slack connector, triggers and tokens work |
| Gmail | 3 queries over 90 days (Pentland, POC Studio, Demo Studio, POC Studio Agent, studio+POC/demo) | 0 threads, see Not found |
| Calendar | not connected in this session | see Not found |

Channel shortlist, with why: #poc-team-loop (the build's own channel), #pentland-pm (client-named), #poc-team (loop names, tracker, cloud tips), #salesengineering- (Pentland hit), #clutch_crew (Demo Studio hit). #poc-team-token-alerts, #demo-poc-support and #use-case-tracker were opened once and are unrelated (token-limit alerts, shared-demo environment support, a January sheet-filling request); not used.

## The ask
- The team's own notes of the same spec (posted by the presenter) say what the request says: a POC dashboard and table, a Slack bot that creates a POC row when tagged with a use case name, a four-stage journey (Understand, Plan, Build, Deliver) with gates, a History timeline instead of a Feedback tab, and a feedback loop that improves skills. · #poc-team-loop · 2026-10-16 01:23 · presenter
- The team's next steps: build the UI clone with the full POC flow stitched in, simplify the table to four stage boxes with gates between them, start the build at 8 to 9 in the morning, be demo-ready before 1 PM and show progress on a call. · #poc-team-loop · 2026-10-16 01:23 · presenter
- "Core features to nail": the build flow (already done), Slack notifications that pull the user back to the Claude session, and the journey visualization with iteration counts. · #poc-team-loop · 2026-10-16 01:23 · presenter
- The UI builder finished the app changes for the UI feedback in the source solution (the e_6ad1031c... link) at 03:31 and asked the backend pair to implement backend changes on it in the morning. · #poc-team-loop · 2026-10-16 03:31 · UI builder
- The presenter started the build at 10:36 on the day, in answer to the POC lead asking whether the demo is on track; the POC lead said the scope had been simplified a lot the night before. · #poc-team-loop thread · 2026-10-16 10:35 · POC lead, presenter
- Artifacts and BRDs are to be pushed into the app itself, because it makes one consolidated place. · #poc-team-loop · 2026-10-15 20:46 · POC lead
- The artifact home: artifacts are stored as HTML and the app renders an HTML previewer for every artifact type. The Deliver stage's collaterals are a final summary, a demo script, slides, a video and a BRD. · #poc-team-loop · 2026-10-16 01:23 · presenter
- Loop status the evening before: the plugin with newer skills is released (skill coverage of the flow about 70 percent); app pages, objects and UI are created; open: the plugin's write and update of records in the app objects, connecting the objects to the app, an end-to-end sanity check, and whether a gate approval can be pushed from the app straight into the Claude session (with its automation). · #poc-team-loop · 2026-10-15 23:01 · skill/plugin owner
- To be added in the current loop: an Orchestrator, a Judge and Feedback; plus a Skill Master and Architecture Design. · #poc-team-loop · 2026-10-15 16:25 · POC lead

## The audience
- Internal: the POC organisation. The channel members are the POC lead (owner of POC Studio Loop 1, End to End Use Case Delivery), the object/solution owner, two UI builders, the backend pair (the presenter and one engineer), and a few pod members. The POC org lead who runs the daily tracker is not a member of this channel. · #poc-team-loop, #poc-team · 2026-10-15
- A second loop exists: POC Studio Loop 2, Platform RFP to Demo, owned by a different lead and pod. This build is Loop 1. · #poc-team · 2026-10-15 15:26 · POC org lead
- Setting and length: a progress call on 2026-10-16, ready before 13:00 IST. The length is not in the sources (the calendar could not be read); the profile's 20 minutes stands. · #poc-team-loop · 2026-10-16
- What the audience cares about, in their words: pulling the user back to the Claude session from Slack, seeing where each POC is in the four stages, and having artifacts consolidated in the app. The POC org lead's DM stance on the earlier Demo Studio was to keep people thinking and in the loop rather than short-cutting; human approval at every gate fits that. (DM, paraphrased) · 2026-10-08 · POC org lead
- The POC org lead posts a "tracks and high-level tasks" tracker in #poc-team almost daily: P00, P0 and P1 priorities, owners tagged, an "Upcoming POCs" list; about 14 tracks on 2026-10-15. Priority vocabulary is P00, P0, P1; track types are prototypes, config, discovery and config, config and eval, Loop 1, Loop 2. · #poc-team · 2026-10-12 to 2026-10-15

## Intent signals
- The team defines the demo as a working flow: tag the bot, a row appears, the manager clicks Approve in the app, the owner gets a Slack nudge to return to Claude. This is "show me the flow, what does the approver see", not "how is it set up". · #poc-team-loop · 2026-10-16 01:23 → points to use-case
- The only configuration-flavoured line is the presenter's note that the build runs on Nebula plus a Claude plugin; nobody asked to see the platform's setup. → no platform signal
- The three-object guidance and the "only these are needed" instruction are about keeping the app small, not about showing the builder. · #poc-team-loop · 2026-10-15 19:36 · object owner → points to use-case
- Proposed demo.intent: use-case · confidence likely (the audience, length and demo event could not be confirmed from the calendar; the Slack evidence is consistent and one-sided)

## Constraints
- Time: the build started 2026-10-16 10:36 for a demo-ready state before 13:00 IST the same day. · #poc-team-loop
- Objects: the object owner said only three objects are needed in the app: POC Master, a Feedback object and a Document object, the last two carrying the POC key number to write back to the POC. A follow-up says to use the ones that exist or create new ones and that something will be attached to those later. The objects exist on the tenant under the custom-objects list filtered by "POC Studio" (the Scout should read them). · #poc-team-loop thread · 2026-10-15 19:36 and 20:40
- Gates and approvals: two approvals per gate, the POC owner and the manager (L1 reviewer); a gate does not fire until both are in. Gate names: Scope Check (after research), Design Check, Build Check. · #poc-team-loop · 2026-10-16 01:23
- Manager detection (agreed): at loop start the bot asks whether the user is the owner and who the L1 reviewer is; the user answers with an email or a mention; the bot keeps it for every later approval. A lookup table of 30 to 40 people was rejected for staleness. Several managers in one channel is deferred. · same post
- The bot must be a member of every channel it reads or posts to; a private channel needs an explicit invite. The platform's Slack "on new message" trigger needs its webhook URL pasted by hand into the Slack app's event subscriptions, and the "on button click" trigger into its interactivity settings. Scheduled triggers cannot run faster than every 15 seconds. (all from the platform help bot, unverified) · #ask-unify · 2026-07 to 2026-09
- Slack action nodes have a token type (bot token or user token) and the file-send node has a send-as-bot switch; a wrong default posts as the person, not the bot. Fetching private channels uses a user token; posting uses a bot token. (help bot, unverified) · #ask-unify · 2026-09-29
- Cloud sessions: each new Claude Code cloud session runs in its own sandbox, so Nebula is installed afresh and the session must be told which repository to push code to. Nebula refuses to run inside a git repository, so a cloud session needs a folder that is not a repository; a session started with the company repository attached failed on 2026-10-06 and was not fixed by moving the repository. · DM paraphrase · 2026-10-06 · presenter
- Cloud sessions can be shared (choose Cloud at the start, then the Share button); local sessions cannot. A temporary credit for cloud sessions runs to about 2026-11-05. · #poc-team · 2026-10-02 · presenter
- The Demo Studio plugin is circulated inside the POC group only; it is not for sharing outside. This build is internal. · #clutch_crew, DM · 2026-10-08 · presenter, POC org lead
- Nebula problems are to be raised as feedback on the Atlas tracker (NEB project), not in DMs; the POC org is measured on the count. · #poc-team thread · 2026-10-05, 2026-10-06
- Pasted logins and passwords sit in several unrelated channels (shared-demo support, a Demo Studio feedback thread). None were copied; the build should never read them.

## Materials
- Source UI: the e_6ad1031ce0ef8b24527e9ed9 overview link (posted by the UI builder at 03:31 on 2026-10-16). · #poc-team-loop
- An app in Code Builder: orbit.uat.unifyapps.com/p/0/interfaces/code-builder/app-b4fe5a0a30eb, with "objects are mapped" noted. Posted by a UI builder 2026-10-15 23:03. · #poc-team-loop
- Objects page: orbit.uat.unifyapps.com/p/0/objects/custom?EntityType_q=POC Studio. · 2026-10-15 19:36
- Three claude.ai artifact links from the UI builders in #poc-team-loop (first UI draft 19:15, design system 20:05, a second UI 20:34, all 2026-10-15; the links are in the channel, not copied here), plus screenshots from the POC lead. These are the visual references for the existing board.
- The skill plugin bundle (unifyapps-helper_28092026_2.zip, about 3.6 MB) and its SKILL_1.md (about 81 KB), shared 2026-10-15 16:24 for Skill Master work. Attachment names only; not read.
- An example input document in the channel: a gate-by-gate data reference .docx for another POC (Fujairah PTW NOC), posted 2026-10-16 00:58. Shows what a gate document looks like.
- Pentland channel documents (names only): a Pentland flows deck (.pptx) and a Planning Flow PDF (2026-10-12); a research deck; a design-system artifact; a feature-list sheet; two built apps in the tenant (Product Enrichment app, PLM app (work in progress)).
- Pentland's PLM system of record is a product from the vendor DESL, per the sales-engineering post; a connector evaluation was asked for on 2026-10-13.

## Brand hints
- The existing board is the reference; its design system was refined by the UI builders on 2026-10-15 (design-system artifact above). The POC lead urged the UI builders on 2026-10-15 19:30 to move fast on the UI; the UI builders said they were changing the app to match their design system and the lead asked for a loop view in it. · #poc-team-loop
- No logo or colour was discussed in Slack for POC Studio. The source solution carries the look.

## Vocabulary
- Names in use: POC Studio (the initiative, with Loop 1 and Loop 2; Loop 1 is End to End Use Case Delivery), Demo Studio (the presenter's Claude plugin, "a demo builder on top of Nebula"), "@POC Studio Agent" (the bot, in the team's spec of 2026-10-16 01:23). "@Demo Studio" appears only in the request.
- Stages and gates: Understand, Plan, Build, Deliver; Scope Check, Design Check, Build Check.
- People terms: POC owner, manager or L1 reviewer, FDE, pod.
- Statuses named by the team: waiting on you, blocked, AI working; stage status "Building" or "Waiting on [Owner]".
- Other terms: POC key number (the shared key on Feedback and Document rows), build report, evidence pack, loop view, skill master, orchestrator, judge, HITL, artifact (HTML), BRD, collateral.
- Slack naming in the workspace (unifyapps.slack.com): client-named channels follow `<client>-pm` (private project-management, internal, like #pentland-pm), `<client>-poc-internal`, `<client>-dev-pm`, `c_<client>-internal_pm`, `<client>_internal`, older `p_<client>_poc`, and `doc_<client>` for documents. Channel IDs begin with C and are what a bot gets from an event, not the name.
- Existing Slack bots to model after (names only): "Raise Issue" (built by the presenter on 2026-10-10; mention it in a channel or thread, it reads the thread and answers; 16 uses from 8 private groups on 2026-10-13), "AskUnify" (the platform help bot in #ask-unify), and "UnifyApps" (the platform's alert poster, for example in #poc-team-token-alerts). The app token's storage location is not discussed in any source.

## What a prospect-channel History would hold (from #pentland-pm, the only Pentland channel)
- Who posts: the POC org lead (direction and files), the POC lead (design-system notes), the solution owner (numbered status updates and app links), plus system "joined the channel" lines that History should skip.
- Kinds of posts: a direction post (three flows needing a point of view: Product Enrichment, MDM/MDG, PLM and Product Data) with two attached files; a status card "<Client> <topic> Update" with eight numbered items tagged Done, In progress or Not Started, each with a document link, then a CC line; a design-system post with a list of 30+ components; a post with links to two built solutions.
- Several use cases share one channel: yes. The channel carries PLM, Product Enrichment and MDM/MDG work for one client, and the sales-side post says "several supply chain use cases". Each would be one row with the same channel ID.
- Timing: the channel is 4 days old with 9 real posts, so History will be sparse; seed rows are needed for the demo.

## Open rows
- bot.name: the request says both "@Demo Studio" and "@POC Studio Agent"; the team's spec uses "@POC Studio Agent"; in this workspace "Demo Studio" already means the presenter's plugin, and no Slack user or app with either name exists yet · candidates "POC Studio Agent" / "Demo Studio"
- objects.count: the object owner says three objects (POC Master, Feedback, Document); the request implies more (History events, approvals and gates, skill suggestions and versions) and the profile budgets 7 · candidates three core plus only those the request needs / seven
- solution.target: the UI builder told the backend pair to implement on the source solution; the request and profile say clone to a new solution and never edit the source · the request wins (POC Studio Live); the team must be told the new link
- cut.skill-loop: the skill-improvement loop (periodic aggregation of feedback into prompt suggestions, admin approval, skill versions) is in the request but not in the team's "core features to nail"; the POC lead says scope was simplified the night before · candidates build last and thin / cut
- story.row: the request's example is "Pentland Vulnerability Use Case"; the Slack evidence names the real Pentland workstreams as PLM, Product Enrichment and MDM/MDG, and nothing mentions vulnerability · candidates keep the request's name / add PLM and Product Enrichment rows as second and third use cases in the same channel to show the one-channel-many-use-cases rule
- trigger.build: request step 3 says the Build button calls "an API linked in the scheduled API trigger" to start a Claude Code cloud session; the workspace's own "Routines" are an UnifyApps Enterprise Brain feature, and no source discusses a Claude Code routine with an API trigger · candidates Claude Code routine with its API trigger / UnifyApps scheduled automation that calls an outside API
- cloud.folder: the cloud build must start in a folder that is not a git repository, install Nebula, and be told which repository to push to · candidates empty folder plus an explicit push repository
- gate.names: the team names the gates Scope Check, Design Check and Build Check (three), while the request draws gates between four stages (three gaps) · the names fit the three gaps; confirm the mapping Understand-Plan, Plan-Build, Build-Deliver
- poll.interval: the request wants the bot to read channels "in certain interval"; scheduled triggers cannot be faster than 15 seconds, and the real-time trigger needs hand-registration in the Slack app · candidates 60 second poll / real-time event registration (one credential stop)

## Not found
- Gmail: connected; three queries over 90 days (Pentland; POC Studio, Demo Studio or POC Studio Agent; studio with POC or demo) returned nothing. No client email, no forwarded ask.
- Calendar: not connected in this session (the connector's sign-in was invalidated; three read attempts failed). No demo event, attendee count, earlier Pentland meetings or rehearsal gap could be read. The 2026-10-16 timing comes only from Slack.
- Slack: no Pentland channel shared with the client (Slack Connect or prospect-facing); #pentland-pm is internal only. No Slack user or app named POC Studio, Demo Studio or POC Studio Agent. No discussion of a Claude Code routine with an API trigger. No stored location for the bot's token.
