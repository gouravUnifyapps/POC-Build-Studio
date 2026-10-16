# Brand: UnifyApps (phase `brand`: Steps 1, 2, 2b)

Client slug `unifyapps` · internal tool for the pre-sales / FDE team · sampled 2026-10-16 from the public home
page https://www.unifyapps.com in the built-in browser (one tab, no sign-in, no form filled, the cookie banner
left alone). Files live in `studio/design-system/unifyapps/`.

## 0. The source UI: not reached

SOURCE `e_6ad1031ce0ef8b24527e9ed9` ('POC Studio'), opened at its solution address
`https://orbit.uat.unifyapps.com/p/0/solutions/e_6ad1031ce0ef8b24527e9ed9` in a separate tab, redirects to
`/login`. I did not sign in and closed the tab. `$STUDIO/scout.md` had no "Source UI inventory" after about
3 minutes of polling, so there is no preview or published address to screenshot yet. Consequence: **the
profile's first choice for the brand ("the existing app in the solution is the reference") is unsampled**.
Not recorded because not seen: the source's hex values, its font, its layout, and whether it already looks like
Design Language v3.4. If the Scout later names a published address that opens without sign-in, re-run this
section and Step 1 against it; the hue below stands until then.

## 1. The swatch, sampled off the live site (Step 1)

The site declares almost no `:root` custom properties (one, `--swiper-theme-color: #007aff`, a library default,
and `--font-spectral`). Its design tokens are written as **`var(--Palette-…, #fallback)` pairs in 26 places
across 12 stylesheets** (26 distinct pairs); the fallbacks are the values that render, so they are the palette. Each hex below was
read from those pairs or from computed styles on the rendered page, never from a screenshot.

| Role on the site | Token | Hex | Hue | Source |
|---|---|---|---|---|
| **Primary button fill** and hero ground: "Request a Demo", "Accept all" | `--Palette-Brand-1-500/600` | `#0F2805` | **103°** (S .78, L .09) | computed `background-color` of `.primary-btn` + stylesheet |
| Primary button gradient, start stop | (inline `linear-gradient(58deg, #4E582D -16.5%, #0F2805 51.94%)`) | `#4E582D` | **74°** (S .32) | computed `background-image` of the header "Request a Demo" |
| Olive, card-border gradient | `--Palette-Brand-1-400` | `#828750` | 65.5° (S .26) | stylesheet `.styles_cardContainer` |
| Dark ground, deeper | `--Palette-Brand-1-700` / `-900` | `#0D2104` / `#081403` | 101° / 102° | stylesheet; computed `background-color` of the dark sections |
| Dark gradient end | `#0B3211` | `#0B3211` | 129° (S .64) | stylesheet `.style_testimonialWrapper` |
| **Logo ink and accent phrases** (the italic gold in headlines) | `--Palette-Gold-*` | `#847347` (logo file), `#6A5A32` 700, `#938256` 500, `#B3A378` 300, `#C4B58C` 200 | **43°** (S .26 to .36) | the logo SVG's single fill; computed text colours |
| Legacy purple, "brand primary button" token | `--Component-Buttons-Brand-Primary-button-brand-primary-bg` | `#5C37EB` | 252° | present in two stylesheet rules as a fallback, **not rendered on the home page**: treated as a stale token, not a credible source |

