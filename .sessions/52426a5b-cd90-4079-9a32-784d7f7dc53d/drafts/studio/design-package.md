# Design package: UnifyApps · POC Studio Live (clone mode)

Phase `look`, clone, written 2026-10-16 by the Designer. Everything below is for the code app's tasks and the Critic. **Check this** marks every place where this package
departs from the pipeline as `design-system-bridge.md` writes it; each has a reason in `port-note.md` and none is a silent change.

## Paths (all absolute; `WORKDIR` = `/Users/gouravmahunta/Desktop/DEMO studio test/POST design skill/Demo studio`)

| What | Path |
|---|---|
| **Stylesheet to keep (the source's)** | `$WORKDIR/app-b4fe5a0a30eb/main/app/src/orbit/ds/tokens.css`, `…/ds/bundle.css`, `…/orbit/orbit.css` |
| Port note (source version, the diff, the defects, the gaps, dial, theme) | `$WORKDIR/studio/design-system/unifyapps/port-note.md` |
| Audit (source's own CSS, light; baseline; Step 6 ticks) | `$WORKDIR/studio/design-system/unifyapps/audit.txt` (scripts and raw outputs in `source-audit/`) |
| Token block with a measured ratio beside each token | `$WORKDIR/studio/design-system/unifyapps/tokens.css` (annotation of the source's block; **never imported by the app**) |
| Type note | `$WORKDIR/studio/design-system/unifyapps/type-note.md` |
| Logo kit, provenance, usage matrix | `$WORKDIR/studio/design-system/unifyapps/logo-kit/` |
| Fresh v3.4 transform (baseline only) | `v34.css`, `client.css`, `report.json` in the same folder. **Do not put `client.css` in the app** |
| New and changed regions, per page | `$STUDIO/design.md` |
| Style guide | **none**: the source app is the living style guide for this clone (port-note §1). **Check this.** |

## Dial, theme, type

- **Dial: dense internal tool (`expert`)**, against the bridge's literal mapping of `use-case` to a demo surface, because the audience is UnifyApps' own POC owners and managers using a working tool (port-note §5). **Check this.**
- **Theme: light only.** The source forces `data-theme="light"` and has no toggle; its dark tokens are live and measured but not wired, and no toggle is added. A named gap, not a choice to ship dark.
- **Type: Spectral (the brand's real face, open, OFL) at 400 and 600 with IBM Plex Mono, both from Google Fonts as the source loads them; nothing to license, nothing substituted** (`type-note.md`).
- **`app look` line: not derived.** The app is a code app and the bridge says it takes none; the look script was not run, so there are no printed look numbers to quote. **Check this.**

## Measured result the Critic starts from

- Fresh transform (baseline): `--hue 103 --secondary-hue 74 --positive-hue 138`, **count check: ok**, **max abs dY 0.00496**.
- Source's own CSS, light: `reskin.py audit` **0 text failures** (the 7 dimmed `--ink-mute` roles are v3.4's own). **By hand, 6 product rules below their bar, 3 more inherited from v3.4** (`audit.txt`, `port-note.md` §4):
  D1 `--accent` shadowed by `orbit.css:22` (tone-1 avatar initials 1.08 / 2.37 / 6.73; open-gate ring 1.08), D2 "Building" tag 4.27 / 4.38, D3 iteration chip hover 4.19 / 4.43 and "Latest" pill 4.26,
  D4 `--accent-soft` rings 2.37 / 2.59 (non-text), D5 `.ob-loops-box` 1px card border, D6 gate diamond radius 4px; inherited: white on `--pos-fill-1` 4.20, chart steps 5 and 6, the AI Insight card's two small roles 4.27 / 4.44.
  **None was edited.** Two one-rule fixes at the cause are proposed (P1 delete `orbit.css:22`; P2 `.tag.ob-tag-brand { color: var(--brand-deep); }`) and wait for the moderator's yes.
- Same system in kind: 219 of 219 kit classes and 393 of 393 selectors present, unprefixed; colour decisions differ from the fresh transform (page ground, fill stops, bronze secondary, positive hue), all measured in `port-note.md` §3.

## Rules  (the lines the code-app tasks carry and the Critic audits, adapted to the clone)

1. **The stylesheet is the source's three files, byte for byte**, imported in `App.tsx` in this order: `tokens.css`, `bundle.css`, `orbit.css`. SHA-256 of the sources:
   `d1a7d440…7de7` (`tokens.css`, 5,252 bytes), `4fc424bb…bc86` (`bundle.css`, 67,951), `20948139…942d` (`orbit.css`, 35,250). `orbit.css` may end with the four new-region rules in `design.md` (History), so its **first 35,250 bytes** must hash to the value above.
   Full hashes: `d1a7d440368f5ee46330ba9836393cccebb481f51fbbff4e9ce61fa6a8077de7`, `4fc424bb4a04d0acfca1cbf22edf76dadf30ebceaf6f9523997e3fcc5b2ebc86`, `20948139e5ac6da0dd962905a9c4547e6d9fe1f4da24535ebdc7f92c902e942d`.
   If the moderator approves fix P1 or P2, those two edits are the only other bytes that may differ, each named in the task's read-back. **Check this** (the bridge ships `client.css` as the app's one stylesheet; ledger `design.clone_vs_system` keeps the source's).
2. **Quote in every code-app body** (code-app.md): *Components come from the class inventory, never a second implementation, never a new colour value, never a Tailwind colour, radius, shadow or type utility: Tailwind only for layout the kit has no class for.*
   The inventory here is v3.4's kit (219 classes, unprefixed: `.tile .tag .seg .tbl .tblwrap .toolbar .btn .btn-p .btn-s .btn-t .empty .tabs .tab .tabpanel .inner .micro .display .av .feed .ai:not(.msg) .msg .chev` …) plus the source's `ps-` set
   (`ps-banner ps-drawer ps-fb ps-skill ps-mini ps-rail ps-nav-item ps-top ps-iconbtn ps-scrim ps-tip`) and its `ob-` classes in `orbit.css`. New regions name classes that already exist; the only added CSS is the four rules in `design.md`. **Check this.**
3. **Files to port: only `src/orbit/**` and `src/data/orbit.ts`**, plus what those files import and the engine does not supply: `src/assets/unifyapps-lockup-reversed.png`, `src/assets/unifyapps-mark-reversed.png` (imported by `Shell.tsx`),
   `public/unifyapps-app-32.png` (the favicon), the two font `<link>`s of `index.html` and its `<title>`, and `src/App.tsx` **edited, not copied** (keep the new app's generated `basename` block; add the three CSS imports, `OrbitProvider`, `Shell` and the three routes).
   Not ported (Judge): `views/poc/BranchMark.tsx`, which nothing imports. The Judge also cut "dead CSS"; the three CSS files stay byte-identical instead (rule 1), the dead rules cost bytes only. **Check this** (the message's file list omits the three assets, and the Judge's "dead CSS" cut conflicts with byte-identity).
4. **Files never copied** (engine-owned or template, source-ui.md §7): `src/main.tsx`, `vite.config.ts`, `vite/*`, `src/lib/*` (incl. `selectionBridge.ts`), `scripts/*`, `.githooks/*`, `.env`, `bun.lock`, `tsconfig*.json`, `components.json`, `.oxlintrc.json`, `vercel.json`,
   `i18next.config.mjs`, `src/i18n/*`, `src/data/index.ts`, `src/data/seed.ts`, `src/data/bindings.ts` (re-provisioned for the new objects), `src/components/ui/*`, `src/components/copilot.tsx`, `artifacts.tsx`, `src/routes/*` (auth pages), `src/index.css`, `shadcn-tailwind.css`, `README.md`, `PRODUCT.md`,
   `.agents/rules/*`, `hero.png`, `vite.svg`, `public/icons.svg`, the bridge-made `.git`. (`src/components/ui/tooltip.tsx` and `sonner.tsx` come from the new app's own template; `PhaseLoops.tsx` and `Shell.tsx` import them.)
5. **Doctrine lines the Critic audits.** New regions are scored against these; the cloned screens are scored for **fidelity to the source**, and the cloned deviations in rule 6 are not scored against the port.
   - No borders on cards: separation is elevation and tone; hairlines inside a card are fine. Radii only 10 (everything), 6 (small inner), pill, circle.
   - Four type sizes and two weights (400 and 600) in the new regions, `tabular-nums` on numbers; the mono face on table headers, eyebrows, KPI labels, versions and times; Spectral never on those.
   - A table has its toolbar above and outside its card; status is a `.tag` with icon, word and colour at the tonal step; an empty table and a filtered-empty table are two states.
   - **Every AI-generated output sits in a labelled AI Insight card with one action inside it** (the pending skill suggestion; `.ai:not(.msg)`, never `.msg.ai`). The Slack bubbles are people's words and use `.msg.ai` only for the left-aligned bubble (port-note §7).
   - Brand colour on the primary action, the active nav item and the selected state only. One `.btn-p` per state (Build, or Approve, never both).
   - No entrance animation, no count-ups, no skeleton shimmer; motion is 120 to 160ms ease-out on drawers and tonal hover.
   - The header (`.ps-top`) carries identity, navigation context, notifications and the profile and nothing else: the Build button lives in the page header `.ob-pochead`, not in `.ps-top`. No role switcher, no theme toggle, no demo-path control.
   - Container doctrine: the Reader is a right drawer; Approve is a one-click action on the record, not a modal; the iteration panel is an inline expand.
   - Never a number the audit did not print. The adapted stylesheet rule replaces the bridge's "stylesheet in the app's header custom code, classes on blocks": there are no Config pages. **Check this.**
6. **Cloned deviations, named so the Critic does not charge them to the port** (`port-note.md` §4): no search field or "n of m" on the Home table; "Building" as a brand-tone `.tag`; hairline rings drawn with `box-shadow` on `.ob-doclist`, `.ob-fb`, `.ob-appr`, `.ob-pick`; `.ob-loops-box` 1px border;
   gate diamond 4px; the iteration panel's 220ms expand; the Reader drawer at 720px against the doctrine's ~480.
7. **Logo.** Rail: the source's cream lockup PNG (expanded) and mark PNG (collapsed), on the brand gradient, never on a white plate; the kit's `reversed-mono.svg` is the vector alternative (usage-matrix.md). Header and documents may use the kit's horizontal lockup on a light ground. **Check this** (the bridge names the kit's reversed mono for the rail).
8. **Theme and wiring.** Keep `Shell`'s `data-theme='light'`; do not wire the dark tokens; do not add a toggle. **Check this.**
9. **Fonts and CSP.** `index.html` keeps the Spectral and IBM Plex Mono `<link>`s; the app's CSP allows `fonts.googleapis.com` and `fonts.gstatic.com` and `avatars.slack-edge.com`, `secure.gravatar.com` for the History pictures (rulings.md §2). If the fonts cannot load, the fallback's digits are proportional (type-note.md).
