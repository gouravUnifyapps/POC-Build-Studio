# Port note: UnifyApps · POC Studio Live (clone mode)

Phase `look`, clone. Files in this folder: `v34.css`, `client.css` and `report.json` (the fresh transform, **comparison baseline only**),
`audit.txt`, `tokens.css`, `type-note.md`, `logo-kit/`, `source-audit/` (scripts and raw outputs behind every number below).

## 1. The decision, in four lines

1. The request says "Clone this UI". The source app already carries Design Language v3.4 on the UnifyApps brand
   (ledger `design.clone_vs_system`, settled: keep it). **The code app's stylesheet is the source's own three files, copied as is**:
   `src/orbit/ds/tokens.css`, `src/orbit/ds/bundle.css`, `src/orbit/orbit.css`. `client.css` is not put over it.
2. The pipeline's measurement steps still ran, so the system's audit stands behind the clone: the fresh transform (section 2), the audit
   of the source's own CSS in light (`audit.txt`), the Step 6 mechanical checks ticked by hand for the source (`audit.txt` section F).
3. **Is the source the same system? Yes in kind** (section 3). **Does it pass every Step 6 check? No** (section 4): `reskin.py audit` finds 0 text
   failures, but 6 findings in product rules the script cannot see sit below their bar in light (D1 to D6), plus 3 inherited from v3.4. None was edited.
4. `style-guide.html` is **not made**: the source app is the living style guide for this clone, and it has its own states for every region
   (loading, empty, error, filtered-empty). Nebula's `app look` line and `page` blocks are **not derived**: the app is a code app and takes none.

## 2. Source version and the baseline transform

- Source app `app-b4fe5a0a30eb` "Orbit · POC Studio", Code Builder code app, `main` head `91ab370a8d6f6cc3afa4f25fe1db155279a2b14a`
  (2026-10-16T05:29Z), the checkout on disk and the one audited. The live version is v5 at `86cd9ddf…`, three commits behind; those three
  commits are the iteration chip and its panel (source-ui.md §1), so D3 and D5 below are in the head and may not be in v5. The `bundle.css` header reads "UnifyApps · POC Studio — Design Language v3.4 ported to the UnifyApps brand"; `tokens.css` is
  "GENERATED … (tokens.json)" and `tokens.json` is not in the checkout.
- Baseline: `reskin.py transform --css v34.css --out client.css --hue 103 --secondary-hue 74 --positive-hue 138 --report report.json`.
  **Count check: ok** (rounding only: `#0058B8` and `#0059B6` both land on `#2F6718`, a source spread of dY 0.00082). 51 colours moved; 47 distinct
  hexes and 25 `rgb()` triples and 6 bare `--aur` triples before, 46 / 25 / 6 after. **Max abs dY 0.00496.** No colour was edited by hand.
- A wrong number in the guideline, corrected against the file (its own rule): the prose says the block holds 54 distinct hexes; the block it carries
  has 47 by `reskin.py inventory` (46 six-digit values and `#fff`), and the 25 triples match. A wrong number in a document, not a wrong colour.
- The baseline's own audit (`audit.txt` E): 0 text failures, the 7 dimmed `--ink-mute` roles v3.4 ships on purpose.

## 3. How the source differs from a fresh v3.4 transform

**Verdict: the same system in kind, a different instance in colour decisions.** The kit is v3.4's, not a lookalike.

