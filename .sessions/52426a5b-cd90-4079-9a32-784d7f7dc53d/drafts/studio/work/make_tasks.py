import json, re, sys
W = "/Users/gouravmahunta/Desktop/DEMO studio test/POST design skill/Demo studio"
S = W + "/.sessions/52426a5b-cd90-4079-9a32-784d7f7dc53d/drafts/studio"
spec = open(S + "/poc-studio-live.md").read()
contract = spec.split("## Contract")[1].split("## Business rules")[0]
lines = [l[2:] for l in contract.split("\n") if l.startswith("- ")]
C = {}
for l in lines:
    head, _, rest = l.partition(":")
    parts = [p.strip() for p in head.split(" · ")]
    C[(parts[0], parts[2] if len(parts) > 2 else parts[1])] = rest.strip()

def line(kind, op, name):
    for l in lines:
        if l.startswith(f"{kind} · {op} · {name}:"):
            return l
    raise KeyError((kind, op, name))

SEED = S + "/data/seed"
SLACK_CONN = "6ad1be602ac9ba64653a9d36"
tasks = []
def T(id, title, kind, entity, deps, body, proof, **kw):
    t = dict(id=id, title=title, kind=kind, entity=entity, dependsOn=deps, body="\n".join(body), proof=proof)
    t.update(kw)
    tasks.append(t)

# ---------- objects ----------
def obj(tid, name, source, deps, extra_read=""):
    ln = line("object", "create", name)
    T(tid, f"Create object {name}", "object", {"kind": "object", "name": name}, deps, [
        f"1. Read: `entity context object --name \"{name}\" --json` (a new entity has no id yet) and `search` for the id `{name}` to confirm it is free; read the source object `{source}` with `get_objects` (its fieldDefinitions and picklist titles) as the model to mirror, read-only, never edit it. {extra_read}If the object already exists or the scoping fact below differs from what you read, stop and report.",
        f"2. Done when: the contract below holds exactly, with the object id exactly `{name}`. Contract: {ln}",
        "3. Apply with one `apply_object_batch` `create_object` step (fields as JSON Schema, `required` as its own list, the index in the same step; read `object-storage-manager` § Object schema format first). A picklist stores the code and carries the label as its title. Set `sortable` true on the fields the app sorts or filters on (`status`, `stage`, `created_at`, `poc`) and `searchable` on the name field; never set `maxLength` on a text field; a lookup to `psl_poc` stores the parent's `poc_id` string.",
        "4. Read back: `get_objects` for the object (parts fields, fieldDefinitions, indexes): `wrote` true, `unmirroredFields` empty, the index status SUCCESS; quote the primary key, the required list and one picklist with its codes.",
        "5. Report ids, readBack, unverified and notes, and a `handover:` note with the object id, its primary key field and its picklist codes for the tasks that seed it and read it.",
    ], f"get_objects on {name} answers wrote true, unmirroredFields empty, the primary key, the required list, every picklist's codes and the index SUCCESS, matching the contract line.")
obj("t1", "psl_poc", "orbit_studio_poc", [])
obj("t2", "psl_activity", "orbit_studio_activity", ["t1"])
obj("t3", "psl_document", "orbit_studio_document", ["t1"])
obj("t4", "psl_iteration", "orbit_studio_iteration", ["t1"])
obj("t5", "psl_feedback", "orbit_studio_feedback", ["t1"])
obj("t6", "psl_skill", "orbit_studio_feedback", [], "There is no source twin: build it exactly from the contract. ")
obj("t7", "psl_skill_suggestion", "orbit_studio_feedback", [], "There is no source twin: build it exactly from the contract. ")

# ---------- seeds ----------
def seed(tid, name, fname, deps, note):
    ln = line("record", "seed", name)
    T(tid, f"Seed {name}", "record", {"kind": "object", "name": name}, deps, [
        f"1. Read: `entity context object --name \"{name}\" --json`, then `get_objects` for `{name}` to read its required list and picklist codes; read the seed file `{SEED}/{fname}` whole (a JSON file with the primary key and the rows). If an enum value or a lookup in the file is not a code the object holds, stop and report the row.",
        f"2. Done when: every row of that file exists in `{name}` with the values as given (empty values are already left out of the file; never send an empty string or a null for a picklist or lookup). Contract: {ln} {note}",
        "3. Apply with `apply_record_edits` `create` operations, parents first, at most 20 rows a call; the primary key field is the record id and no `id` is sent; fields take the plain name (`poc`, not `properties_poc`). Rows that already exist are never rewritten: read the rows first and write only the missing ones.",
        f"4. Read back: `get_records` for `{name}` with `total` equal to the number of rows in the file, and one row read by its primary key with every field of the file present; quote the total and that row's primary key.",
        "5. Report ids, readBack, unverified and notes.",
    ], f"get_records on {name} answers a total equal to the rows of {fname}, and a row read by its primary key carries the file's values.")
