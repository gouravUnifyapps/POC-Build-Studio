# The request, as typed (2026-10-16)

https://orbit.uat.unifyapps.com/p/0/solutions/e_6ad1031ce0ef8b24527e9ed9
Clone this and build a new functional backend linking to this UI interface
Core flow:

1. Bot gets tagged in a prospect group --> Bot clarifies the use case name and manager name --> Bot creates a record in the list of all the POC use cases
2. The UI is linked to agents and automations as required that reads the slack channel in certain interval and updates the UI according to it. History is whenever an announcement is made or new information is released or new update on the POC is their it logs in the History tab with owner user their profile pic and timestamp and what they sent. Documents is just the crisp gathering of all the use case related docs. Note that a single channel may be used for multiple use cases for the same client but a single use case is linked to only a specific channel. So when a bot mentions a particular use case then the history & feedback should be corresponding.
3. A CTA inside the use case page lets you triggers the build process in a Cloud Claude Code session from the UnifyApps platform via an API that is linked to it in the scheduled API trigger. The environment installs nebula first and the and the triggers you ("/build") with the client and use case name
4. You build and return a simple visual PRD with flowcharts and UI mockups to the same slack channel for review and manager and user approvals via the bot. Then when the manager and user give thier approvals you continue the build and return the final Built assets with their link in the same slack channel and notifying the user that BUILD is complete.

POC Dashboard and Table View

* Main table shows all POCs with stage gates, current status, and blockers
   * Statuses: waiting on you, blocked, AI working, etc.
   * Click into any POC for deep-dive: build report, evidence pack, review/edit comments
* Each row in the table is linked to one Slack channel (the prospect-facing channel)
   * One use case can have multiple channels; one channel can have multiple use cases
   * For now: keep it simple, one channel per use case for first cut
* Bot added to a Slack channel auto-detects and links it to the corresponding row

Also create a Slack Bot "@Demo Studio" linked to a Agent Flow:

* Bot is a selling agent with multiple tasks: create records in the object linked to the above UI, handle approvals
* To create a POC: tag @POC Studio Agent in Slack with use case name
   * Bot picks up channel name and user ID, creates a row in the app
   * Example: "Pentland Vulnerability Use Case" creates a named row; second use case creates a second row
   * While creating the record the bot asks who is the Manager if not mentioned in the first message and the user tags him in the thread and the bot notes it
* All core conversation and feedback happens in Claude, not in the app
   * Slack is purely a messaging/notification channel: nudges user to return to Claude session
* Manager approval flow:
   * Manager gets Slack link, reviews artifacts in app, clicks Approve
   * Slack notification sent to POC owner: "Manager approved, continue"
   * Owner returns to Claude session and continues

Journey Visualization and Feedback Loop

* App UI shows four stages: Understand, Plan, Build, Deliver
   * Gates sit between stages; clicking a stage shows its artifacts (HTML preview)
   * Stage status: "Building", "Waiting on [Owner]", or empty until gate reached
   * Artifacts logged at approval time, not before
* Iteration tracking:
   * Every feedback loop (human or judge) draws a branch line on the journey diagram
   * Counter on each branch shows how many times that stage was reiterated
   * Clicking the counter reveals feedback reasons, linked to the relevant skill
* Feedback section replaced by History:
   * Timeline view of who sent what document and when (WhatsApp-style)
   * All input documents stored here; no separate Feedback tab
* Skill improvement loop:
   * All gate feedback (human + judge) captured in a feedback object: POC name, iteration, stage, feedback text
   * Automation runs periodically: aggregates feedback per skill, generates prompt improvement suggestions
   * Admin reviews suggestions and approves; skill versions tracked
