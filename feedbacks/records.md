
### 2026-10-16 · a476dc-automation-agent-2 · unresolved
Bug: The task brief says every Slack step uses `token_type` bot_token, but `compile_and_save_workflow` warns `inputs.unknownKey` for that key on `slack_post_message_in_channel`.
Context: Building automation 6ad1c66313ea2c28e645e538 (POC Studio Live · Start build); the Slack post node passes `token_type: "bot_token"` with connectionId 6ad1be602ac9ba64653a9d36.
Where: unknown
Evidence: save answered ok with warning `"token_type" is not declared by slack/slack_post_message_in_channel`; `get_operation_schema` for that resource lists no `token_type`, while `slack_list_conversation_history` examples pass it. The saved node still carries the key.
Cause: Unknown — next check: post once to a test channel with and without `token_type` and compare `ok`.
Regression: Save a node `op("slack","slack_post_message_in_channel",{channel,messageType:"text",text,token_type:"bot_token"})`; the warning should disappear if the key is declared, or the brief should stop asking for it on this operation.

### 2026-10-16 · a476dc-automation-agent-1 · resolved
Bug: The task brief says every Slack step uses `token_type` bot_token, but `compile_and_save_workflow` refuses that key on `slack_get_user_info_by_id` with an error, so nothing saves.
Context: Building automation 6ad1c663d885ae5a4d9fd8a6 (POC Studio Live · Save POC from Slack); three `slack_get_user_info_by_id` nodes passed `{ user, token_type: "bot_token" }` with connectionId 6ad1be602ac9ba64653a9d36.
Where: nebula
Evidence: save answered `ok:false`, rule `UNKNOWN_INPUT_KEY`: "'token_type' does not exist in type 'Inputs of slack::slack_get_user_info_by_id'. Known properties: 'include_locale', 'user'". After removing the key the save went through and test runs with the same connection returned the user (`run_connector_operation` with and without `token_type` both answered `ok:true` for U09EK0B6NKD).
Cause: Suspected: the plan's "every Slack step uses token_type bot_token" fact was written from operations that declare the key (for example `slack_list_conversation_history`) and applied to all Slack operations; the key is not declared on this one.
Regression: Save `op("slack","slack_get_user_info_by_id",{user:"U09EK0B6NKD",token_type:"bot_token"},{connectionId:"6ad1be602ac9ba64653a9d36"})` and expect the same UNKNOWN_INPUT_KEY error; without the key it saves.

### 2026-10-16 · a476dc-code-app-agent-1 · unresolved
Bug: The app-code-build skill says Code Builder's template build script is `tsc -b && vite build`, but a freshly created code app's `app/package.json` build script is `tsc -b && oxlint -A correctness src && vite build`, so the skill's local build is not the engine's build.
Context: create_code_app (no design system) for "POC Studio Live", app-79ea7266eab9, then reading app/package.json in the downloaded checkout; the skill says to tell the person rather than run a script that says anything else.
Where: nebula
Evidence: `scripts.build` in app/package.json reads `tsc -b && oxlint -A correctness src && vite build`; the skill's § Building locally says the template's script is `tsc -b && vite build`. Both pushes built green on the engine after `tsc -b` and `vite build` passed locally; the oxlint step was not run locally.
Cause: Confirmed: the template added the oxlint step and the skill text was not updated.
Regression: Create a code app, read app/package.json scripts.build, and compare with the skill's stated template script.

### 2026-10-16 · a476dc-code-app-agent-1 · feature
Feature: A refetch interval on the code-app template's `useData` Storage read, so a screen can keep a list current without a hand-written timer.
Evidence: `StorageBinding` in app/src/lib/data.ts holds only object, where, search, sort, limit and offset, and `useData` returns `refetch()`; to make rows written by automations appear without a reload the app needed its own setInterval calling `refetch` on five objects (src/data/orbit.ts).
Benefit: Every code app that shows rows an automation writes needs the same polling, and a timer outside the hook is easy to leave running or to duplicate per component.
Scope: the template's `src/lib/data.ts` `useData` config (an optional `refetchInterval` passed to the underlying query); non-goal: realtime push, which `realtime-mqtt` covers.
Acceptance: `useData('x', 'storage', { object, refetchInterval: 15000 })` reads again every 15 seconds with no other code in the app.