seed("t8", "psl_skill", "psl_skill.json", ["t6"], "")
seed("t9", "psl_poc", "psl_poc.json", ["t1"], "The story row is `POC-pentland-vulnerability-20261001`: read it by id and quote its owner, manager, stage, current gate, g2 status and approvals.")
seed("t10", "psl_document", "psl_document.json", ["t3", "t9"], "The PRD row is the long-text test: write it first and read it back with its `content` field; the stored length must equal the file's length and the string must be whole.")
seed("t11", "psl_feedback", "psl_feedback.json", ["t5", "t9"], "")
seed("t12", "psl_iteration", "psl_iteration.json", ["t4", "t9"], "")
seed("t13", "psl_activity", "psl_activity.json", ["t2", "t9"], "")
seed("t14", "psl_skill_suggestion", "psl_skill_suggestion.json", ["t7"], "")

# ---------- automations ----------
AUTO_FACTS = (
    f"Facts: the Slack connection is `POC Studio Live Slack`, id `{SLACK_CONN}` (authType token); every Slack step uses `token_type` bot_token and that connection id; the bot is user `U0C9P6MFR62` (`poc_studio_agent`) in workspace `T062ZQRR6GG`. Objects are `psl_poc`, `psl_activity`, `psl_document`, `psl_iteration`, `psl_feedback` (read each with `describe_storage_object` first for its required fields and picklist codes). Environment variables are read as `ENV.NAME`. Writes to an existing record set single fields (`update_record_fields_by_id`), never replace a whole record; `update_record_by_id` is an upsert only with `upsert` true. Dates are epoch milliseconds."
)
def shell(tid, name, deps, inputs, outputs, desc):
    T(tid, f"Shell: {name}", "automation-shell", {"kind": "automation", "name": name}, deps, [
        f"1. Read: `search_workflows` for `{name}`. If it exists, stop and report: a shell is only for a new automation.",
        f"2. Create the callable automation `{name}` with `setup` = {inputs} and `result` = {outputs}, and a stub body that returns a typed value for every output field (the stub answers `status` \"error\" and a `message` saying it is a contract shell). {desc}",
        "3. `compile_and_save_workflow` with no `workflowId`, fixing every finding until it saves.",
        "4. `deploy_workflow` with that `workflowId`, deploymentNotes `Contract shell for " + name + "`. Step 3 must be the last save.",
        "5. Read back `search_workflows` for its `deployment` and `describe_callable_workflow` for its inputs; quote both. Report the `workflowId` in `ids.entity`, and a `handover:` note with the workflow id and the exact input keys.",
    ], f"search_workflows shows {name} with a deployment and describe_callable_workflow lists exactly the shell's input keys.")

def logic(tid, name, deps, spec_line, extra, proof, shellid=None):
    body = [
        f"1. Read: `search_workflows` for `{name}`" + (" and open the shell's `workflowId` from `Built so far` with `open_workflow` (keep its input and result contract)" if shellid else " (it must not exist yet)") + "; load `automation-runtime`, `data-fetching`, `data-transforms-and-code`, `dates-and-time`, `node-inputs-and-pills` and `resiliency` before writing a node; read `get_dsl_reference` once. If the contract below differs from what the shell holds, stop and report.",
        f"2. Done when: the automation implements this contract exactly: {spec_line}",
        f"3. {AUTO_FACTS} {extra} Compile with `compile_and_save_workflow`" + (" using the shell's `workflowId`" if shellid else "") + ", fixing every finding until it saves. Do not deploy.",
        "4. Read back: `open_workflow` for the saved definition and quote its trigger, the node names in order and the result schema; for a callable, `describe_callable_workflow` for its inputs.",
        "5. Report ids, readBack, unverified and notes, and a `handover:` note with the workflow id, its input keys and its result keys.",
    ]
    T(tid, f"Build {name}", "automation", {"kind": "automation", "name": name}, deps, body, proof)

