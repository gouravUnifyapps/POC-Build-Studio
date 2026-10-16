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

# Ideator, message 1

Read $REQUEST, $PROFILE, $REFS/storyline-template.md and $REFS/demo-defaults.md. Write $STUDIO/storylines.md: one safe, one bold, one unexpected storyline.

Important framing: this is a working internal tool for UnifyApps' pre-sales / FDE team, not a client pitch. The 'audience' is sales leadership and POC owners; the storyline is the 20-minute walk through the tool working end to end for one prospect POC, 'Pentland Vulnerability Use Case' (a prospect's use case), then a second use case in the same Slack channel, the manager approval round-trip, the Journey with an iteration branch, and the skill-improvement loop.

Beats must be provable on the platform: Slack tag creates a row (the bot asks for the manager if missing, the user tags them in the thread); a scheduled read of the channel logs History entries (owner, profile picture, timestamp, text) attached to the right use case; Documents list; Build CTA that fires the cloud Claude Code run; PRD and mockups returned to Slack; manager Approve in the app notifies the owner 'Manager approved, continue'; Journey (Understand, Plan, Build, Deliver, gates between, status 'Building' / 'Waiting on [Owner]', iteration counters and branch lines, artifacts logged only at approval time); feedback object and the periodic skill-improvement suggestions an admin approves with versions tracked.
The three storylines should differ in which of those is the lean-forward moment and how much of the loop is shown live vs seeded. Keep each within the profile's budget line (3 pages, 7 objects, 8 automations, 2 AI agents). Name entities in the profile's voice. Include the seed rows the profile asks for (8 to 12) and the story row.
Reply in under 12 lines.
