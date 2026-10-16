# Solution map

Solution: `POC Studio Live` (e_6ad1b45199f8a565171d7f1c) · tenant orbit.uat.unifyapps.com

## Entities

| Kind | Name | Id | Version | Stale |
|---|---|---|---|---|
| app | `POC Studio Live` | app-79ea7266eab9 | 8 | no |
| page | `global-page-of-app-79ea7266eab9` | e_global_app-79ea7266eab9 | 0 | no |
| automation | `POC Studio Live · Start build` | 6ad1c66313ea2c28e645e538 | 2 | no |
| automation | `POC Studio Live · Save POC from Slack` | 6ad1c663d885ae5a4d9fd8a6 | 2 | no |
| automation | `POC Studio Live · Receive build result` | 6ad1c99ad885ae5a4da04722 | 0 | no |
| automation | `POC Studio Live · Approve gate` | 6ad1c75967956c53e38f1a70 | 1 | no |
| automation | `POC Studio Live · Read channels into History` | 6ad1c9dcbaada8326ecfd65a | 1 | no |
| automation | `POC Studio Live · Slack listener` | 6ad1cc2a300f9003500f1da3 | 3 | no |
| automation | `POC Studio Live · Approve skill suggestion` | 6ad1cd1b6123771ba2c0346e | 1 | no |
| automation | `POC Studio Live · Suggest skill improvements` | 6ad1cde96123771ba2c052bc | 0 | no |
| object | `POC Studio Live · POC` | psl_poc | 0 | no |
| object | `POC Studio Live · Activity` | psl_activity | 0 | no |
| object | `POC Studio Live · Skill` | psl_skill | 0 | no |
| object | `POC Studio Live · Skill suggestion` | psl_skill_suggestion | 0 | no |
| object | `POC Studio Live · Iteration` | psl_iteration | 0 | no |
| object | `POC Studio Live · Document` | psl_document | 0 | no |
| object | `POC Studio Live · Feedback` | psl_feedback | 0 | no |
| ai-agent | `POC Studio Agent` | e_6ad1ca0bc0f97b3e983d2679 | 6 | no |

## Wiring