def deploy(tid, name, dep):
    T(tid, f"Deploy {name}", "deploy", {"kind": "automation", "name": name}, [dep], [
        f"1. Read: `search_workflows` for `{name}` to get its `workflowId` and the saved `definitionVersion`.",
        "2. Done when: the saved version is the deployed version.",
        f"3. `deploy_workflow` with that `workflowId`, deploymentNotes `{name}`; fix any compile finding it names only by reporting it.",
        "4. Read back `search_workflows`: `deployment.status` DEPLOYED and `definitionVersion` equal to the saved version read in step 1; quote both.",
        "5. Report ids, readBack, unverified and notes.",
    ], f"search_workflows shows {name} deployment DEPLOYED with definitionVersion equal to the saved version.")

A2 = "POC Studio Live · Save POC from Slack"
A1 = "POC Studio Live · Slack listener"
A3 = "POC Studio Live · Read channels into History"
A4 = "POC Studio Live · Start build"
A5 = "POC Studio Live · Receive build result"
A6 = "POC Studio Live · Approve gate"

shell("t15", A2, ["t1", "t2"],
  "`channel_id` string, `channel_name` string, `tagger_slack_id` string, `use_case` string, `thread_ts` string, `manager_slack_id` string, `poc_id` string",
  "`status` string, `poc_id` string, `message` string",
  "It is the AI agent's tool: the agent builds its arguments from these input names.")
logic("t16", A2, ["t15", "t1", "t2"], line("automation", "create", A2),
  "Every branch ends with a result; the `exists` branch writes nothing. Slack lookups: `slack_get_user_info_by_id` (token_type bot_token) returns `user.real_name` and `user.profile.email` when present; the email may be absent: store only what exists. The first word of a use case name capitalised is the client name unless an existing row of the same channel gives it. Use `storage_by_unifyapps_fetch_records` filters in the shape `data-fetching` gives, and `storage_by_unifyapps_create_record` for the new row (the primary key `poc_id` is the record id). A re-delivered call for a row that exists answers `exists`, never a second row.",
  "open_workflow shows a callable with the contract's inputs and result, a fetch by use case, a create of psl_poc, the manager branch and a result on every path.", shellid=True)
deploy("t17", A2, "t16")

shell("t20", A4, ["t1", "t2"], "`poc_id` string, `mode` string, `approved_prd_link` string",
  "`status` string, `build_run_id` string, `message` string", "It is called by the app's Build button and by Approve gate.")
logic("t21", A4, ["t20", "t1", "t2"], line("automation", "create", A4),
  "The outbound call is one `custom_http_endpoint_execute` step: `baseUrl` `https://api.anthropic.com`, `path` `/v1/claude_code/routines/:routine_id/fire` with `pathParamsList` routine_id = `ENV.CLAUDE_ROUTINE_ID`, `httpMethod` POST, `headersList` with `Authorization` = `Bearer ${ENV.CLAUDE_ROUTINE_TOKEN}`, `anthropic-beta` = `experimental-cc-routine-2026-04-01`, `anthropic-version` = `2023-06-01`, `Content-Type` = `application/json`, JSON body with one `text` string built from the `key: value` lines in the contract, `responseSchema` {type, claude_code_session_id, claude_code_session_url}. HTTP error statuses are returned as data: branch on `status`. Keep the token only in that one step. `report_url` and `report_header` come from `ENV.POC_STUDIO_REPORT_URL` and `ENV.POC_STUDIO_REPORT_HEADER`; if either is not saved yet they read as empty, so send them as given and do not fail the build.",
  "open_workflow shows a callable with the contract's inputs and result, a guard on build_run_id, one HTTP step to the routine fire URL with ENV-based path and bearer header, a branch on its status, the row update, the activity row and the Slack post.", shellid=True)
deploy("t22", A4, "t21")

shell("t23", A6, ["t1", "t2", "t3"], "`poc_id` string, `role` string, `caller_email` string, `caller_name` string, `caller_slack_id` string",
  "`status` string, `gate_passed` boolean, `warnings` list of strings, `message` string", "It is called by the app's Approve button and by the Slack listener.")
