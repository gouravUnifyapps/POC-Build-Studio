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

# Scout, message 1: discovery

Read $REQUEST and $PROFILE first. Then do your Discovery as your instructions say, with these specifics.

## What this build is
Not a pitch demo: a working internal tool. "Clone the UI of SOURCE and build a new functional backend linking to it." The new objects, automations, AI agents and the app go into SOLUTION. The cloned UI must end up bound to the NEW backend.

## Reads to make (nebula-bridge.md § Reads in $REFS)
1. $CLI solution context --json ; $CLI entity context solution --json (SOLUTION is new and likely empty).
2. SOURCE is a solution, not an app. Find every entity it links: $CLI solution locate --link "e_6ad1031ce0ef8b24527e9ed9" --json , then the solution's linked assets via get_solution / entity-membership.md. For EACH app, page, object, automation, AI agent it holds: id, name, kind, fields, pages, data sources, what it reads and writes. Use mcp__plugin_nebula_solution__get_solution (cache the answer on disk, do not print it) and the cache commands.
3. **Is the source UI a Code Builder code app, or a no-code Config app, or both?** (cache app says 'mode code' for a code app.) This decides the clone route. For a code app: can mcp__plugin_nebula_code-builder__get_branch_codebase read it (read-only) and does create_code_app / push_code_patch let a new app in SOLUTION start from that source? For a no-code app: do copy_entities / copy_pages / move_entities in application-builder copy it into another solution? State exactly which tool clones what, and what does NOT carry over (data sources bound to the source's objects, automations, permissions, images).
4. List the screens, tabs and regions the source UI shows (Table view of all POCs, POC deep-dive with build report / evidence pack / comments, Journey of four stages Understand-Plan-Build-Deliver with gates and iteration counters, History timeline, Documents, and anything else) and which of them currently read static or seeded data vs an object. Write them as a table: screen | what it shows | data it reads today | data it needs from the new backend.
5. Every connection on the tenant (live read): is there a Slack connection (workspace? bot token?), an HTTP / generic API connector, an Anthropic / Claude connection? Names and active status only, never secrets.
6. NEBULA capability boundaries as your instructions say (task-kinds.md, kit.md, knowledge map).

## Platform questions that are yours to answer through $REFS/ask-nebula.md (Source: NEBULA), one row each, with the exact tool, trigger or limit named
- Can an UnifyApps automation be triggered by a Slack event (app mention of the bot, new message in a channel, member_joined_channel / bot added to a channel)? Which trigger operations does the Slack connector have, and does the trigger need a Slack app / events URL? Can an automation poll a channel's history on a schedule instead (conversations.history, with user and permalink, and user profile image via users.info)?
- Can an UnifyApps AI agent be deployed as a Slack bot (agent-builder list_deployments, a Slack deployment kind), and what must the person supply (bot token, signing secret)? Can that agent call automations as tools, create records in an object, and ask a follow-up in a thread ('who is the manager?') and read the tagged reply? Does the 'Demo Studio' bot name come from the Slack app rather than from UnifyApps?
- Can a scheduled automation call an external HTTPS endpoint with a bearer token header (the Claude Code routine 'fire' API: POST https://api.anthropic.com/v1/claude_code/routines/<id>/fire with an experimental-beta header and a text body)? Which node does it (HTTP / REST / API connector) and where does the token live (env variable, connection)? Can the code app call an automation from a button (CTA) and does that automation make the outbound call?
- Can a code app embed an HTML preview of an artifact stored as a record or file (iframe srcdoc / sandbox) for the 'click a stage to see its artifacts' beat? Can Storage hold a long text field, a file or attachment field, and a user-avatar URL?
- Can the code app read records with filters and sort and write them (create / update status, approve button), and subscribe or poll so the UI updates when the automation writes?
- Scheduled triggers: the smallest interval and how it is expressed.
- Skill versioning and the periodic 'aggregate feedback per skill and propose prompt improvements' automation: can an automation call an LLM node, and which?

## Output
Write $STUDIO/scout.md as your instructions say: Tenant map, **Source UI inventory and clone route** (new section, the answer to 2 to 4 above), Boundaries, platform answers, Open rows. Do not write feasibility lines yet (storylines.md may not exist when you finish; if it does, add them).
Reply in under 25 lines: the clone route you recommend, any Slack / HTTP / Claude connection that exists, the three biggest platform limits, and the open rows.
