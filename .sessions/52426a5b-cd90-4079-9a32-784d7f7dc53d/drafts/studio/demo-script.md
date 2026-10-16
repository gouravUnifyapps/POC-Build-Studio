# POC Studio Live — script

- App: POC Studio Live (`app-79ea7266eab9`) · published v1 (v2 with the skill loop when its change lands) · live https://app-79ea7266eab9-orbit.tensor-uat.unifyapps.com · preview https://orbit.uat.unifyapps.com/agent-api/preview/b/app-79ea7266eab9/main/ (signed in to the tenant)
- Presenter plays: the POC owner and, for the demo, also the manager ("for the demo I am owner and manager"), laptop, Slack open beside the app in `#pentland-poc`
- Story row: Pentland Vulnerability Use Case (`POC-pentland-vulnerability-20261001`): Plan waiting on approval, owner approved in Slack, manager not yet, PRD v3 and mockup v2 in review, Plan counter 2
- Length: about 15 minutes · 6 beats
- Before the call (the person): the Slack Request URL is saved in the POC Studio Agent app, `#pentland-poc` exists and the bot is invited, the routine environment holds the report-back key, and two real posts (one naming each Pentland use case) were made in `#pentland-poc` at least 10 minutes before

## Beats

### 1. The dashboard
- Say: "Every POC use case, where it stands, and what it is waiting on."
- Do: open Home.
- Open: https://orbit.uat.unifyapps.com/agent-api/preview/b/app-79ea7266eab9/main/
- See: "POC journeys", the tiles Active POCs, Waiting at a gate, Blocked, Open feedback; the filter row "All 11 · Waiting on you 1 · Waiting on approval 3 · Building 5 · Blocked 2 · Demo-ready 1"; Pentland Vulnerability Use Case first, Journey "Plan · approval", status "Waiting on you"; Pentland Product Enrichment Use Case beside it in the same channel.
- Check: the table has the 11 seeded rows, two Blocked rows each with its reason, and exactly one row reads "Waiting on you".

### 2. Tag the bot in the prospect channel (live, Slack)
- Say: "A POC starts where the conversation is: in the prospect's channel."
- Do: in `#pentland-poc` post `@POC Studio Agent Pentland MDM Use Case`; when the bot asks "Who is the manager? Tag them here.", reply in the thread tagging a real teammate (or yourself).
- Open: the Home page beside Slack.
- See: the bot confirms in the thread; a new row appears without a reload: Pentland MDM Use Case, same channel, owner the tagger, the tagged manager, Understand, status "Waiting on you".
- Check: the dashboard now lists 12 rows and the new row sorts first under "Waiting on you".

### 3. The failure path: a name that already exists (live, Slack)
- Say: "A use case name belongs to one channel; asking twice does not make a second row."
- Do: in `#pentland-poc` tag the bot again with `Pentland Vulnerability Use Case`.
- See: the bot answers that the name already exists and names its channel; the dashboard count does not change.
- Check: no new row; the bot's reply says the name already belongs to `pentland-poc`.

### 4. History, Documents and the iteration counter
- Say: "Everything the team says in the channel lands on the right use case, with who said it."
- Do: open Pentland Vulnerability Use Case; click the "2 iterations" chip under Plan; open the Documents tab; open the History tab.
- Open: https://orbit.uat.unifyapps.com/agent-api/preview/b/app-79ea7266eab9/main/pocs/POC-pentland-vulnerability-20261001
- See: the Journey Understand, Plan, Build, Deliver with G1 to G3 between; the panel under the chip with both reasons, who gave each (Judge, the manager) and the skill each points at; Documents lists the use case's files; History reads as a chat: round picture or initials, sender, text in a bubble, time, with the two real Slack posts at the top and the seeded ones below, and system lines (approvals, "posted for approval") as centred notices.
- Check: Pentland Product Enrichment Use Case's History holds only its own messages.

### 5. Build (live)
- Say: "One click starts the cloud build with the client and the use case."
- Do: back on Home, open Pentland MDM Use Case (the row from beat 2) and click Build; then scroll `#pentland-poc` up to the earlier run.
- See: the status reads "Building · Understand" with a "Claude session" link in the header; the bot posts "Build started for Pentland MDM Use Case. Claude session: ..." in the channel; higher in the channel, the earlier run's PRD post with the app link.
- Check: the Build button is gone after the click (a second click is refused by the automation), `build_run_id` is set.

### 6. The manager approves (lean-forward)
- Say: "The manager reviews what the build produced, approves, and the owner hears it in Slack."
- Do: open Pentland Vulnerability Use Case; read the "To review" list, open the PRD in the drawer; click Approve Plan; then turn to Slack.
- Open: https://orbit.uat.unifyapps.com/agent-api/preview/b/app-79ea7266eab9/main/pocs/POC-pentland-vulnerability-20261001
- See: the approval card shows Owner "Approved in Slack", Manager "Waiting", "To review · 2" (the PRD and the mockup); after the click Plan is crossed with the presenter's name, the two documents move under Plan, Build reads "Building"; the owner's Slack direct message from the bot says "Manager approved, continue".
- Check: the story row has no `build_run_id`, so this approval starts no cloud run; the direct message arrives from POC Studio Agent.