logic("t24", A6, ["t23", "t20", "t1", "t2", "t3"], line("automation", "create", A6),
  "The shell of `" + A4 + "` is in `Built so far`: call it by its `workflowId` with `callables_call_automation` for the second cloud run; it answers `status` and `build_run_id`. Open the Slack conversation with `slack_open_conversation` (users = the owner's Slack id) and post to the returned channel id with `slack_post_message_in_channel`; both steps and the Start build call use `onError` CONTINUE and add a line to `warnings` on failure. The state transitions come from the source app's own code: read `/Users/gouravmahunta/Desktop/DEMO studio test/POST design skill/Demo studio/app-b4fe5a0a30eb/main/app/src/orbit/lib/actions.ts` and `loop.ts` and reproduce them exactly (which stage follows which gate, what `status` becomes, what text `last_activity` carries). The app link is `ENV.POC_STUDIO_APP_URL` plus `/pocs/` plus the `poc_id`; if the variable is not saved yet it reads as empty, so build the message without a link rather than failing.",
  "open_workflow shows a callable with the contract's inputs and result, the identity check, the gate transitions, the activity row, the document flips, then the direct message and the Start build call each continuing on error.", shellid=True)
deploy("t25", A6, "t24")

logic("t28", A5, ["t1", "t2", "t3", "t4", "t5"], line("automation", "create", A5),
  "The trigger is `callables_from_api` (a `callableApi` automation, endpoint type REST, request body with the keys in the contract, responses 200, 400 and 404); every path ends with `respond()`. Slack posts use `slack_post_message_in_channel` to the row's `slack_channel_id`, the owner direct message uses `slack_open_conversation` then a post to the returned channel id, each with `onError` CONTINUE. The channel post's first line is `[` + the `poc_id` + `]` exactly. Documents are written with `storage_by_unifyapps_create_record`; version = one higher than the highest version of a document of the same name on the row (read the row's documents first). Never log or echo the request body's `content` fields. If `ENV.POC_STUDIO_APP_URL` is not saved yet it reads as empty: omit the link rather than failing.",
  "open_workflow shows a callableApi trigger with the contract's body keys, branches for plan, final, feedback and status, a 404 and a 400 response, and every path ending in respond().")
deploy("t29", A5, "t28")

logic("t34", A3, ["t1", "t2", "t3"], line("automation", "create", A3),
  "The trigger is `schedule({cron: \"INTERVAL\", frequency: \"MINUTES\", interval: 1, sequential: true})`; add `maxWaitTime` and `sequentialRunTimeUnit` only if the compiler asks for them. Use native `for` loops (channel, then message); `slack_list_conversation_history` takes `token_type` bot_token, `channel`, `oldest` = the smallest `slack_last_ts` of the channel's live rows, `limit` 200; sender lookups use `slack_get_user_info_by_id` (picture `user.profile.image_72`, name `user.real_name`); permalinks use `slack_chat_get_permalink` (`channel`, `message_ts`). Convert a Slack ts to epoch milliseconds in one small Code step (multiply the seconds by 1000 and keep the integer). Write each activity row as an upsert (`update_record_by_id` with `upsert` true and the whole row) so a repeated message can never raise a duplicate-key failure. A channel the bot cannot read (an error from Slack) is skipped with a log line and the next channel continues. The run ends with `stop()`.",
  "open_workflow shows a schedule trigger every minute, a fetch of live psl_poc rows, nested loops over channels and messages, the Slack history, user and permalink steps, upserts into psl_activity and psl_document and the cursor update.")
deploy("t35", A3, "t34")

