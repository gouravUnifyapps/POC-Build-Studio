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
# Judge, message 1 (round 1 ruling)

You judge from written evidence only. Read: $STUDIO/ledger.md (demo.intent is settled: use-case; 47 rows settled, 2 user-only, 1 open), $STUDIO/storylines.md (three storylines, each with a Scout block: feasibility, size, no-tool lines), $STUDIO/stand-in.md (scores, the recommendation to MERGE, the seven-beat merged storyline, the build order, the refusals, the 8 automations and 1 agent), $STUDIO/external.md (Slack and routine: connection kinds, credential stops), $STUDIO/data-plan.md, $PROFILE (budget line: 3 pages, 7 objects, 8 automations, 2 AI agents, 3 discussion rounds, 2 rehearsal rounds; 'the request's scope overrides the defaults'), $REQUEST (the person's own words; binding), $STUDIO/source-ui.md §2 and §4 (what the cloned UI already has), $REFS/demo-defaults.md. There is no ideas.md: innovate is off for this build (the request is a precise functional spec).

Write $STUDIO/rulings.md with:
1. **The chosen storyline**: the merged storyline written out as final: title, the seven (or fewer) beats in order, each 'the presenter does X, the screen shows Y' with the page it lands on, the lean-forward beat last, the one failure path, the story row (exactly 'Pentland Vulnerability Use Case', identity per seed.identity), and which beats are LIVE (Slack tag, duplicate refusal, Build click, Approve) versus SEEDED versus the rehearsal run's earlier posts. Resolve the Stand-in's two uncertainties: (a) does the 20-minute slot hold seven beats; if not name the beat to drop and say what stays in the build anyway (a cut beat may still be built if the request names it: scope is the request's, the storyline is the walk); (b) the merged storyline's final entity list, counted against the budget.
2. **The entity list that goes into the spec**, counted: objects (7), automations (8, name each with its one-line job and its trigger kind), AI agents (1), pages/screens (3, and the changes to the cloned code listed as Stand-in's 'UI changes'), connections (Slack, routine: manual tasks), the API chain for Receive build result, environment variables. Mark each line with the beat that uses it. Anything no beat and no request line uses is CUT and listed.
3. **What you cut and why**, three lines. Include the Stand-in's refusals you uphold or overturn (each with a reason), and whether you uphold 'build the skill loop last, do not cut'.
4. **The build order** the plan should follow so the most valuable working flow exists first (the Stand-in gave one; confirm or change it), including which tasks can run in parallel.
5. **Rulings on open rows**: the only open row is data.long_text_limit (a platform question; leave to the Scout, say what plan B you accept). Also rule on any row you find the Stand-in settled badly (keep this short; quote the row key).
6. **Pre-mortem**: the three most likely ways this fails on the day, each with the cheapest mitigation already in the plan.
Reply in under 12 lines.
