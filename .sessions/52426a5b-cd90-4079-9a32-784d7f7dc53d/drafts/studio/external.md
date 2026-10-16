# External connections: POC Studio Live (Connector, phase propose, message 1)

Read 2026-10-16 on orbit.uat.unifyapps.com. Read-only probes only: `slack_get_user_info`
(auth.test), `slack_get_user_info_by_id`, `slack_list_user_conversations`, `slack_list_users`
(2 rows), `slack_list_conversation_history` (limit 1, answered channel_not_found, no content read),
`slack_pins_list` and `slack_list_user_group_members` (used only to make Slack name the token's
scopes in a `missing_scope` reply). Nothing was posted, created or changed. No token, no secret was
read or printed; user emails and phones that came back in a reply are not copied here.

Framing (message 1): Slack and the Claude Code routine call are the product's core path, not a bonus
beat. Profile: `external: sandbox` (one credential stop per system), `sandboxes: slack: the tenant's
Slack connection when one exists · claude code: a routine with an API trigger, made in this session`.
There is no separate Slack sandbox workspace: every probed connection is the real workspace
`unifyapps.slack.com` (team T062ZQRR6GG). This is an internal tool, so that is the intended workspace;
posts the build makes are labelled and listed for cleanup (see Rules).

## 1. Slack

### Inventory
- 231 connections on the tenant; `list_connections` for slack alone returns at least 200 rows (about 140
  active). Name search over the whole tenant for `poc`, `demo`, `studio`, `orbit`, `claude`, `nebula`,
  `raise`, `issue`, `unify` found no connection named for POC Studio, Demo Studio or POC Studio Agent
  (`studio` has no match; `Poc_knowledge` exists but answers invalid_auth).
- The list gives no workspace, token type or bot, so the likely candidates were read with
  `slack_get_user_info` (bot_token). All answered workspace UnifyApps, `unifyapps.slack.com`, team
  T062ZQRR6GG. 12 connections probed: 8 answered (6 distinct bots; three connections carry the same one),
  4 failed (invalid_auth or account_inactive). The other ~130 active Slack connections were not probed
  (their names say nothing about the bot). None of the 20 most recently modified names is named for this
  product.
- Scopes come from Slack's own `missing_scope` reply (`provided`), the only place a token's scopes can be
  read. Seen for 5 bots; the Service Request Bot never hit a missing scope, so its list is not shown.