# ---------- agent ----------
agent_line = line("ai-agent", "create", "POC Studio Agent")
T("t18", "Create AI agent POC Studio Agent", "ai-agent", {"kind": "ai-agent", "name": "POC Studio Agent"}, ["t15", "t17", "t9"], [
    "1. Read: `list_agents` for `POC Studio Agent` (it must not exist; if a copy exists, stop and report its id), `list_models` to confirm model `e_69b41a443d6f1815768c245f` is active with tool calling, and `describe_entity` for the automation `" + A2 + "` (its `workflowId` is in `Built so far`; use its shell contract).",
    f"2. Done when: an advanced agent `POC Studio Agent` exists with that model and these instructions and one tool. Contract: {agent_line}",
    "3. Apply `create_agent` (advanced, model above), `update_agent` for the instructions (plain words, first the job in one line, then the rules, then the three answers), `add_tools` with the automation `" + A2 + "` (`enabled` true, `topicId` \"GLOBAL\"). Do not publish here.",
    "4. Test with `send_test_message` using a message whose use case already exists: lines `channel id: C0SEED0001`, `channel name: pentland-poc`, `tagger slack id: U09EK0B6NKD`, `thread ts: 1.0`, then the text `Pentland Vulnerability Use Case`. The tool must be called once with that use case name verbatim and the reply must say the name already belongs to a channel (the automation answers `exists` and writes nothing). Then `read_trace` for the run: `toolsOffered` names the tool and `toolCalls` carries its arguments; quote both. Never test a name that does not exist: that would create a real row.",
    "5. Report ids (the agent id in `ids.entity`), readBack (`get_agent` readiness, the bound tool), unverified and notes, and a `handover:` note with the agent id.",
], "get_agent shows POC Studio Agent with the model, the instructions and the tool bound; read_trace of the test shows the tool offered and called once with the use case verbatim.")
T("t19", "Publish AI agent POC Studio Agent", "publish", {"kind": "ai-agent", "name": "POC Studio Agent"}, ["t18"], [
    "1. Read: `get_agent` for `POC Studio Agent` (id in `Built so far`): `needsPublish`, the bound tool and the model.",
    "2. Done when: the agent has a published version that the invoke-agent node of an automation runs.",
    "3. Apply `publish_agent` with `confirmed` true (the release line of the profile is the person's yes: publish without asking, visibility private). Do not call `deploy_agent`: the Slack listener runs the agent through an automation step, not through a copilot deployment.",
    "4. Read back `get_agent`: `needsPublish` false and a `publishedVersion`; quote both.",
    "5. Report ids, readBack, unverified and notes, and a `handover:` note with the agent id for the Slack listener.",
], "get_agent shows needsPublish false and a publishedVersion.")

# ---------- listener ----------
logic("t26", A1, ["t19", "t23", "t1", "t2"], line("automation", "create", A1),
  "The agent is called with the invoke-agent callable (`callables_call_automation` of `68050ca67df58855654804a0`, required `aiAgentId` = the published agent's id from `Built so far`, `userQuery` = the structured lines, `sessionId` not used: each turn is stateless). Its reply is at `publicResponse[0].text`. The trigger is `appEvent(\"slack\", \"slack_on_new_message\", ...)` on the connection above; use `triggerInputCondition` to drop events with a `bot_id` and events whose `event.user` is the bot; the bot's id is also `authorizations[0].user_id`. A tag is a message whose `event.text` contains `<@U0C9P6MFR62>`. A thread reply has `event.thread_ts` different from `event.ts`. The channel name comes from `slack_get_conversation`. Handle `member_joined_channel` (where `event.user` equals the bot) once and ignore the `channel_join` message subtype. Do not answer twice for a Slack retry: use `event_id` plus the thread ts to stop when the same event was already answered (a reply by the bot in that thread already exists, read with `slack_list_conversations_replies`). Approve gate is called with `callables_call_automation` through the shell's `workflowId` in `Built so far`. Every path ends with `stop()`. Do not paste or print the webhook URL anywhere but your report.",
  "open_workflow shows the Slack new-message trigger with the bot filter and the four branches (join, tag, manager thread reply, owner approve reply) calling the agent, Approve gate and the Slack post.")
deploy("t27", A1, "t26")

