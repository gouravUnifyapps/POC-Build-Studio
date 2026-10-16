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

# Designer, message 1

phase: brand

Run the design system pipeline's Steps 1, 2 and 2b per $REFS/design-system-bridge.md and $REFS/design-system.md, then write $STUDIO/brand.md and the logo kit.

Client slug: unifyapps  ·  client: UnifyApps (internal tool for its own pre-sales / FDE team)  ·  site: https://www.unifyapps.com  ·  profile 'brand' line: the existing app in the solution is the reference; else sample the site.

Extra for this build: the UI is a CLONE. SOURCE (e_6ad1031ce0ef8b24527e9ed9, POC Studio) holds an existing UI. If its preview or published address is reachable in the built-in browser (the Scout is finding it, and writes it in $STUDIO/scout.md under 'Source UI inventory'; you may poll that file for ~2 minutes), screenshot its screens in light and dark and record in brand.md: its dominant hues and neutrals as hex, the font, the layout (rail / header / cards), and whether it already looks like Design Language v3.4. Do NOT sign in to anything or enter credentials; if it needs a sign-in you cannot pass, say so in one line and sample the site only.
Report the pipeline's two stops (hue ambiguity over 30 degrees, a logo that cannot be fetched) in your reply instead of asking. Reply in under 15 lines.
