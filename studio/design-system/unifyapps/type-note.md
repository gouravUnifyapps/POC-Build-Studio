# Type note: UnifyApps · POC Studio Live

**Brand face: Spectral** (Production Type; a serif, used for everything on unifyapps.com: body, headings,
buttons, nav). It is open (listed on Google Fonts, SIL OFL), so the licensing rule's open case applies: the real
face ships and no substitute is needed. Production has nothing to license for it.
**Mono: IBM Plex Mono**, kept as the system's structural face (table headers, eyebrows, counts, times); the client
has no brand mono. Both facts and the metric check come from `$STUDIO/brand.md` §4; this note records what the
cloned app actually does with them.

## What the source ships

- `index.html` loads both from Google Fonts with one `<link>`: Spectral `ital,wght@0,300;0,400;0,500;0,600;1,300;1,400`
  and IBM Plex Mono `400;500;600`, `display=swap`. The two stacks are tokens: `--font-serif: Spectral, Georgia,
  "Times New Roman", serif` and `--font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace`.
  `orbit.css` points the template's shadcn face variables at them, so nothing in the Orbit screens renders in Geist.
- The engine's `ua:theme-font` block also loads **Geist**. Nothing reads it (the app's own variables override it).
  It is a wasted request, left as cloned: that block belongs to the engine template, not to `src/orbit/**`.
- Weights in use by the screens: Spectral 400 and 600 and italic 400 (`.accent-i`, the feedback quote, "unset" text);
  IBM Plex Mono 600 and 400. Spectral 300 and 300 italic are loaded and no rule uses them; Spectral 500 is read only by
  `.chipsel`, `.chips button` and `.slot`, kit parts no screen renders. Trimming the link to what is used is a
  performance choice for the code app's task, not a design change; it is not made here.
- **CSP.** The published app must allow `fonts.googleapis.com` (styles) and `fonts.gstatic.com` (files). The Judge's
  ruling (rulings.md §2) already lists the Spectral font host for the new app; the same two hosts carry IBM Plex Mono.
  If a deployment cannot allow them, self-host the same woff2 files (the OFL permits it) and point the two `@font-face`
  rules at them; do not substitute a face.

## What was checked in this phase (browser, light, the source's three stylesheets on sample markup)

| Check | Result |
|---|---|
| Table header face and size | `.tbl thead th` computes "IBM Plex Mono", 10.5px, weight 600; `document.fonts.check` is true after load |
| Body face and size | `body` computes `Spectral, Georgia, "Times New Roman", serif`, 15px, `font-variant-numeric: tabular-nums` |
| Tabular numerals (Step 2b) | canvas advance of every digit 0 to 9 at 15px is 7.5, so Spectral's numerals are tabular with no feature switch |
| Four sizes hold their hierarchy | body 15, small 13, micro 11 mono, title 19, display 34; tags 11.5 against buttons 14 and 13 |
| Re-measure after the swap | contrast is not a function of the face, and every ratio in `tokens.css` and `audit.txt` was taken on the source's Spectral build; the fixed-width layouts could not be measured (the app needs a sign-in) |

Two honest costs of the face, both inherited from the swap and not new:

1. **x-height.** Spectral's is 0.450 em against Archivo's 0.526 (brand.md §4), so 13 to 14px table text reads smaller
   than the same size in the system's default face. The source sets table cells at 14px (`.ob-ptable td`) and secondary
   lines at 13px; that is how the clone keeps its rows legible and it is kept.
2. **Display weight.** The source's page titles are Spectral Regular (400) with an italic bronze accent word
   (`.display` with `.accent-i`: "POC *journeys*"), tracking -0.02em. v3.4 sets `.display` at 600 and -0.028em. Both
   weights are inside the system's two (400 and 600); the change is in `port-note.md`, section 2.

**If the web font fails to load** the stack falls to Georgia, whose digits are proportional (advance 9.21, 6.45, 8.94
for 0, 1, 8 at 15px), so figure columns would lose their alignment. The two tokens above are the only place that
fallback is set.

## For the new regions

Every new region in `design.md` uses the existing classes and so the same two faces and sizes: no new font, size
or weight is introduced. The History bubbles' sender name uses the kit's `.who` (IBM Plex Mono, 10px, uppercase),
their time uses `.ob-mono-t` (IBM Plex Mono, 10.5px).

## Nebula's twelve fonts

Not applicable: the app is a code app and takes no `app look` line, so no font is mapped to Nebula's twelve.