# ---------- API chain ----------
T("t30", "Create API Group POC Studio Live API", "api", {"kind": "api_group", "name": "POC Studio Live API"}, [], [
    "1. Read: `list_api_groups` for `POC Studio Live API` (must not exist) and the workspace id the tenant's other groups use.",
    "2. Done when: an API Group named `POC Studio Live API` exists with the path `poc-studio-live`.",
    "3. Apply `save_api_group` with that name and path in the tenant's workspace.",
    "4. Read back `get_api_group`; quote its id, name and path.",
    "5. Report ids, readBack, unverified and notes, and a `handover:` note with the group id.",
], "get_api_group shows the group's name and path.")
T("t31", "Create API receive build result", "api", {"kind": "api", "name": "POC Studio Live API · receive build result"}, ["t30", "t29"], [
    "1. Read: `get_api_group` for the group in `Built so far`, `list_apis` for it, and the deployed state of the callable automation `" + A5 + "` (its `workflowId` is in `Built so far`; it is deployed).",
    "2. Done when: a POST API named `POC Studio Live API · receive build result` with the path `receive-build-result` exists in the group, backed by that callable automation.",
    "3. Apply `save_api` (group id, name, path, methods POST, backing CALLABLE_WORKFLOW with that automation, apiType REST).",
    "4. Read back `get_api`: the full URL, the backing automation and the contract; quote them. Never call the API in this task: the first call writes real rows.",
    "5. Report ids, readBack, unverified and notes, and a `handover:` note with the API id and the full call URL (no key).",
], "get_api shows the API in the group with its URL and the backing automation.")
T("t32", "Create client POC Studio Live client", "api", {"kind": "client", "name": "POC Studio Live client"}, [], [
    "1. Read: `list_clients` for `POC Studio Live client` (must not exist).",
    "2. Done when: a client named `POC Studio Live client` exists.",
    "3. Apply `save_client` with that name in the tenant's workspace.",
    "4. Read back `get_client`; quote its id and name.",
    "5. Report ids, readBack, unverified and notes, and a `handover:` note with the client id.",
], "get_client shows the client.")
T("t33", "Create access profile POC Studio Live report-back", "api", {"kind": "access_profile", "name": "POC Studio Live report-back"}, ["t32", "t30", "t31"], [
    "1. Read: `get_client` and `get_api_group` for the ids in `Built so far`; `get_access_profile` is not needed because no profile of this name exists.",
    "2. Done when: an access profile named `POC Studio Live report-back` of the client, with the auth token method and access to the group `POC Studio Live API` only, exists.",
    "3. Apply `save_access_profile` (client, name, the group, auth method AUTH_TOKEN). The key is shown once: the bridge writes it to a private file and the reply names that path as `secretFile`; never open, print or copy the key, and put only the path in a `Key file:` line of your report.",
    "4. Read back `get_access_profile`: quote its id, its groups and `howToCall` (the header name the caller must send, which the routine's payload carries). Then `call_api` once is NOT run here.",
    "5. Report ids, readBack, unverified and notes, a `Key file:` line with the path, and a `handover:` note with the header name from `howToCall`.",
], "get_access_profile shows the profile with the group and howToCall; the key itself is only in the private file.", )