| From | Part | To | Via | Fields |
|---|---|---|---|---|
| page `global-page-of-app-79ea7266eab9` | `data source Approve skill suggestion` | automation `POC Studio Live · Approve skill suggestion` | data source |  |
| page `global-page-of-app-79ea7266eab9` | `data source Approve gate` | automation `POC Studio Live · Approve gate` | data source |  |
| page `global-page-of-app-79ea7266eab9` | `data source Start build` | automation `POC Studio Live · Start build` | data source |  |
| page `global-page-of-app-79ea7266eab9` | `data source data_delete_app-79ea7266eab9` | object `{{object_type}}` | storage read |  |
| page `global-page-of-app-79ea7266eab9` | `data source data_fetchOne_app-79ea7266eab9` | object `{{object_type}}` | storage read |  |
| page `global-page-of-app-79ea7266eab9` | `data source data_fetch_app-79ea7266eab9` | object `{{object_type}}` | storage read |  |
| page `global-page-of-app-79ea7266eab9` | `data source data_update_app-79ea7266eab9` | object `{{object_type}}` | storage read |  |
| page `global-page-of-app-79ea7266eab9` | `data source data_create_app-79ea7266eab9` | object `{{object_type}}` | storage read |  |
| automation `POC Studio Live · Save POC from Slack` | `node Read the POC row to note the manager on` | object `POC Studio Live · POC` | storage read |  |
| automation `POC Studio Live · Save POC from Slack` | `node Write the manager onto the row, field by field` | object `POC Studio Live · POC` | storage write |  |
| automation `POC Studio Live · Save POC from Slack` | `node Look for a POC with the same use case name, ignoring case, in any channel` | object `POC Studio Live · POC` | storage read |  |
| automation `POC Studio Live · Save POC from Slack` | `node Read an existing POC row of the same channel for its client` | object `POC Studio Live · POC` | storage read |  |
| automation `POC Studio Live · Save POC from Slack` | `node Look for a row that already holds the generated POC id` | object `POC Studio Live · POC` | storage read |  |
| automation `POC Studio Live · Save POC from Slack` | `node Create the POC row, leaving out the values that are blank` | object `POC Studio Live · POC` | storage write |  |
| automation `POC Studio Live · Save POC from Slack` | `node Log the poc_started activity` | object `POC Studio Live · Activity` | storage write |  |
| automation `POC Studio Live · Receive build result` | `node Read the POC row` | object `POC Studio Live · POC` | storage read |  |
| automation `POC Studio Live · Receive build result` | `node Record G1 as passed by the Judge` | object `POC Studio Live · POC` | storage write |  |
| automation `POC Studio Live · Receive build result` | `node Log the Judge's G1 decision` | object `POC Studio Live · Activity` | storage write |  |
| automation `POC Studio Live · Receive build result` | `node Move the row to the G2 gate` | object `POC Studio Live · POC` | storage write |  |
| automation `POC Studio Live · Receive build result` | `node Find the latest version of this document on the row` | object `POC Studio Live · Document` | storage read |  |
| automation `POC Studio Live · Receive build result` | `node Save the document for review` | object `POC Studio Live · Document` | storage write |  |
| automation `POC Studio Live · Receive build result` | `node Log that the gate was posted` | object `POC Studio Live · Activity` | storage write |  |
| automation `POC Studio Live · Receive build result` | `node Move the row to the G3 gate` | object `POC Studio Live · POC` | storage write |  |
| automation `POC Studio Live · Receive build result` | `node Find the latest version of this document on the row` | object `POC Studio Live · Document` | storage read |  |
| automation `POC Studio Live · Receive build result` | `node Save the document for review` | object `POC Studio Live · Document` | storage write |  |
| automation `POC Studio Live · Receive build result` | `node Log that the gate was posted` | object `POC Studio Live · Activity` | storage write |  |
| automation `POC Studio Live · Receive build result` | `node Count the iterations the row already has` | object `POC Studio Live · Iteration` | storage read |  |
| automation `POC Studio Live · Receive build result` | `node Log the change` | object `POC Studio Live · Iteration` | storage write |  |
| automation `POC Studio Live · Receive build result` | `node Open a feedback ticket` | object `POC Studio Live · Feedback` | storage write |  |
| automation `POC Studio Live · Receive build result` | `node Log the change in the activity feed` | object `POC Studio Live · Activity` | storage write |  |
| automation `POC Studio Live · Receive build result` | `node Block the row and say what it is blocked on` | object `POC Studio Live · POC` | storage write |  |
| automation `POC Studio Live · Receive build result` | `node Record the status line` | object `POC Studio Live · POC` | storage write |  |
| automation `POC Studio Live · Approve gate` | `node Read the POC row` | object `POC Studio Live · POC` | storage read |  |
| automation `POC Studio Live · Approve gate` | `node Record the approval and any gate transition on the row` | object `POC Studio Live · POC` | storage write |  |
| automation `POC Studio Live · Approve gate` | `node Stamp last_activity and last_activity_at` | object `POC Studio Live · POC` | storage write |  |
| automation `POC Studio Live · Approve gate` | `node Approve the documents that were in review for this gate` | object `POC Studio Live · Document` | storage write |  |
| automation `POC Studio Live · Approve gate` | `node Log the approval as an activity row` | object `POC Studio Live · Activity` | storage write |  |
| automation `POC Studio Live · Approve gate` | `node Callable` | automation `POC Studio Live · Start build` | call node | `build_run_id`, `message`, `status` |
| automation `POC Studio Live · Read channels into History` | `node Read the live POC rows` | object `POC Studio Live · POC` | storage read |  |
| automation `POC Studio Live · Read channels into History` | `node Write the activity row; an upsert, so a repeat cannot fail` | object `POC Studio Live · Activity` | storage write |  |
| automation `POC Studio Live · Read channels into History` | `node Write the document row; an upsert, so a repeat cannot fail` | object `POC Studio Live · Document` | storage write |  |
| automation `POC Studio Live · Read channels into History` | `node Move the row's cursor to the newest message read` | object `POC Studio Live · POC` | storage write |  |
| automation `POC Studio Live · Read channels into History` | `node Stamp the row's last activity` | object `POC Studio Live · POC` | storage write |  |
| automation `POC Studio Live · Slack listener` | `node Find the use case rows of this channel name` | object `POC Studio Live · POC` | storage read |  |
| automation `POC Studio Live · Slack listener` | `node Link the row to the channel` | object `POC Studio Live · POC` | storage write |  |
| automation `POC Studio Live · Slack listener` | `node Find the row whose manager question thread this is` | object `POC Studio Live · POC` | storage read |  |
| automation `POC Studio Live · Slack listener` | `node Read the POC row` | object `POC Studio Live · POC` | storage read |  |
| automation `POC Studio Live · Slack listener` | `node Approve the gate as the owner` | automation `POC Studio Live · Approve gate` | call node |  |
| automation `POC Studio Live · Approve skill suggestion` | `node Fetch the managers of all POCs, manager columns only` | object `POC Studio Live · POC` | storage read |  |
| automation `POC Studio Live · Approve skill suggestion` | `node Fetch the suggestion` | object `POC Studio Live · Skill suggestion` | storage read |  |
| automation `POC Studio Live · Approve skill suggestion` | `node Fetch the skill the suggestion is for` | object `POC Studio Live · Skill` | storage read |  |
| automation `POC Studio Live · Approve skill suggestion` | `node Fetch the evidence tickets that exist` | object `POC Studio Live · Feedback` | storage read |  |
| automation `POC Studio Live · Approve skill suggestion` | `node Set the skill's current version and prompt` | object `POC Studio Live · Skill` | storage write |  |
| automation `POC Studio Live · Approve skill suggestion` | `node Mark the ticket resolved` | object `POC Studio Live · Feedback` | storage write |  |
| automation `POC Studio Live · Approve skill suggestion` | `node Mark the suggestion approved` | object `POC Studio Live · Skill suggestion` | storage write |  |
| automation `POC Studio Live · Suggest skill improvements` | `node Fetch every skill` | object `POC Studio Live · Skill` | storage read |  |
| automation `POC Studio Live · Suggest skill improvements` | `node Count the skill's pending suggestions` | object `POC Studio Live · Skill suggestion` | storage read |  |
| automation `POC Studio Live · Suggest skill improvements` | `node Fetch the skill's approved suggestions, approval time only` | object `POC Studio Live · Skill suggestion` | storage read |  |
| automation `POC Studio Live · Suggest skill improvements` | `node Fetch the skill's open tickets raised after that approval` | object `POC Studio Live · Feedback` | storage read |  |
| automation `POC Studio Live · Suggest skill improvements` | `node Ask the model for an improved prompt, JSON answer` | automation `66dfd76eb70dad256986b784` | call node | `llmResponse` |
| automation `POC Studio Live · Suggest skill improvements` | `node Write one pending suggestion for the skill` | object `POC Studio Live · Skill suggestion` | storage write |  |

## Not checked

- ai-agent `POC Studio Agent` (e_6ad1ca0bc0f97b3e983d2679): its tools are not in the cache (get_agent)
