NEBULA=/Users/gouravmahunta/.claude/plugins/cache/nebula/nebula/3.55.8
STUDIO_ROOT=/Users/gouravmahunta/.claude/plugins/cache/demo-studio/demo-studio/0.8.1
STUDIO=/Users/gouravmahunta/Desktop/DEMO studio test/POST design skill/Demo studio/.sessions/52426a5b-cd90-4079-9a32-784d7f7dc53d/drafts/studio
CLI=bash "$NEBULA/scripts/run-node.sh" "$NEBULA/scripts/nebula.mjs"   (add --json; CLAUDE_CODE_SESSION_ID=52426a5b-cd90-4079-9a32-784d7f7dc53d is set)
REFS=$STUDIO_ROOT/skills/build/references
WORKDIR=/Users/gouravmahunta/Desktop/DEMO studio test/POST design skill/Demo studio
PROFILE=/Users/gouravmahunta/Desktop/DEMO studio test/POST design skill/Demo studio/studio/profiles/unifyapps.md
REQUEST=/Users/gouravmahunta/Desktop/DEMO studio test/POST design skill/Demo studio/.sessions/52426a5b-cd90-4079-9a32-784d7f7dc53d/drafts/studio/request.md   (read it in full: it is the request word for word)
SOLUTION=e_6ad1b45199f8a565171d7f1c  'POC Studio Live', the NEW solution this build writes to, tenant orbit.uat.unifyapps.com
SOURCE=e_6ad1031ce0ef8b24527e9ed9  'POC Studio', the solution whose UI is to be cloned. READ-ONLY. Never write to it, never edit its entities.
# Connector, message 1

phase: propose

Read $REQUEST, $PROFILE (its 'external' and 'sandboxes' lines), $STUDIO/storylines.md, $STUDIO/scout.md (§ 1 Connections, § 3 boundaries 5 to 9, § 4 Q1 to Q3, § 5), $STUDIO/context-notes.md and $REFS/external-connections.md. Write $STUDIO/external.md.

Framing change for this build: Slack and the Claude Code routine call are NOT a bonus beat, they are the product's core path (the bot creates the POC row, the poller reads channels, the notices go out, the Build button fires a cloud Claude Code run). So instead of proposing 1 to 3 bonus beats, report, with read-only probes only (never create or write anything, never post to Slack, never print a token):
1. Slack: which EXISTING connection on the tenant (names in scout.md § 1; list_connections / get_connection_schema / run_connector_operation with read-only ops such as auth.test / users.info / conversations.list) carries a BOT token for the workspace unifyapps.slack.com, is active, and can (a) list conversations the bot is a member of, (b) read history of a channel, (c) read user profile with image URLs, (d) has the scopes to post and to receive events. Report for each candidate connection: name, id, active, token type, workspace, bot user id/name, scopes seen. If a candidate's identity is 'Raise Issue' or another team bot, report it, and note it is another bot (its name is wrong for this product); say whether a NEW Slack app is needed ('Demo Studio' / 'POC Studio Agent') and exactly what the person must do in Slack (app manifest with the scopes and the event subscription URL placeholder), as a short checklist. Do not guess a connection's workspace: read it.
2. The Claude Code routine fire call (outbound HTTP node, token in an ENV variable): list the exact request the node needs (URL pattern, headers, body shape) from any source you can read (Anthropic docs through WebFetch/WebSearch if you have them, the Nebula files, the tenant). Mark each item verified (source) or unverified. If unverified, say what the one real test fire has to prove.
3. The inbound report-back from the cloud run: the API chain (API Group, API, client, access profile) is built by Nebula; say what exists on the tenant that can be reused for naming and what the cloud run's session needs to call it.
4. The connection stops for the person: a short, minimal list (credential, where it goes), consistent with the profile ('one credential stop allowed for each').
This build still follows your standard rules for read-only probes and no secrets. Reply in under 15 lines.