| Measure | Result |
|---|---|
| v3.4 class names present in `bundle.css` | 219 of 219, same names, **unprefixed** (`.tile .tag .seg .tbl .tblwrap .btn .btn-p .toolbar .empty .tabs .micro .av` …) |
| v3.4 selectors present in `bundle.css` | 393 of 393 |
| Declarations that differ in those 393 selectors | 305. 124 are token or colour only. Of the other 181: 127 are `:root` token definitions (renamed and moved to `tokens.css`), 25 are `font-family` swapped to `var(--font-serif)` / `var(--font-mono)`, and 29 sit in 11 rules: the two ambient layers re-wired to full-rgba tokens and **nine kit rules touched beyond colour** (list below) |
| Classes the source adds | 98 in `bundle.css`: **33 `ps-`** (the component set: 12 rendered by a screen, `ps-banner ps-drawer ps-fb ps-iconbtn ps-mini ps-mini-lbl ps-nav-item ps-rail ps-scrim ps-skill ps-tip ps-top`; 21 dead) and 65 unprefixed (`btn-sm btn-d accent-i lockup hot …` and the `lv-`/`lg-` families, mostly dead). Plus **172 `ob-`** in `orbit.css` (134 referenced by a screen). The kit's names are unprefixed; `ps-` is POC Studio's, `ob-` is Orbit's |
| Raw colour literals in `bundle.css` | 7 hex and 17 rgb triples inside kit rules (v3.4's own block has the same pattern: 47 / 25). `orbit.css` has one hex, in a comment |

**The nine kit rules changed beyond colour** (additive resets, one weight, one ring), besides the face swap (`body` and the mono families point at tokens: Spectral instead of
Archivo, same Plex Mono): `.display` 400 and -.02em (v3.4: 600, -.028em); `.btn` gains `display:inline-flex; gap:8px; min-height:40px; align-items/justify:center`
(buttons carry icons); `.chipsel`, `.opt`, `.tog` gain button resets; `.ctl.focus` ring is `--focus-halo`; `.drop` gains a dashed outline and size (the doctrine's one allowed dashed edge, a drop zone);
`.kb .kc` gains `cursor:grab` and a transition; `.tbl tbody tr` gains `cursor:pointer` (rows open a POC).

**Colour, by token and job** (light; full table with dark in `source-audit/compare-output.md`). dY is luminance, source minus fresh transform.

| Job | Source | Fresh transform | dY | Reading |
|---|---|---|---|---|
| page ground | `#F8F4EE` H36 (the site's warm sand) | `#EFF7ED` H108 | -0.002 | luminance matches; the source keeps the client's cream, the transform tints the neutrals to the brand hue (brand.md §2 predicted this) |
| ink, ink-2, ink-3 | `#0F140C` `#4E5849` `#667061` | `#0D150A` `#4A5943` `#62715C` | ≤ 0.001 | same luminance, hue 98 to 100 against 101 to 104 |
| ink-mute (dimmed) | `#9A9B86` H63 | `#8C9F85` H104 | 0.000 | |
| brand accent text | `#4A7C30` H99 S.44 | `#3A7F1E` H103 S.62 | -0.001 | same hue within 3 degrees; the source is muted harder |
| brand deep | `#29461B` | `#204711` | 0.001 | |
| **fill gradient (.btn-p)** | `#4E582D` `#2E3F1A` `#0F2805` (the client's own button gradient, H74 to H103) | `#3A7F1E` `#306B19` `#224A11` | **-0.074 -0.070 -0.036** | **the one deliberate departure**: the source anchors the fill on the site's own button gradient, darker than the transform, so white text has more headroom (7.61 / 11.40 / 15.84 against 4.96 / 6.48 / 10.22) |
| secondary | bronze `#857242` / `#B39F6E`, **H43** (the logo gold) | olive `#6A7B32` / `#94AA4C`, **H74** | 0.000 | 31 degrees apart. brand.md §1 recommended H74 and said the gold "never becomes a UI role"; the source gives the gold the secondary role. The ledger row `design.hue` settled the bronze accent, so **brand.md §1's "gold stays in the logo" is superseded** |
| status positive | `#276E5F` **H167** | `#207138` **H138** | 0.000 | the source kept v3.4's own positive hue. Against the brand it sits **34.5 ΔE76** away, the baseline's H138 only **19.5**: the source is better separated. My `--positive-hue 138` recommendation (brand.md §7) is withdrawn for this build |
| status attention, negative | `#9F4E07` H28, `#94322A` H5 | `#8A5A00` H39, `#96302A` H3 | 0.001, 0.000 | the source applied Step 3's worked values (amber H28, red H6); the script keeps v3.4's unless `--warm` |
| chart ramp | `#203715` … `#ACCB9D`, S .30 to .45 | `#19370D` … `#7BD857`, S .62 | ≤ 0.005 | same lightness steps, quieter chroma; ratios 12.97 / 8.06 / 5.05 / 3.23 / 2.44 / 1.78 against v3.4's 13.04 / 8.06 / 5.01 / 3.26 / 2.44 / 1.79 |
| ambient | `--aurora-1..3` full rgba, second bloom bronze | bare `--aur-a/b/c` triples | n/a | the source has no bare triples (Step 6 trap closed); no screen renders an `.amb` element |
| dark (not wired) | statuses `#BCBDA8` `#F0A9A3` … | `#A8BCA0` `#EC9790` … | +0.031 neutral, +0.076 negative | the source's dark statuses are lighter than luminance-matched; dark neutrals H62 to 66 against H102 to 104 |

Where the source is **not** luminance-matched to v3.4 (the fill stops, two dark statuses) it is darker or lighter on purpose and measures better, never worse.
The source keeps the system's measurements for every other light token to within 0.005 dY.

## 4. What the measured checks say about the source's own CSS

`audit.txt` has the rows. In short: `reskin.py audit` on `tokens.css` and on a name-mapped copy of it prints **0 text failures** (the script reads v3.4's
variable names, so on the untouched file it finds only the inks; the mapped copy renames `--status-X` to `--st-X`, aliases `--sp-blue` to `--brand` and writes the
three `--fill` hexes into `.btn-p`, no value touched). The script cannot see product rules, so the same maths was run on them by hand
(`source-audit/measure2.py`, `measure3.py`) and on a browser read of the computed styles (`computed-checks.json`). **Light, the one theme the app runs:**

| # | Where | Measure | Cause |
|---|---|---|---|
| D1 | `orbit.css:22` re-binds `--accent` to `var(--inner)` (the shadcn bridge). Computed in a browser: `--accent` = `rgba(41,70,27,.045)`, not bronze | **`.av.ob-tone-1` initials 1.08 / 2.37 / 6.73** at the gradient's start, centre, end (about 1 in 6 names hashes to tone 1); **open-gate ring 1.08:1** (non-text, the G2 diamond on the story row); `.ob-hkind.acc` loses its tint | the file's own comment at line 770 notes `--accent` maps to `--inner` in light and works around it for the branch numeral only |
| D2 | `.tag.ob-tag-brand`, the "Building" tag | **4.27 on glass-1, 4.38 on glass-solid** (bar 4.5) | v3.4 has four tonal statuses; the source adds a fifth in brand colour, text `--brand` on a 10% tint |
| D3 | `.ob-loops-chip:hover` / `.is-open`, `.ob-loops-latest` (beat 4's "2 iterations") | 4.19 / 4.43 and 4.26 (bar 4.5) | accent-soft washes at 48% and 45% under `--accent-text` |
| D4 | `--accent-soft` as a ring: `.ob-jgate-d`, `.ob-jcard.is-selected` | 2.37 on base, 2.59 on glass-solid (non-text, bar 3.0) | token too light for a boundary |
| D5 | `.ob-loops-box`, the iterations panel | card `border-width` computes **1px** (rule: no card borders) | `border: 1px solid var(--hair)` |
| D6 | `.ob-jgate-d`, the gate diamond | radius **4px** computed (rule: 10 / 6 / pill / circle) | one literal |
| inherited | `.pip.done`, `.av.ob-tone-2` start stop | white on `--pos-fill-1` 4.20 | v3.4's `#2C8A74` measures 4.20 too; the digit sits at the centre, 4.98 |
| inherited | chart steps 5 and 6 | 2.44 and 1.78 non-text | v3.4's own 2.44 and 1.79; no screen draws the ramp |
| inherited | the kit's AI Insight card, `.ai .hd .micro` and `.ai .ground`, at the gradient's left stop | 4.27 and 4.44 (bar 4.5) | v3.4's own card measures 4.21 and 4.43. The new pending-suggestion card on Feedback reuses it, so it carries the same two roles; the audit script does not look at this card |

**Latent in dark, which the app cannot reach:** `.ob-tag-brand` 4.49 / 3.78, `.av.ob-av-ai` and `.ob-tag-accent` 4.28 on glass-solid, white on `--status-negative`
1.92 (the nav badge, `--on-fill` instead of `--on-status`), `--brand-deep` text 3.58.

**Doctrine items the source does not meet** (not measured failures; the Critic should know they are cloned, not introduced by the port):
the Home table has **no search field and no "n of m"** (v3.4: "every table gets a toolbar: search left"); its toolbar is one status `.seg`, two selects and Clear all;
`.ob-doclist`, `.ob-fb`, `.ob-appr`, `.ob-pick` draw a 1px hairline as a `box-shadow` (border-width 0, outline visible); brand green carries the "Building" tag and the
mini-rail's current bar, beyond the primary action, active nav and selected state; the iteration panel expands in 220ms and the chevron turns in 200ms (doctrine 120 to 160);
the drawer slide and scrim fade are 150ms, inside the rule.

**Nothing in the source's CSS was edited.** Fixes at the cause, proposed, none applied (the ledger says copy as is; the moderator decides). Each uses only the source's tokens and
measures as printed in `audit.txt` D3:

- **P1** delete `orbit.css` line 22 (`--accent: var(--inner);`). The two shadcn primitives the app keeps, `tooltip.tsx` and `sonner.tsx`, do not read `--accent` (grep, none).
  Result: D1 clears (tone 1 initials 4.68 / 5.58 / 6.73, open-gate ring 4.68:1). Also lets the history bubbles' avatars use tone 1 safely.
- **P2** one rule: `.tag.ob-tag-brand { color: var(--brand-deep); }`. Result: D2 clears (9.30 on glass-solid).
- P3 (design call, not applied or numbered): D4 would clear with the ring on `--accent` after P1 (4.68); D5 by removing the 1px border and keeping the tint; D6 by `var(--r-sm)`; D3 by lowering the washes.

## 5. Dial and theme

- **Dial: dense internal tool (`expert`).** The bridge maps `demo.intent` `use-case` to the client-facing demo surface. That mapping assumes the audience is the
  client's customer. Here the profile's audience is UnifyApps' own POC owners and managers and its intent line says "a working internal tool, not a pitch":
  the people in the room are the people who would use it daily, so the literal mapping does not hold and I chose the other row of the dial. Reasons from the source itself:
  the lead region is a table with a toolbar on a solid near-white ground (`.tblwrap` `--glass-solid`), no ambient field is rendered, radii are 10 / 6 / pill / circle,
  the new regions are working surfaces (a review list, a chat history, an Approve), and brand colour is on the primary action, the active nav item and the selected state apart
  from the cloned exceptions in section 4. Two traits of the other dial are kept because the source has them and the clone keeps the screens: the stat-tile row above the table
  and the brand-gradient nav rail with the logo (the one branded surface in both dials). **Check this.**
- **Theme: light, light-only.** `Shell.tsx` forces `document.documentElement.dataset.theme = 'light'` on mount and there is no toggle. Dark tokens exist and are measured
  (`tokens.css` second block) but are **not wired; this is a gap, not wired on purpose**, and they carry the latent failures in section 4. No toggle is added: v3.4 puts none in product chrome.

## 6. Decisions the port forced, each a departure from the pipeline as written

| # | Decision | Why | Check this |
|---|---|---|---|
| a | The source's `tokens.css`, `bundle.css`, `orbit.css` are the app's stylesheet; `client.css` is not shipped | ledger `design.clone_vs_system`: a re-transform would turn the cream ground into a green tint for no beat | yes |
| b | No `style-guide.html` | the source app is the living style guide; every region of it is reachable in the app | yes |
| c | No `app look` line, no `page · create` line | code app (bridge: "No Config pages"); the message says so | no |
| d | Dial `expert`, against the bridge's literal intent mapping | section 5 | yes |
| e | `tokens.css` is the source's block annotated, not a second stylesheet; the app never imports it | one stylesheet, one source of truth; `source-audit/verify_tokens.py` proves 167 of 167 declarations identical in value and order | yes |
| f | The baseline's `--positive-hue 138` is withdrawn and brand.md §1's "gold never a UI role" is superseded | section 3: the source is better separated on positive, and the ledger settled the bronze accent | no |
| g | The logo is the source's own cream PNG (`unifyapps-lockup-reversed.png`, `unifyapps-mark-reversed.png`, `#EDE6D7`) in the rail, not the kit's `reversed-mono.svg` | it is the client's real artwork in the client's on-dark ink; it measures 8.72 / 12.68 / 14.58 on the three rail stops (kit white: 10.83 / 15.76 / 18.12). The kit's SVG remains the choice if a vector is wanted. Shell and `index.html` import three files **outside `src/orbit/**`** (the two PNGs in `src/assets/`, `public/unifyapps-app-32.png`): they must be copied or the shell does not build | yes |
| h | New regions use classes that already exist in the source's CSS; four small rules are added for what the source lacks (section 7) | the brief's rule: invent no component | yes |
| i | The pending skill suggestion is composed as the kit's AI Insight card (`.ai:not(.msg)`), not as a feedback article | doctrine: every AI-generated output sits in a labelled AI Insight card with one action in it; automation 7 writes it. The card sits in the article stack's first slot, so the layout the message asks for (sticky summary card + article stack) is unchanged | yes |

## 7. Gaps: what the system or the source cannot express, and what was done

1. **A neutral chat bubble.** The kit's `.msg` has `.me` (brand gradient, right) and `.ai` (tier-2 glass, left) only. People's Slack posts take `.msg.ai`'s bubble: it is the only left-aligned
   neutral one, and the class name says "ai" for what is a person. Named, not hidden.
2. **A round image avatar.** `.av` is a gradient circle holding initials. A Slack picture needs `.av img`. **Rule 1.**
3. **A centred notice and a bubble row.** `.ob-hrow` is a three-column grid with a vertical connector. Notices and bubbles each need one layout line. **Rules 2 and 3.**
4. **Current prompt beside proposed.** v3.4 leaves the diff view out of the kit by choice. The two prompts sit side by side in two `.inner` blocks on `.grid.g2c`, plain text through the
   source's `Markdown` component; no word-level diff. If a real diff is wanted it is a new component and a named gap.
5. **A "To review" list.** Not a kit part. It reuses the app's own `.ob-doclist` and `.ob-docrow` (the Artifacts list's row), so the rows are identical and open the same Reader.
6. **Search and "n of m" on the Home table**: absent in the source, so absent in the clone (section 4).
7. **Dark**: not wired (section 5). **Nebula's Config builder**: not used, so none of its limits (12 fonts, 13 role colours) apply.
8. **Spectral's x-height** and **Georgia's proportional digits as a fallback** (type-note.md).
9. **The app was not opened.** It needs a sign-in; the browser checks ran on sample markup with the source's three files. Fixed-width layouts, horizontal scroll and JS errors are unmeasured.

**The only CSS the new regions add: four rules, no colour value, one `inherit`** (also in `design.md`), to be placed at the end of `orbit.css`:

```css
.av img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
.ob-hrow.is-bubble { grid-template-columns: 30px minmax(0, 1fr); }
.ob-hrow.is-notice { grid-template-columns: auto auto auto; justify-content: center; align-items: center; }
.ob-hrow.is-bubble::after, .ob-hrow.is-notice::after { display: none; }
```

(The last rule hides the connector line the source draws between avatars; a chat has none.)

## 8. Use-case dial, theme, type: one line each

Dial `expert` (dense internal tool); theme light, light-only; type Spectral 400/600 with IBM Plex Mono, both from Google Fonts, open faces, nothing to license
(`type-note.md`). Max abs dY of the baseline transform 0.00496; the source's own luminance moves are in section 3.
