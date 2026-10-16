NEBULA=/Users/gouravmahunta/.claude/plugins/cache/nebula/nebula/3.55.4-beta.31.feat-code-builder-mcp
STUDIO_ROOT=/Users/gouravmahunta/.claude/plugins/cache/demo-studio/demo-studio/0.8.1
STUDIO=/Users/gouravmahunta/Desktop/DEMO studio test/POST design skill/Demo studio/.sessions/a932a59d-4d1f-4797-9f59-1910ba6fb591/drafts/studio

# Ideator, round 1

Read, in this order:

1. The request, verbatim: `$STUDIO/request.md`
2. The client profile: `/Users/gouravmahunta/Desktop/DEMO studio test/POST design skill/Demo studio/studio/profiles/unifyapps.md` (drafted by Studio; the request overrides any line)
3. The storyline template: `$STUDIO_ROOT/skills/build/references/storyline-template.md`
4. The demo defaults: `$STUDIO_ROOT/skills/build/references/demo-defaults.md`

The context notes and the Scout's tenant map do not exist yet; they are being gathered in
parallel. Write from the request and the profile.

## What the moderator knows about this build

- This is a working internal tool for UnifyApps' own pre-sales team, not a pitch to a
  prospect. "POC Studio": every prospect POC is a row; the Slack bot creates rows; the app
  shows the journey; a cloud Claude Code session does the building.
- The request asks to clone an existing UI (solution e_6ad1031ce0ef8b24527e9ed9) and wire it to
  a new backend. The existing screens are not read yet. Write beats against the screens the
  request names: the POC dashboard (table of all POCs with stage gates, status, blockers), the
  POC page (the four-stage journey Understand → Plan → Build → Deliver with gates, iteration
  branches and counters, History timeline, Documents, build report / evidence pack /
  artifacts, the Build CTA and Approve), and the admin review of skill-improvement
  suggestions. Do not invent a screen the request does not name.
- Part of every beat happens in Slack (the bot's messages in the prospect channel) and part
  in a Claude Code cloud session. Treat Slack and the cloud session as the places the
  presenter switches to; the app is the record of truth.
- The request's own scope overrides the profile's budget defaults. Under `Needs`, name every
  connection and credential the storyline assumes (a Slack bot / Slack connection on the
  tenant, the Claude Code routine API trigger and its token).
- Failure path candidates the request implies: the bot refusing to create a POC until a
  manager is named; a gate refusing to advance until both the manager and the POC owner
  approve; a judge's feedback sending a stage back (an iteration branch).
- The story row is the request's own example, "Pentland Vulnerability Use Case"; a second use
  case in the same channel shows that one channel can carry two use cases. Seed people are
  invented and say so.
- Platform questions (can an AI agent be deployed as a Slack bot on UnifyApps, can an
  automation run on a schedule and read a Slack channel, can an automation call an external
  HTTP API) are `Open rows` marked `platform question`; do not assume the answer.