# ---------- code app ----------
DP = S + "/design-package.md"; DM = S + "/design.md"; PN = W + "/studio/design-system/unifyapps/port-note.md"
SRC = W + "/app-b4fe5a0a30eb/main"
RULE = "Components come from the class inventory, never a second implementation, never a new colour value, never a Tailwind colour, radius, shadow or type utility: Tailwind only for layout the kit has no class for."
T("t36", "Code app: create POC Studio Live and clone the source screens", "code-app", {"kind": "code-app", "name": "POC Studio Live"},
  ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t9", "t10", "t11", "t12", "t13"], [
    f"1. Read: `list_code_skills`, then `read_code_skill` for every `alwaysInPrompt` file of `app-builder` and the skills for Storage data and automation integration; read `{DP}` (the design package: rules 1 to 9) and `{PN}` whole; the source checkout is already on disk at `{SRC}` (read-only: never hold, push, publish or change the source app `app-b4fe5a0a30eb`); if the files differ from `{PN}`'s sha-256 figures or the source head moved, say so and continue from what is on disk.",
    f"2. Done when: a new code app named `POC Studio Live`, PRIVATE, exists, built by `create_code_app` (no design system id), whose source holds the source's screens: `src/orbit/**` and `src/data/orbit.ts` from `{SRC}/app/src/`, plus `src/assets/unifyapps-lockup-reversed.png`, `src/assets/unifyapps-mark-reversed.png`, `public/unifyapps-app-32.png` and the two font links and the title of the source's `index.html`; `src/App.tsx` is edited, not copied: it keeps the new app's generated basename block and adds the three CSS imports (`tokens.css`, `bundle.css`, `orbit.css`, in that order), the Orbit provider, the shell and the three routes `/`, `/pocs/:pocId`, `/feedback`; the engine and template files are never copied (design-package rule 4); `views/poc/BranchMark.tsx` is not ported.",
    f"3. The stylesheet is the source's three files byte for byte (design-package rule 1) with exactly these two edits and no other byte changed: fix P1 deletes line 22 of `orbit.css` (the `--accent` re-bind to `--inner`), fix P2 adds `.tag.ob-tag-brand {{ color: var(--brand-deep); }}` at the end of `orbit.css`. Name both edits in the read-back. {RULE} Light theme only: keep the shell's `data-theme` light, wire no dark mode, add no toggle.",
    "4. Data: `create_code_app_data_sources` with the Storage source once for the app; in `src/data/` set the entity map to the seven new object ids `psl_poc`, `psl_document`, `psl_feedback`, `psl_activity`, `psl_iteration`, `psl_skill`, `psl_skill_suggestion`; change the field names only where the new objects differ from the source's: `psl_poc` drops `tier`, `approvers`, `demo_date`, `watch_email`, `documents_count`, `open_feedback_count`, `tenant_host` and adds `slack_channel_id`, `owner_slack_id`, `manager_slack_id`, `build_run_id`, `slack_live`, `slack_last_ts`, `bot_thread_ts`; `psl_activity` adds `actor_avatar_url`, `slack_ts`, `slack_ref` and drops `note`, `related_ticket`; `psl_document` drops `path_in_build_session`, `size_bytes`, `file`; `psl_feedback` drops `category`, `channel`, `channel_ref`, `parent_ticket`, `given_by_email`, `related_document` and adds `iteration`. Every write the app makes (the approve write stays in this task as the source has it, until the Approve task replaces it) must send only fields the new objects hold, because the objects refuse extra fields. Brand strings: the document title and the rail label read `POC Studio Live`; the empty-state copy and the Feedback page's sub line keep the source's words.",
    f"5. Settings with `update_code_app_settings`: panel `security` PRIVATE; panel `csp` allowing `avatars.slack-edge.com` and `secure.gravatar.com` for images and the font hosts `fonts.googleapis.com` and `fonts.gstatic.com` (read `get_code_app_settings` first: each list is replaced whole, so send the existing entries too). Build locally (`bun install --ignore-scripts`, `tsc -b`, `vite build`) until green, then `hold_code_branch`, `push_code_patch`, `release_code_branch`. Never run git. Read back: the push's `commit` and `files`; `get_code_app` answering that commit as `head.sha`; `get_code_app_settings` showing PRIVATE and the CSP origins; the committed `bindings.ts` with a non-empty `FETCH` id and the seven entity ids; the `previewUrl` of the green push, quoted.",
    "6. Report ids (the app id as `ids.entity`), readBack, unverified (say what the preview showed: does Home list the seeded use cases, does the story row open with a Plan counter of 2; if the preview is signed-in only, say so) and notes, and a `handover:` note with the app id, the branch, the routes and the preview address.",
], "get_code_app answers the push commit as head.sha; get_code_app_settings shows PRIVATE and the CSP origins; the committed bindings.ts has a non-empty FETCH id and the seven psl entity ids; the preview of Home lists the seeded use cases.")

T("t37", "Code app: Home status rule, Build button, History bubbles, refetch, Documents tab", "code-app", {"kind": "code-app", "name": "POC Studio Live"},
  ["t36", "t20"], [
    f"1. Read: `get_code_app` for `POC Studio Live` (the app id and head are in `Built so far`); the checkout from `get_branch_codebase`; `read_code_skill` for the automation-integration and data skills (every `alwaysInPrompt` file) and report the option the data hook gives for refetching on an interval; read `{DM}` (the Home block and the POC page blocks 1, 4 and 5) and `{DP}` rules 2 and 5.",
    f"2. Done when, exactly as `{DM}` describes each region and using only the classes it names: (a) Home: the derived status in the Status column, one predicate feeding that cell, the \"Waiting on you\" filter count and the rail badge, with its exact conditions (status `running`, stage `0_kickoff`, empty `build_run_id`); \"Building · <phase label>\" for a row with a `build_run_id` and no open gate; (b) POC page header: a leading client name dropped from the use case, the Build button (`.btn.btn-p`, shown only to the owner while the predicate holds, states working, success, already running, failed as toasts) which calls the automation `POC Studio Live · Start build` with `poc_id` and mode `plan`, and afterwards a secondary \"Claude session\" link to `build_run_id`; (c) the tab \"Artifacts\" renamed \"Documents\"; (d) the channel printed with a hash; (e) History: rows with `slack_ts` as left-aligned chat bubbles (round picture from `actor_avatar_url` or initials, sender, text, the time linking to `slack_ref`), every other kind as a centred notice, plus the four CSS rules of `{DM}` appended to the end of `orbit.css`; (f) the lists refetch on an interval of 15 seconds (or the nearest the data hook allows) so rows written by the automations appear without a reload. No entrance animation. {RULE}",
    "3. Data: the app reads `psl_poc`, `psl_document`, `psl_activity`, `psl_iteration` and `psl_feedback` through the Storage sources already in `bindings.ts`, and calls `POC Studio Live · Start build` (its shell is in `Built so far`) through its own automation data source: `create_code_app_data_sources` with `kind` automation, that `automationId`, `inputFields` `poc_id`, `mode` and `approved_prd_link`, and a name; the app sends `mode` `plan`.",
    "4. Read back: the push's `commit` and `files`; `get_code_app` answering the commit as `head.sha`; `callables.ts` holding that automation's block; `bindings.ts` still naming a `FETCH` id; the `previewUrl`, quoted. A signed-in preview check (a seeded row and the story row) goes in `unverified` when the preview cannot be opened.",
    "5. Report ids (the app id as `ids.entity`), readBack, unverified and notes, and a `handover:` note with the app id, the branch, the routes and the preview address for the next task.",
], "get_code_app answers the push commit as head.sha; callables.ts holds the Start build automation's block; the committed source has the status rule, the Build button, the bubble History and the Documents label.")