| Connection (id) | Active | Token type seen | Bot (user id, bot id) | Bot scopes seen | In POC channels |
|---|---|---|---|---|---|
| Raise Issue Bot - Slack (6ac9d88b4b756e23f47017aa) | yes | bot + user (the user token is the presenter's own) | "Raise Issue", `raise_issue` (U0C8836KEBC, B0C821GDK1R) | app_mentions:read, chat:write, reactions:write, channels:history, groups:history, users:read, usergroups:read | no: history on #poc-team-loop and #pentland-pm answers channel_not_found |
| claude integration (6aca7157da005460d07c3418); same bot on nebulaSlack (6abe5482e8737970315193a6) and slack-allscopes-anshul (68a5c2352ed01363b9e7ed3b) | yes | bot + user (user token is another person's) | "Service Request Bot", `unifyapps7` (U06QKBA2VS5, B06Q02MU6R4) | broad (has channels:read, groups:read, pins:read, usergroups:read); full list not shown | member of 30 private/public channels (first 10 read, none POC); not in the POC channels |
| UnifyAssist Reaction token 2 (6a0560fc68a03c36ce5bbd47) | yes | bot | "AskUnify", `askunify` (U098W9DGUPL, B098W9DFXFU) | app_mentions:read, chat:write, chat:write.customize, reactions:write, channels:history, groups:history, channels:read, groups:read, im:read, im:write, im:history, files:read, files:write, users:read, users:read.email, users.profile:read, usergroups:read/write, workflow.steps:execute, incoming-webhook, others | not read; this is the platform help bot |
| Cronus (694137e750af412ec89f7ecf) | yes | bot | "Cronus", `cronus` (U0A3UUL0WHY, B0A3STLLLB0) | app_mentions:read, chat:write, channels:history, groups:history, im:history, mpim:history, channels:read, groups:read, im:read, im:write, files:read, users:read, reactions:read/write, others; no users:read.email | not read |
| GTM Agent (67723f32953a975f6823a324) | yes | bot | "Unify Alert", `unify_alert` (U086QACGF3P, B0875RWPDHP) | app_mentions:read, chat:write, channels:history, groups:history, channels:read, users:read, users:read.email, users.profile:read, im:history; no groups:read | not read |
| slack_manoj (68a8ad9d5366c07a364b1bfd) | yes | bot, rotating token (`expires_in` 13517 s) | `test_trigger` (U08J7H9JHT7) | no history, no app_mentions | first call ok, second call invalid_auth: unusable |
| Connection-Slack-UnifyApps (6aa3ee0e5c8fbe457f896846), UnifyApps DT Alerts (67a06fb01702557b647f24b1), Poc_knowledge (68a57c396de8e543fd00896a) | listed active | | | | invalid_auth: the stored token is dead |
| SRE (6907b22ad501541f8cd34941) | listed active | | | | account_inactive |

### What each of your four questions comes to
(a) List conversations the bot is a member of: works on the Service Request Bot (`slack_list_user_conversations`
with the bot's own user id); fails on Raise Issue (needs channels:read, groups:read). The product does not
need this call: a row stores its channel id, and a bot learns its channels from the join event.
(b) Read the history of a channel: every bot with channels:history and groups:history can, but only in
channels it was invited to. Proven the other way round: both Raise Issue and Service Request Bot answer
`channel_not_found` for the two POC channels (#poc-team-loop C0C9FCDLGE6, #pentland-pm C0C8MB4RKC1,
private), so neither is a member there. A new bot starts in zero channels too.
(c) Profile with image URLs: works with `users:read` alone, on a bot and on a person. `slack_get_user_info_by_id`
returned image_24 to image_512 and image_original (https://avatars.slack-edge.com/...) and real_name,
display_name. Allow `avatars.slack-edge.com` (and `secure.gravatar.com` for bots with no picture) in the
code app's CSP.
(d) Post and receive events: chat:write is on Raise Issue, AskUnify, Cronus, GTM Agent (Service Request Bot's
scope list was not shown, so its chat:write is unread; posting itself was not tried, the tool refuses writes).
Receiving events depends on the Slack app's Event Subscriptions URL, which no API reads; Slack allows one
Request URL per app, so reusing any of these apps would overwrite the URL their own automations rely on
(Raise Issue's "Raise issue on mention [DND]" automation is DEPLOYED and must not be disturbed).

### Verdict
No existing connection carries a bot that is named for this product, sits in the POC channels and is free to
point at a new webhook. The closest on scopes is AskUnify (has everything), the closest on ownership is Raise
Issue (the presenter's, but it lacks channels:read and groups:read and its name is wrong). Both would show the
wrong bot name to prospects' channel members and both apps' event URLs are in use.
**A NEW Slack app is needed, named "POC Studio Agent"** (the team's own spec of 2026-10-16 01:23 uses this
name; the request says "Demo Studio" once, and in this workspace "Demo Studio" already means the presenter's
Claude plugin).

Degraded fallback, no new app (not recommended): poll-only on the Raise Issue connection. It can read history
and post, but the bot's name is "Raise Issue", it must still be invited to every channel, the tag is found by
polling for `<@U0C8836KEBC>` (60 s delay), and nothing arrives live.

### Checklist for the person in Slack (once, about 10 minutes)
1. api.slack.com/apps, Create New App, From an app manifest, workspace UnifyApps, paste the manifest below.
2. Install to Workspace. Copy the Bot User OAuth Token (starts xoxb-). The connection form also requires a
   user token (the form lists botToken and userToken as both required): copy the installing person's User OAuth
   Token only if the form refuses an empty one. Every Slack node the build writes uses `bot_token`, so the user
   token is never called. Keep token rotation OFF (the `slack_manoj` connection above shows how a rotating
   token dies mid-session).
3. Give both tokens to the main session at the credential stop only (below), never in chat history or a file.
4. After the build deploys the "Slack listener" automation: Event Subscriptions, paste its webhook URL as the
   Request URL (the platform's help text: "Setup this webhook url in you Slack App"), save.
5. In each prospect channel, including #pentland-poc: `/invite @POC Studio Agent` (private channels need an
   explicit invite). Nothing is read or posted in a channel the bot is not in.

Manifest (the URL line is the only placeholder):
```yaml
display_information:
  name: POC Studio Agent
  description: Creates POC rows when tagged, logs channel updates, relays approvals
features:
  app_home:
    home_tab_enabled: false
    messages_tab_enabled: true
    messages_tab_read_only_enabled: false
  bot_user:
    display_name: POC Studio Agent
    always_online: true
oauth_config:
  scopes:
    bot:
      - chat:write
      - channels:history
      - groups:history
      - channels:read
      - groups:read
      - users:read
      - users:read.email
      - im:write
      - files:read
      - reactions:write
settings:
  event_subscriptions:
    request_url: https://<webhook URL of the deployed "Slack listener" automation, pasted after deploy>
    bot_events:
      - message.channels
      - message.groups
      - member_joined_channel
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```
Why these: `message.channels` and `message.groups` carry the tag (`<@bot>` in `event.text`), the thread reply
that names the manager (`event.thread_ts`) and files; `member_joined_channel` (and the `channel_join` message
subtype) is "bot added to a channel". Do not also subscribe `app_mention`: a tag would arrive twice (once as
app_mention, once as message.*) and the bot would answer twice. `users:read.email` matches a Slack person to a
tenant user for the manager's Approve; `im:write` + the Messages tab let the bot DM the owner.

## 2. The Claude Code routine fire call (outbound HTTP node)

No web tool was available in this session, no Nebula file states the routine API, and no connector in the
catalogue fires a routine (`anthropic` has 19 operations, all Messages API, Files, Batches and Managed Agents
beta sessions; `anthropic_enterprise` has 4 compliance reads; `list_apps claude` is empty). So the only route is
the HTTP node, and every request detail below that is not about the node is **unverified**, written from the
public Anthropic "routines" API trigger documentation as remembered, not read today.

| Item | Value | Status |
|---|---|---|
| Node | `custom_http_endpoint` / `custom_http_endpoint_execute`, takes no connection; `baseUrl`, `path` (path params as `:name` in `pathParamsList`), `httpMethod`, `headersList` [{key,value}], `requestContentType`, `bodySchema`/`body`, `responseContentType`, `responseSchema`; output `result` and `status` | verified (get_operation_schema read today; Scout read the ENV rule in `nebula-change`) |
| Secret handling | `Authorization: Bearer ${ENV.CLAUDE_ROUTINE_TOKEN}`; the token is an ENV variable saved sensitive by the main session | verified pattern (Scout Q3, `env-variables`, `nebula-change` § Secret values) |
| Method and URL | `POST https://api.anthropic.com/v1/claude_code/routines/<trigger id>/fire`; baseUrl `https://api.anthropic.com`, path `/v1/claude_code/routines/:routine_id/fire`, path param from `ENV.CLAUDE_ROUTINE_ID` | unverified (memory of Anthropic docs) |
| Header `Authorization` | `Bearer <routine token>`; the token is made in the routine's API trigger panel, is shown once, and belongs to that routine | unverified |
| Header `anthropic-beta` | `experimental-cc-routine-2026-04-01` | unverified; the name and the date-stamped value are the least certain item |
| Header `anthropic-version` | `2023-06-01` | unverified |
| Header `Content-Type` | `application/json` | unverified |
| Body | JSON `{"text": "<free text handed to the session as its first message>"}`; `text` is the only documented field, so everything the run needs travels inside it | unverified |
| Response | HTTP 200, JSON with `type: "routine_fire"`, `claude_code_session_id`, `claude_code_session_url` | unverified |

What the node should send (a design, not a fact): one `text` block with `key: value` lines the routine's saved
prompt parses: `command: /build`, `prospect`, `use_case`, `row_id`, `slack_channel_id`, `mode: plan|build`,
`approved_prd_link` (mode build only), and the report-back URL path. The saved prompt (written by the person in
the routine) says: use an empty folder that is not a git repository, install Nebula, run `/build` with the
prospect and use case, and call the report-back API when a stage finishes. Store `claude_code_session_url` on
the row so the dashboard can link the running session.

What the ONE real test fire has to prove (label it `DEMO-TEST` in `text`; one run, one session):
1. HTTP 200 and a session id and URL come back: the URL, the `anthropic-beta` value, the version header and the
   body shape are all right in one call. A 400/404/401 body names the wrong one (read `errorDetails.body`).
2. The session receives the `text` verbatim (open `claude_code_session_url`).
3. The cloud environment can install Nebula in a non-repository folder (a cloud session with the company
   repository attached failed on 2026-10-06 per the notes).
4. The cloud environment can reach `https://orbit.uat.unifyapps.com` (its network setting must allow that host)
   and the inbound API accepts the key from inside the session (section 3). This is the step most likely to fail.
5. Rate: a routine has a daily run cap per account (unverified); the 20-minute demo needs 2 fires for the second
   storyline, so check the cap before the rehearsal.

## 3. The inbound report-back from the cloud run

- What Nebula builds: a `callableApi` (callables_from_api) automation "Receive build result" with `respond()`,
  then API Group, API (backing a CALLABLE_WORKFLOW), client, access profile; the key is shown once. (Scout
  Q1/boundary 9; skill `api-groups` and `api-access`.) Only a deployed callable automation can back an API.
- What exists to reuse (read by the Scout, not re-read here; the API Manager tools are not in the Connector's
  tool set, so existing API Groups, clients and access profiles were NOT listed): five DEPLOYED callable
  automations tagged `POC_STUDIO`, named "Orbit Studio API · poc create / poc update / poc get / log activity"
  and "POC Studio API · log activity (sample)". Reuse the naming (`<Product> API · <verb>`): "POC Studio Live API
  · receive build result", API Group "POC Studio Live API". Do not reuse the Orbit contracts or their client:
  they write the Orbit objects, and a new access profile limited to the new group is the least a key can
  reach.
- What the cloud run's session needs, all four handed over once at the credential stop, never in chat:
  1. the full HTTPS URL: `https://orbit.uat.unifyapps.com` + the API's path (Nebula returns it at creation),
  2. the header name and value format that the chosen authentication method requires (Auth Token API key: the
     header name is read back by Nebula when the client is made; do not guess),
  3. the key itself (shown once): the person pastes it into the routine's secrets or environment,
  4. the request body: `{row_id, kind: plan|final, link, summary?}` and the response `{status: posted|row_not_found}`.
  Plus: the cloud environment's network allowlist includes `orbit.uat.unifyapps.com`.
- The report-back is not a Slack call: the automation posts to Slack with the bot connection; the cloud run holds no
  Slack token.

## 4. Connection stops for the person (minimal, one per system)

| # | System | Who does what | What is given | Where it goes |
|---|---|---|---|---|
| 1 | Slack | person: create the app from the manifest, install, copy tokens (section 1); main session: `create_connection` after `get_connection_schema` (authType TOKEN; fields botToken, userToken; OAUTH_WITH_CLIENT_CONFIG takes clientId and clientSecret instead and needs no pasted token) | Bot token (and the form's user token) | a new connection "POC Studio Live Slack" in the tenant; the connection test must pass before it is saved; the id goes into every Slack node |
| 2 | Claude Code routine | person: create the routine with an API trigger in Claude (prompt as in section 2), copy trigger id and token; paste the report-back key (section 3) into the routine's secrets; main session: `save_env_variables` | routine trigger id, routine token, and, the other way, the report-back key | ENV `CLAUDE_ROUTINE_ID` (plain), `CLAUDE_ROUTINE_TOKEN` (sensitive); no connection object exists for this; the key lives in the routine, not in the tenant's files |

Both stops are manual tasks for the main session; no builder creates a connection or reads a secret.
Not stops (no credential): pasting the webhook URL into the Slack app, `/invite @POC Studio Agent` per channel.

## Lines for the brief

- connection · create · slack · sandbox · "POC Studio Live Slack" · manual task (main session, connection-manager) ·
  fields per `get_connection_schema slack`: name, authType TOKEN, botToken, userToken, revokeTokenOnDelete false
- manual · routine · person creates the routine; main session saves ENV `CLAUDE_ROUTINE_ID`, `CLAUDE_ROUTINE_TOKEN`
  (sensitive); the fire is the HTTP node, so no connection line
- automation · create · slack · `slack_on_new_message` (trigger) → `ai_agents_by_unifyapps_invoke_agent` →
  `slack_post_message_in_channel` (`token_type bot_token`, `thread_ts` = event.thread_ts or event.ts) · inputs from the
  event: `event.channel`, `event.user`, `event.text`, `event.ts`, `event.thread_ts`, `event.subtype` · results
  created / needs manager / exists / noted
- automation · create · slack · scheduled poll: `slack_list_conversation_history` (`bot_token`, `channel` = the row's
  channel id, `oldest` = last seen ts) → `slack_get_user_info_by_id` (profile.image_72, real_name) →
  `slack_chat_get_permalink` → Storage write · result vocabulary: count written
- automation · create · custom_http_endpoint · `custom_http_endpoint_execute` POST per section 2, header values from
  `ENV.*` only · result: started (session url stored) / already running / error
- automation · create · slack · `slack_post_message_in_channel` to the owner's Slack user id for "Manager approved,
  continue" and "BUILD is complete" (DM via the bot; confirm in the first test run) and to the channel for the PRD and
  built assets
- Rules · Slack: the only posts the build makes outside the story are one test post per channel, text starting
  `DEMO-TEST`, in #pentland-poc or a channel the person names, and are listed in the runbook with channel id and
  message ts for deletion by the person. Routine: exactly one test fire, `text` starting `DEMO-TEST`, its session
  id and URL listed in the runbook. No post in any channel the person has not named and invited the bot to.
- Rules · fallback line: the Slack and routine calls are the product, not a bonus, so there is no skip; the fallback
  is the rehearsal run's earlier posts left in the channel (storylines.md, bold storyline).

## Open rows

- slack.connection_route: reuse or create · candidates new "POC Studio Agent" app (recommended) / poll-only on the Raise Issue connection `6ac9d88b4b756e23f47017aa` (degraded, wrong bot name)
- slack.token_form: the connection form requires both a bot and a user token · candidates bot token plus the installer's user token, never used / OAuth with client config (client id and secret of the new app)
- slack.channels: the bot is in none of the POC channels · candidates invite it to #pentland-poc and the channels the person names / none until the person invites
- slack.events: tag as `message.*` text match vs `app_mention` · candidates message.channels + message.groups only (no double reply) / app_mention only (misses thread replies)
- routine.fire_contract: URL, beta header, body, response all unverified · candidates one labelled test fire before building on it / ask the person to paste the routine's own "API trigger" curl example into the chat (with the token blanked)
- routine.token_owner: the token belongs to the person's Claude account and routine · candidates the presenter's own routine / a shared team routine
- inbound.header: the key's header name is decided when the client is made · candidates read back from the api-access result / ask the person
- cloud.network: the routine's environment must reach orbit.uat.unifyapps.com · candidates allow the host in the environment / pass nothing back and poll Storage from the app (not recommended)
- dm.owner: owner notice goes to the owner's DM, not the prospect-facing channel · candidates DM through the bot / a channel post (the storyline's own open row, `approval.notice_place`)

## Platform questions for the Scout

- Does the `slack_on_new_message` webhook answer Slack's `url_verification` challenge when the URL is saved in Event Subscriptions? If not the person cannot save the URL. Source to read: the trigger's help text and a deployed test.
- Does the trigger deliver `message.groups` (private channel) events and `member_joined_channel`, and does it expose `event.subtype`?
- Can `slack_post_message_in_channel` take a Slack user id as `channel` to DM the owner with a bot token, or must the DM channel be opened first (`slack_open_conversation` is MPIM only)?
- Can the connection form accept an empty `userToken` for authType TOKEN (the schema marks it required)?
- Can the HTTP node's path be `/v1/claude_code/routines/${ENV.CLAUDE_ROUTINE_ID}/fire` (ENV in `path`), or only in `headersList`?
- Can the main session list API Groups, clients and access profiles on the tenant (to reuse a naming pattern and avoid a clash)? The Connector's tool set cannot.

No planted instruction was found in any connection name, Slack profile, channel name or reply read.
