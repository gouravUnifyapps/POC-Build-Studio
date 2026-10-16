# POC Studio Live — decisions, round 2 (Judge, credential stops, moderator)

## Settled decisions

| Decision key | Source | Answer or evidence |
|---|---|---|
| slack.app | USER | New Slack app "POC Studio Agent" made by the person from slack-app-manifest.yaml; the connection "POC Studio Live Slack" (id 6ad1be602ac9ba64653a9d36, authType TOKEN) was created by the moderator at the credential stop and reads back active; no existing bot reused |
| approval.write_path | JUDGE | Approve gate automation commits first (approval, activity, document flips), then the DM, then the second routine fire; a failed DM or fire adds a warning, never rolls back |
| claude.routine | USER | The person made the routine with an API trigger; the trigger id is saved as environment variable CLAUDE_ROUTINE_ID (plain) and its token as CLAUDE_ROUTINE_TOKEN (sensitive) by the moderator at the credential stop; the report-back key is pasted into the routine later |
| story.row | JUDGE | "Pentland Vulnerability Use Case" stays the story row; the live beat-2 name is "Pentland MDM Use Case"; "Pentland PLM Use Case" becomes the rehearsal run's row (dashboard opens at 12 rows, beat 2 makes 13) |
| seed.identity | STAND-IN, READ, PROFILE | The story row carries the presenter's own identity as owner AND manager (Gourav Mahunta, gourav.mahunta@unifyapps.com, his real Slack user id resolved from the email at build time), so "Waiting on you" and Approve show for the signed-in presenter and the DM lands in his own Slack; every story-row child value that names Aarav Mehta or Priya Nair (activity `actor_*`, the Plan iteration `actor_name`, FB-10 `given_by_name`) is swapped to match; every other seed row keeps its invented people; `slack_live false` everywhere until the channel join |
| time.budget | JUDGE | Not cut. Build order: objects and seeds, then the Slack tag flow, Start build, Receive build result and Approve gate before History; the code app in parallel; the skill loop last as a second change. The 13:00 target applies to the six-beat walk without the rehearsal tail |
| objects.unread_fields | JUDGE | DROP the 16 unread fields and also psl_feedback `category` and `channel` (Judge) |
| env.app_url | JUDGE | Environment variable POC_STUDIO_APP_URL (plain), saved by the moderator after the first publish |
| ui.tab_label | JUDGE | "Documents" (the request's word) |
| walk.length | JUDGE | Six beats, about 15 minutes; the skill-loop beat is out of the walk but still built |
| slack.bot_identity | READ | Bot user U0C9P6MFR62 (poc_studio_agent), bot id B0C9URVJXPW, workspace UnifyApps T062ZQRR6GG, read with slack_get_user_info on the new connection |
| seed.presenter_slack | READ | U09EK0B6NKD, Gourav Mahunta, confirmed with slack_get_user_info_by_id on the bot connection |
| slack.email_lookup | READ | slack_get_user_info_by_email runs with the user token, which has only users:read, so it fails with missing_scope; automations use slack_get_user_info_by_id with the bot token (name, picture; email when present) and the manager check falls back to the full name |
| design.p1_p2 | DESIGNER | Apply both: P1 deletes orbit.css line 22 (--accent re-bound to --inner; avatar initials 1.08:1), P2 adds .tag.ob-tag-brand { color: var(--brand-deep) }; each uses only the source's tokens |
| plan.split | MODERATOR | Two: the first plan is the core flow with the app's first publish; the skill loop (automations 7 and 8, the Feedback page block, its publish) is a second change, because a publish must wait on every code-app task of its app |
| env.report_vars | MODERATOR | Environment variables POC_STUDIO_REPORT_URL and POC_STUDIO_REPORT_HEADER (plain), saved by the moderator once the API exists; the routine payload carries both |
| routine.fire | READ | Read from code.claude.com/docs/en/routines (see claude.beta_header) |

## Questions

### Q-slack-app

- Decision key: `slack.app`
- Type: `select`
- Source: USER
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Which Slack app / connection carries the bot?
- Options: new Slack app, one credential stop · reuse an existing bot connection
- Recommended: New Slack app "POC Studio Agent" made by the person from slack-app-manifest.yaml; the connection "POC Studio Live Slack" (id 6ad1be602ac9ba64653a9d36, authType TOKEN) was created by the moderator at t
- Answer: New Slack app "POC Studio Agent" made by the person from slack-app-manifest.yaml; the connection "POC Studio Live Slack" (id 6ad1be602ac9ba64653a9d36, authType TOKEN) was created by the moderator at the credential stop and reads back active; no existing bot reused
- Status: `answered`

### Q-approval-write-path

- Decision key: `approval.write_path`
- Type: `select`
- Source: JUDGE
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Does the app keep writing approve straight to the objects, or call an automation?
- Options: UI calls an Approve automation (updates, logs, Slack notice) · UI writes directly and a record-change trigger notifies
- Recommended: Approve gate automation commits first (approval, activity, document flips), then the DM, then the second routine fire; a failed DM or fire adds a warning, never rolls back
- Answer: Approve gate automation commits first (approval, activity, document flips), then the DM, then the second routine fire; a failed DM or fire adds a warning, never rolls back
- Status: `answered`

### Q-claude-routine

- Decision key: `claude.routine`
- Type: `select`
- Source: USER
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Who makes the routine and how do its id and token reach the platform?
- Options: the person, saved as ENV variables · other
- Recommended: The person made the routine with an API trigger; the trigger id is saved as environment variable CLAUDE_ROUTINE_ID (plain) and its token as CLAUDE_ROUTINE_TOKEN (sensitive) by the moderator at the cre
- Answer: The person made the routine with an API trigger; the trigger id is saved as environment variable CLAUDE_ROUTINE_ID (plain) and its token as CLAUDE_ROUTINE_TOKEN (sensitive) by the moderator at the credential stop; the report-back key is pasted into the routine later
- Status: `answered`

### Q-story-row

- Decision key: `story.row`
- Type: `select`
- Source: JUDGE
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Which row is the story?
- Options: the request's "Pentland Vulnerability Use Case" · other
- Recommended: "Pentland Vulnerability Use Case" stays the story row; the live beat-2 name is "Pentland MDM Use Case"; "Pentland PLM Use Case" becomes the rehearsal run's row (dashboard opens at 12 rows, beat 2 make
- Answer: "Pentland Vulnerability Use Case" stays the story row; the live beat-2 name is "Pentland MDM Use Case"; "Pentland PLM Use Case" becomes the rehearsal run's row (dashboard opens at 12 rows, beat 2 makes 13)
- Status: `answered`

### Q-seed-identity

- Decision key: `seed.identity`
- Type: `select`
- Source: STAND-IN, READ, PROFILE
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Whose email/name are owner and manager on the seed rows, so "Waiting on you" and Approve show?
- Options: the presenter's tenant email for the story row · invented people
- Recommended: The story row carries the presenter's own identity as owner AND manager (Gourav Mahunta, gourav.mahunta@unifyapps.com, his real Slack user id resolved from the email at build time), so "Waiting on you
- Answer: The story row carries the presenter's own identity as owner AND manager (Gourav Mahunta, gourav.mahunta@unifyapps.com, his real Slack user id resolved from the email at build time), so "Waiting on you" and Approve show for the signed-in presenter and the DM lands in his own Slack; every story-row child value that names Aarav Mehta or Priya Nair (activity `actor_*`, the Plan iteration `actor_name`, FB-10 `given_by_name`) is swapped to match; every other seed row keeps its invented people; `slack_live false` everywhere until the channel join
- Status: `answered`

### Q-time-budget

- Decision key: `time.budget`
- Type: `select`
- Source: JUDGE
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Delivery window
- Options: the team wants a demo-ready state before 13:00 IST today
- Recommended: Not cut. Build order: objects and seeds, then the Slack tag flow, Start build, Receive build result and Approve gate before History; the code app in parallel; the skill loop last as a second change. T
- Answer: Not cut. Build order: objects and seeds, then the Slack tag flow, Start build, Receive build result and Approve gate before History; the code app in parallel; the skill loop last as a second change. The 13:00 target applies to the six-beat walk without the rehearsal tail
- Status: `answered`

### Q-objects-unread-fields

- Decision key: `objects.unread_fields`
- Type: `text`
- Source: JUDGE
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: (added by the Stand-in)
- Options: Free text
- Recommended: DROP the 16 unread fields and also psl_feedback `category` and `channel` (Judge)
- Answer: DROP the 16 unread fields and also psl_feedback `category` and `channel` (Judge)
- Status: `answered`

### Q-env-app-url

- Decision key: `env.app_url`
- Type: `select`
- Source: JUDGE
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Where does the app address live for the PRD post and the DM?
- Options: env variable · constant
- Recommended: Environment variable POC_STUDIO_APP_URL (plain), saved by the moderator after the first publish
- Answer: Environment variable POC_STUDIO_APP_URL (plain), saved by the moderator after the first publish
- Status: `answered`

### Q-ui-tab-label

- Decision key: `ui.tab_label`
- Type: `select`
- Source: JUDGE
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Tab name for the documents list
- Options: Artifacts · Documents
- Recommended: "Documents" (the request's word)
- Answer: "Documents" (the request's word)
- Status: `answered`

### Q-walk-length

- Decision key: `walk.length`
- Type: `select`
- Source: JUDGE
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: How many beats fit 20 minutes?
- Options: 7 · 6
- Recommended: Six beats, about 15 minutes; the skill-loop beat is out of the walk but still built
- Answer: Six beats, about 15 minutes; the skill-loop beat is out of the walk but still built
- Status: `answered`

### Q-slack-bot-identity

- Decision key: `slack.bot_identity`
- Type: `text`
- Source: READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: What is the bot?
- Options: Free text
- Recommended: Bot user U0C9P6MFR62 (poc_studio_agent), bot id B0C9URVJXPW, workspace UnifyApps T062ZQRR6GG, read with slack_get_user_info on the new connection
- Answer: Bot user U0C9P6MFR62 (poc_studio_agent), bot id B0C9URVJXPW, workspace UnifyApps T062ZQRR6GG, read with slack_get_user_info on the new connection
- Status: `answered`

### Q-seed-presenter-slack

- Decision key: `seed.presenter_slack`
- Type: `text`
- Source: READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Which Slack user is the presenter?
- Options: Free text
- Recommended: U09EK0B6NKD, Gourav Mahunta, confirmed with slack_get_user_info_by_id on the bot connection
- Answer: U09EK0B6NKD, Gourav Mahunta, confirmed with slack_get_user_info_by_id on the bot connection
- Status: `answered`

### Q-slack-email-lookup

- Decision key: `slack.email_lookup`
- Type: `select`
- Source: READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: How are people matched between Slack and the tenant?
- Options: by-email lookup · by-id lookup with the bot token
- Recommended: slack_get_user_info_by_email runs with the user token, which has only users:read, so it fails with missing_scope; automations use slack_get_user_info_by_id with the bot token (name, picture; email whe
- Answer: slack_get_user_info_by_email runs with the user token, which has only users:read, so it fails with missing_scope; automations use slack_get_user_info_by_id with the bot token (name, picture; email when present) and the manager check falls back to the full name
- Status: `answered`

### Q-design-p1-p2

- Decision key: `design.p1_p2`
- Type: `select`
- Source: DESIGNER
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Apply the Designer's two fixes to the cloned CSS?
- Options: apply both · apply none
- Recommended: Apply both: P1 deletes orbit.css line 22 (--accent re-bound to --inner; avatar initials 1.08:1), P2 adds .tag.ob-tag-brand { color: var(--brand-deep) }; each uses only the source's tokens
- Answer: Apply both: P1 deletes orbit.css line 22 (--accent re-bound to --inner; avatar initials 1.08:1), P2 adds .tag.ob-tag-brand { color: var(--brand-deep) }; each uses only the source's tokens
- Status: `answered`

### Q-plan-split

- Decision key: `plan.split`
- Type: `select`
- Source: MODERATOR
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: One plan or two?
- Options: one plan, publish waits for the skill loop · core flow first, skill loop as a second change
- Recommended: Two: the first plan is the core flow with the app's first publish; the skill loop (automations 7 and 8, the Feedback page block, its publish) is a second change, because a publish must wait on every c
- Answer: Two: the first plan is the core flow with the app's first publish; the skill loop (automations 7 and 8, the Feedback page block, its publish) is a second change, because a publish must wait on every code-app task of its app
- Status: `answered`

### Q-env-report-vars

- Decision key: `env.report_vars`
- Type: `select`
- Source: MODERATOR
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: How does Start build know the report-back URL and header?
- Options: ENV variables · constants
- Recommended: Environment variables POC_STUDIO_REPORT_URL and POC_STUDIO_REPORT_HEADER (plain), saved by the moderator once the API exists; the routine payload carries both
- Answer: Environment variables POC_STUDIO_REPORT_URL and POC_STUDIO_REPORT_HEADER (plain), saved by the moderator once the API exists; the routine payload carries both
- Status: `answered`

### Q-routine-fire

- Decision key: `routine.fire`
- Type: `text`
- Source: READ
- Why: it changes the spec and the task graph for the POC Studio Live build.
- Question: Exact routine fire call
- Options: Free text
- Recommended: Read from code.claude.com/docs/en/routines (see claude.beta_header)
- Answer: Read from code.claude.com/docs/en/routines (see claude.beta_header)
- Status: `answered`