T("t38", "Code app: approval card, To review list, Approve through the automation", "code-app", {"kind": "code-app", "name": "POC Studio Live"},
  ["t37", "t23"], [
    f"1. Read: `get_code_app` for `POC Studio Live` and the checkout from `get_branch_codebase`; read `{DM}` (POC page block 2, the approval card) and `{DP}` rules 2 and 5; read the source's own approve code that is now in the checkout (`src/orbit/lib/actions.ts`, `views/poc/ApprovalCard.tsx`) before replacing it.",
    f"2. Done when, exactly as `{DM}` describes it: the approval card gains the \"To review\" list of the open gate's `in_review` documents (each row opens the Reader; absent when there are none), the channel prints with a hash in the note, and the Approve button (manager only, the one `.btn.btn-p` of its state) no longer writes the records itself: it calls the automation `POC Studio Live · Approve gate` with `poc_id`, `role` `manager`, the signed-in viewer's email and full name (from the platform user context the app already reads), `caller_slack_id` left empty. The five outcomes are the page's default toasts: working (disabled, aria-busy, \"Approving…\"), saved (\"Plan approved\" or \"Your approval of Plan is saved\"), saved with a Slack warning when the result's `warnings` is not empty, already decided (refetch, button gone), forbidden. {RULE}",
    "3. Data: the app reads `psl_poc` and `psl_document` through the Storage sources and calls `POC Studio Live · Approve gate` (its shell is in `Built so far`) through its own automation data source: `create_code_app_data_sources` with `kind` automation, that `automationId`, `inputFields` `poc_id`, `role`, `caller_email`, `caller_name`, `caller_slack_id`, and a name. A failed automation still answers HTTP 200, so read the result's `status` field, never the HTTP status. Remove the source's direct update and activity insert for approval; nothing else in the app writes records.",
    "4. Read back: the push's `commit` and `files`; `get_code_app` answering the commit as `head.sha`; `callables.ts` holding the Approve gate block next to the Start build block; the `previewUrl`, quoted.",
    "5. Report ids (the app id as `ids.entity`), readBack, unverified and notes, and a `handover:` note with the app id and the preview address.",
], "get_code_app answers the push commit as head.sha; callables.ts holds the Approve gate block; the committed source has the To review list and Approve through the automation, with no direct approve write left.")

T("t39", "Publish code app POC Studio Live", "code-publish", {"kind": "code-app", "name": "POC Studio Live"},
  ["t36", "t37", "t38", "t22", "t25"], [
    "1. Read: `get_code_app` for `POC Studio Live`: the head, `gitLinked`, `busy` and the current deployment; the branch must be free (released).",
    "2. Done when: the head commit of the last code-app task is the deployed version of the app.",
    "3. Apply `publish_code_app` with a `versionNote` \"POC Studio Live v1: the cloned POC Studio UI on the new psl_ objects, Build button, Approve through Slack\".",
    "4. Read back the reply's `deployed` read-back: `deployed` true with the `commitHash`, and the published address; quote them. The publish adds its own commit, so never compare the head to the deployed commit.",
    "5. Report ids, readBack, unverified and notes, and a `handover:` note with the published address and the app id (the main session saves the address as `POC_STUDIO_APP_URL`).",
], "publish_code_app answers deployed true with a commitHash and the published address.")

json.dump(tasks, open(S + "/tasks.json", "w"), indent=1)
print(len(tasks), "tasks")