### 2026-10-16 · a476dc-automation-agent-3 · unresolved
Bug: `compile_and_save_workflow` refuses a boolean literal in `storage_by_unifyapps_update_record_fields_by_id` `updateFields[].setValue`, so a single-field write of a boolean column (for example `g1_owner_approved: true`) has no direct form.
Context: Building automation 6ad1c99ad885ae5a4da04722 (POC Studio Live · Receive build result); a `psl_poc` write set `properties.g1_owner_approved` and `properties.g1_manager_approved` (boolean columns) to true with `{ fieldName, actionType: "SET", setValue: true }`.
Where: mcp-tool
Evidence: save answered `ok:false`, rule `INVALID_INPUT_TYPE`: "Type 'boolean' at 'updateFields[1].setValue' is not assignable to type 'string'". It saved after the value came from a `variable_by_unifyapps_create_variables` node (`{ yes: true }`) read as `flags.yes`; the saved node holds the pill. Whether the stored column then holds a boolean or the text "true" was not read back (no test-owned row to write).
Cause: Unknown — next check: save the variable-pill version, run it on a fixture `psl_poc` row, and read `g1_owner_approved` with `get_records` to see its stored type.
Regression: Save a node `op("storage_by_unifyapps","storage_by_unifyapps_update_record_fields_by_id",{object_type:"psl_poc",recordId:"x",updateFields:[{fieldName:"properties.g1_owner_approved",actionType:"SET",setValue:true}]})`; it answers INVALID_INPUT_TYPE before the change and saves after.

### 2026-10-16 · a476dc-agent-builder-1 · unresolved
Bug: `update_agent` capabilities `requestClarification: false` and `generateChartTool: false` create off records, but the run still offers `ClarifyFromUser` and `GenerateChartWithBlocks` to the model.
Context: new advanced agent POC Studio Agent `e_6ad1ca0bc0f97b3e983d2679`, created by `create_agent`, one tool bound with `add_tools`; the goal was an agent that offers only its one tool. Surface: capability records versus the runtime's default tools.
Where: platform
Evidence: `list_capabilities` with `agentId` reported `on: false` for every key both before and after the write, yet `read_trace` `toolsOffered` before and after `update_agent {capabilities:{requestClarification:false, generateChartTool:false}}` (reply: `landed: ["capabilities"]`, both `record: "created"`) was `["GenerateChartWithBlocks","think","ClarifyFromUser","SavePOCFromSlack"]`.
Cause: Unknown — next check: read the agent record's `properties.defaultTools` with `get_agent full` and see whether the runtime reads it ahead of the capability records for a draft run.
Regression: `create_agent`, `add_tools`, `update_agent` with those two keys false, `send_test_message` then `read_trace`: `toolsOffered` should hold only the bound tool (and `think`); it holds `GenerateChartWithBlocks` and `ClarifyFromUser` too.

### 2026-10-16 · a476dc-agent-builder-1 · unresolved
Bug: after `publish_agent` the reply says `publishedVersion: 1` while `get_agent` reads the agent at `version: 6`, and `get_agent` has no published-version field to compare.
Context: POC Studio Agent `e_6ad1ca0bc0f97b3e983d2679`, a new advanced agent that had `version: 1` and `needsPublish: true` before the publish; `publish_agent {confirmed:true}` then `get_agent`. Surface: the version numbers `publish_agent` and `get_agent` print.
Where: unknown
Evidence: `publish_agent` replied `agent.version: 1, published: true, needsPublish: false, publishedVersion: 1, live: true, automationSaid: {response: "success"}`; `get_agent` right after replied `version: 6, published: true, needsPublish: false`, with no `publishedVersion` key.
Cause: Unknown — next check: read the agent's version before and after a second `publish_agent` on an agent with no draft change, and see whether the publish automation itself moves the version.
Regression: Create an agent, publish it, read `get_agent`: the version it prints should equal the `publishedVersion` the publish reply printed, or `get_agent` should name the published version.

### 2026-10-16 · a476dc-automation-agent-2 · unresolved
Bug: `compile_and_save_workflow` refuses a boolean literal as `setValue` of `storage_by_unifyapps_update_record_fields_by_id`, so a boolean field (psl_poc.slack_live) cannot be set with `setValue: true`.
Context: Building automation 6ad1cc2a300f9003500f1da3 (POC Studio Live · Slack listener); updateFields `{ fieldName: "properties.slack_live", actionType: "SET", setValue: true }` on object psl_poc, where slack_live is a boolean.
Where: mcp-tool
Evidence: save answered `INVALID_INPUT_TYPE ... updateFields[1].setValue is a boolean but the schema expects a string`; nothing saved. Worked around by passing a Groovy node's boolean output as a pill (`setValue: classify.result.live`), which compiled; what is stored at run time was not read back.
Cause: Unknown — next check: run the saved node on a throwaway psl_poc row and read slack_live back with get_records (boolean true versus string "true").
Regression: Save an update_record_fields_by_id node that SETs a boolean field, run it on a test row, and read the field back as a boolean.

### 2026-10-16 · a476dc-automation-agent-2 · feature
Feature: A tool that returns the webhook URL of an automation's appEvent trigger (for example slack_on_new_message), for the person to paste into the Slack app.
Evidence: The trigger's `webhookUrl` field is filled by a builder-panel loader (`getWebhookUrl`); `open_workflow` returns no webhookUrl in the saved trigger and no automation-code tool calls that loader, so the URL could not be put in the report.
Benefit: Every build with a Slack, GitHub or other event trigger needs this hand-over step; today it is done by hand in the browser.
Scope: automation-code MCP tools (open_workflow or a new read tool); not changing how webhooks are registered.
Acceptance: Calling the tool with a saved appEvent automation's id returns its webhook URL string.