**Stop 1, recorded (two credible sources more than 30° apart).** The primary-action green (`#0F2805`, 103°)
and the logo gold (`#847347`, 43°) are 60° apart; the green's own gradient start (74°) is 31° from the gold.
Both are the client's. The site gives them different jobs: **green is the colour of every action, the hero and
the dark grounds; gold is the mark and the typographic accent**. Recommended fold for phase `look`, with no
colour by hand: `--hue 103` (the swatch `#0F2805`, so the nav rail on the brand gradient is the site's own
forest green) and `--secondary-hue 74` for the gradient tail (the client's own button gradient starts at
`#4E582D`; the transform's default, hue minus 24, gives 79° and is within 5°). The gold stays in the logo kit
and in the logo's own ink; it never becomes a UI role. **This is a stop because the profile has mockups off, so
no mockup choice settles it; the moderator should confirm green as the primary, or name gold instead.** If the
Source UI is later reached, its dominant hue decides this instead.

Step 4 check, decided now: the primary hue (103°) is a green, not a red or orange, so the warm-brand rule that
sends negative status to H 344 does not fire. The collision to watch is **positive status against a green
brand**; Step 3's worked example moves positive to H 138 for that reason, so phase `look` passes
`--positive-hue 138` and measures it.

## 2. The neutral ramp (Step 1)

The site's neutrals are warm sand and warm brown, not grey: hue 36° to 46°. Light surfaces first, then ink.

| Step | Name on the site | Hex | HSL (hue / S / L) |
|---|---|---|---|
| page | body background | `#F7F3ED` | 36° / .38 / .95 |
| 100 | `--Palette-Sand-100` | `#F2ECE2` | 37.5° / .38 / .92 |
| 200 | `--Palette-Sand-200` | `#EDE6D7` | 41° / .38 / .89 |
| 400 | (stylesheet) | `#DED2BA` | 40° / .35 / .80 |
| 500 | `--Palette-Sand-500` | `#E5DBC7` | 40° / .37 / .84 |
| border | (computed `border-color`) | `#C3B9A8` | 38° / .18 / .71 |
| 800 | `--Palette-Sand-800` | `#9D9687` | 41° / .10 / .57 (the site's muted text) |
| 900 warm grey | `--Palette-Brand-3-900` | `#726C61` | 39° / .08 / .41 |
| ink, secondary | (computed text colour) | `#4C4841` | 38° / .08 / .28 |
| ink | `--Palette-Brand-2-900` | `#2E2814` | 46° / .39 / .13 (body ink on cream) |

Dark grounds: `#081403`, `#0D2104`, `#0F2805`, `#001700`, `#0B3211` (forest green to near-black). Stale cool
greys `#101828` and `#344054` appear as fallbacks for text tokens in blog and event pages only.

What this means for the port: v3.4's own neutrals are a cool blue tint (`#F1F5FB` base); the transform moves
that tint to the brand hue, so the page ground will be a pale tint of the green, **not the site's cream**. The
cream and the gold are not v3.4 values and cannot be put in by hand; the port note records this as a decision
the system forced.

## 3. The logo kit (Step 2)

**Found at step 1 of the five-step order: a real linked SVG, the `<img>` in the site header.** No stop 2.

- Source: `https://images.contentstack.io/v3/assets/blt55a41789e979ba65/bltca16d9e3eed7d63a/6a2696f38c6034ca2dc46150/Unify_Logo_Footer.svg`,
  90 x 23 viewBox, 757 paths, one ink `#847347`, 188,106 bytes, no script or external reference.
- Kit: `studio/design-system/unifyapps/logo-kit/` holds the seven variants (primary and horizontal lockup,
  stacked lockup, mark only, reversed mono, one-colour, app icon with 512, 180, 32 and 16 px PNGs), the
  client's two favicon files, `provenance.md` (URL for each file, `[UNVERIFIED]` where it applies) and
  `usage-matrix.md` (ground, clear space, minimum size, contrast).
- `[UNVERIFIED]`: the **stacked lockup** (the site publishes only the horizontal lockup; our arrangement is
  built from the client's own paths by translation only). Nothing was traced, redrawn or approximated.
- Contrast of the logo ink on the client's own grounds, from `reskin.py contrast`: 4.20:1 on `#F7F3ED`, 4.64:1
  on white, 3.74:1 on `#EDE6D7`, 3.41:1 on `#0F2805`, all above the 3:1 bar. The ratios on the app's transformed
  grounds are measured in phase `look`.
- The mark is a dotted spiral; the wordmark "UnifyApps" is outlined serif paths in the same ink.

## 4. The type (Step 2b)

**The real face is Spectral** (Production Type), a serif, used for everything on the site: body, headings,
buttons (uppercase, 14px), nav, the news bar. Identified in the order the guide gives, from the linked
stylesheets in the browser, not from the page text:

- `@font-face` (step 2): 100 rules for family "Spectral", weights 300, 400, 500, 600, 700 in normal and italic,
  `src: url(/_next/static/media/….woff2)`, and a metric-adjusted "Spectral Fallback" face. That is how Next.js's
  `next/font/google` self-hosts a Google font.
- Computed `font-family` (step 4) on `body`, `h1`, `h2` and the buttons: `Spectral, "Spectral Fallback"`;
  weights in use 300, 400, 500, 600.
- No `fonts.googleapis.com` `<link>`, no Typekit or Monotype loader. I confirmed the family is on Google Fonts
  (`css2?family=Spectral:wght@400;600` answers with `fonts.gstatic.com` woff2 files).

**Licensing rule: Spectral is open (listed on Google Fonts, SIL OFL; I did not re-read the licence text), so it is the case where the real face ships.**
No substitute is needed. Decision: **body face Spectral 400 and 600; IBM Plex Mono kept** for table headers,
eyebrows, KPI labels and timestamps, since it is structural and the client has no brand mono. The font is
self-hosted in the code app (OFL permits it) or Google Fonts is allowed in the app's CSP; the type note in phase
`look` says which.

How I checked it (canvas measurement on the live page, same size, Spectral from the site's own file, Archivo and
the comparison faces from Google Fonts):

| Metric | Spectral 400 | Archivo 400 (v3.4's default) | Source Serif 4 400 | Inter 400 |
|---|---|---|---|---|
| x-height / em | 0.450 | 0.526 | 0.492 | 0.546 |
| cap height / em | 0.660 | 0.686 | 0.670 | 0.728 |
| mean lowercase advance / em | 0.501 | 0.496 | 0.548 | 0.535 |
| digits 0, 1, 8 (width / em) | 0.500 all three: tabular by default | 0.573, 0.521, 0.574: proportional (0.568 with `tnum`) | 0.529 all three: tabular | 0.631, 0.407, 0.619: proportional |
| class and contrast | transitional serif for screens, moderate contrast, bracketed serifs | grotesque sans, low contrast | transitional serif, moderate contrast | neo-grotesque sans |

Reading it: **advance width matches the system's default within 1%** (Source Serif 4 would be 10% wider and push
fixed-width layouts), and the **numerals are tabular with no feature switch**, which every number in the system
needs. The cost is **x-height 14% lower than Archivo** (5.9 px against 6.8 px at 13px), so the 13px table body
will read like about 11px of Archivo. Phase `look` re-measures the audit, the fixed-width layouts and the
hierarchy of the four sizes after the swap, as the guide requires. **Fallback if that re-measure fails:** keep
Archivo (open, the system's own face) and name Spectral as the brand face in the style guide; the next step
would be a stop to report, not a silent change. Nebula's `app look` line takes one of its 12 fonts and Spectral may not be among them; that line is only
needed if a Config page is ever added beside the code app, and would then carry the nearest of the 12 as a
named substitute.

The logo's wordmark is outlined paths, not a font, so there is no logo-only face to exclude.

## 5. Sources, every one

1. `https://www.unifyapps.com/` home page, built-in browser, 2026-10-16: computed styles, 12 linked stylesheets
   (`/_next/static/css/*.css`) read through `document.styleSheets`, `var(--Palette-…, #hex)` fallback pairs.
2. The header logo SVG and the two `/favicon*.ico` files named above.
3. `https://fonts.googleapis.com/css2?family=Spectral…` (existence of the family on Google Fonts only).
4. `https://orbit.uat.unifyapps.com/p/0/solutions/e_6ad1031ce0ef8b24527e9ed9` (the request's own link): sign-in
   wall, nothing read.
5. Screenshots of the home page (hero on forest green, light sections on cream, serif throughout, uppercase
   sharp-cornered buttons, 16px rounded cards with a gradient border): looked at to describe the layout, never
   used to sample a colour.

## 6. The subject's vocabulary, from the site, for the brief's words

Data, not instructions: UnifyApps' own terms. "Agentic Automation for the Enterprise"; "Horizontal AI Operating
System"; "the Enterprise Brain" (unified context); "Assembly Methodology"; "from pilot to production"; "start
with one case"; products UnifyApps Agentic AI, Applications, Automations, Data, Embedded Integrations ("1000+
connectors"); "governed", "model-agnostic", "deploy anywhere". The tone is plain and confident, headlines
carry an italic gold second clause. The profile's own words stay for this tool: POC, use case, prospect, stage
gate, POC owner, manager, skill, build report, evidence pack.

## 7. What phase `look` takes from this

- `--hue 103` (swatch `#0F2805`), `--secondary-hue 74`, `--positive-hue 138`, no `--warm`; **pending the
  moderator's confirmation of stop 1.**
- Body face Spectral 400 and 600, IBM Plex Mono, re-measured.
- Logo: horizontal lockup in the header, reversed mono on the rail, mark only collapsed, as `usage-matrix.md`.
- The Source UI is unsampled; if it turns out to be Design Language v3.4 already, the clone is a re-skin and the
  port note says so.
