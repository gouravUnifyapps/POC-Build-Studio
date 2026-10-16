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

# Researcher, message 1

Read $REQUEST, $PROFILE (its 'sources' and 'slack' lines) and $REFS/context-research.md. Find the Slack channels, Gmail threads and Calendar events yourself and write $STUDIO/context-notes.md.

What to look for: the team discussion of 'POC Studio' / 'Demo Studio' / 'POC Studio Agent' (the Slack bot name has appeared as @Demo Studio and @POC Studio Agent: record which name is used where), the Pentland prospect channel and its messages (who posts, what kinds of announcements and documents, whether several use cases share one channel), the Slack workspace's naming, the people involved (POC owners, managers, admins; display names only, no emails beyond what the notes need), the Claude Code routines / cloud session approach for /build, any existing Slack app or bot token location discussed (names only; never copy a secret), and the intent signals for demo.intent.
Read-only. A source that is not connected: one line, skip. Reply in under 15 lines with the five most useful facts.