### 2026-10-16 · a55297-automation-agent-1 · unresolved
Bug: Simple Call LLM (66dfd76eb70dad256986b784) with response_format "json_object" returned text that is not valid JSON, so `utility_by_unifyapps_to_json_object` failed on it, although the `find_workflow_examples` entry for this pattern says json_object "only makes it return valid JSON".
Context: Deployed automation 6ad1cde96123771ba2c052bc (POC Studio Live · Suggest skill improvements), node n_oppp0 called with a system prompt asking for one JSON object with keys summary and proposed_prompt and a content that held a skill prompt plus five feedback texts; node n_ojpv3 parsed `llmResponse` with only `jsonString` and a two-string `jsonSchema`.
Where: platform
Evidence: run 6ad1cebbd885ae5a4da0dd8b: n_ojpv3 output errorMessage "offset 762, character v, line 3, column 422, fastjson-version 2.0.56 ..." with exceptionClass com.alibaba.fastjson2.JSONException. The full llmResponse (read through inspect_workflow_run fullValues) has raw double quotes inside the proposed_prompt string value, for example write "Initial version." and "(assumption)", with no backslash before them. Run ended COMPLETED_WITH_FAILURE and wrote no row.
Cause: Suspected: the model put unescaped double quotes inside a long string value and json_object mode does not enforce escaping; not checked against a second call because the task allowed one run.
Regression: Call 66dfd76eb70dad256986b784 with response_format json_object and a content that is a prompt to rewrite which itself contains quoted words, then parse llmResponse with utility_by_unifyapps_to_json_object; the parse should succeed.

### 2026-10-16 · a55297-automation-agent-1 · unresolved
Bug: `trigger_workflow_run` with runType "workflow" on a deployed scheduled automation returned only a runId, and `inspect_workflow_run` then answered "No run with id ... exists" with a hint that calls it a tool fault and says to tell the user the tool is unreachable; `list_workflow_runs` returned [] until the run had finished.
Context: Deployed automation 6ad1cde96123771ba2c052bc (schedule trigger), one run that took 22.5 seconds because of an LLM call; runId 6ad1cebbd885ae5a4da0dd8b.
Where: mcp-tool
Evidence: Two inspect_workflow_run calls with the returned runId, seconds after the trigger, both failed with "No run with id `6ad1cebbd885ae5a4da0dd8b` exists for automation `6ad1cde96123771ba2c052bc` on this host". list_workflow_runs (runType workflow) returned [] twice, then returned the run with STATUS COMPLETED_WITH_FAILURE, START_TIME 1792134843710, END_TIME 1792134866230. The same inspect call then worked.
Cause: Suspected: a deployed-lane run is readable only after it ends; not checked against a longer-running run.
Regression: Trigger a deployed schedule automation that takes over 20 seconds, call inspect_workflow_run at once, then again after the run ends; the first call should report the run as in progress instead of not found.

### 2026-10-16 · a55297-code-app-agent-1 · unresolved
Bug: The app-code-build skill says Code Builder's template build script is `tsc -b && vite build` and that any other script means the local build is not the engine's, but apps made from the template carry `tsc -b && oxlint -A correctness src && vite build`.
Context: Code app task on app-79ea7266eab9 (and its source app-b4fe5a0a30eb); `app/package.json` "build" in both checkouts; the skill's § Building locally lists only tsc and vite as commands to run.
Where: nebula
Evidence: Expected build script `tsc -b && vite build` per the skill; actual `tsc -b && oxlint -A correctness src && vite build` in both apps. The local tsc and vite passed and the engine built commit 4a87001c green, but the oxlint step the engine runs was never run locally, and the skill's rule would have every code app task "tell the person" about a template default.
Cause: Suspected: the template gained an oxlint step after the skill was written; not checked against the engine's current template.
Regression: Create a code app with create_code_app, download it, and compare `app/package.json` "build" with the script the skill names; they should match, or the skill should name the oxlint step and its local command.

### 2026-10-16 · a55297-code-app-agent-1 · feature
Feature: publish_code_app (or get_code_app) answers the published app's address, the URL people open, next to `deployed`.
Evidence: Plan task t7 asked to quote the published address. publish_code_app on app-79ea7266eab9 answered version v2, commitHash and routes but no URL, and get_code_app and list_code_app_versions answer none either. The only address on record is the preview URL.
Benefit: Every code-publish task and the router's hand-over to the person need the live link; today it cannot be read back.
Scope: code-builder MCP publish_code_app / get_code_app replies; not changing how publishing works.
Acceptance: After a publish, the reply carries the published URL and a signed-in load of it serves the deployed commit.
