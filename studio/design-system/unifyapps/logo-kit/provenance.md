# UnifyApps logo kit: provenance

Harvested 2026-10-16 from https://www.unifyapps.com (public home page, no sign-in). Step 1 of the five-step
order yielded a real file, so steps 2 to 5 were not needed for the artwork. Nothing was traced, redrawn or
approximated: every path in every SVG below is the client's own path data, only translated, cropped by
viewBox or given a single fill.

## Source files, as published

| File here | Came from | Notes |
|---|---|---|
| `unifyapps-header-logo.svg` | https://images.contentstack.io/v3/assets/blt55a41789e979ba65/bltca16d9e3eed7d63a/6a2696f38c6034ca2dc46150/Unify_Logo_Footer.svg (the `<img>` in the site header, `alt="Unify Logo Footer.svg"`) | Byte for byte what the site serves: 90 x 23 viewBox, 757 paths, one fill `#847347` with per-dot opacity. 188,106 bytes, `image/svg+xml`. No script, no raster, no external reference (checked). |
| `site-favicon.ico` | https://www.unifyapps.com/favicon.ico (`<link rel="icon">`) | The mark alone, six frames 16 to 256, ink `#6A5A32`, transparent. |
| `site-favicon-on-dark.ico` | https://www.unifyapps.com/favicon-on-dark.ico (second `<link rel="icon">`) | Same mark, ink `#E5DBC7`, transparent, made for dark grounds. |

The site publishes no `/favicon.svg`, `/logo.svg` or `apple-touch-icon` (each returned 404), and no `og:image`.
That is why the app icon PNGs are rasterised from the SVG mark, not fetched.

## The seven variants

| Variant | File | How it was made | Status |
|---|---|---|---|
| Primary lockup | `primary-lockup.svg` | The client's file, unchanged. The client publishes one lockup and it is horizontal: mark left, wordmark right. | verified: client file |
| Horizontal lockup | `horizontal-lockup.svg` | The same file again, under the second name. | verified: client file |
| Stacked lockup | `stacked-lockup.svg` | The client's 748 mark paths and 9 wordmark paths, placed one above the other with `translate` only (mark centred, 8 units between, viewBox 63.92 x 44.35). | **[UNVERIFIED]**: this arrangement is ours; the site publishes no stacked version, and no brand book was found that approves one. Confirm with UnifyApps brand before any use outside this tool. |
| Mark only | `mark-only.svg` | The 748 dot paths (x 0 to 22.31, y 0 to 22.07), viewBox cropped to them, colours untouched. | verified: client artwork, cropped. The favicon files show the client itself uses the mark alone. |
| Reversed mono | `reversed-mono.svg` | Horizontal lockup, every fill set to `#FFFFFF`, per-dot opacity kept. For the nav rail's brand gradient; inline it with `fill="currentColor"` in the app. | derived, as the guide prescribes |
| One-colour | `one-colour.svg` | Horizontal lockup, every fill set to `#000000`, per-dot opacity kept. For watermark and single-ink print. | derived, as the guide prescribes |
| App / favicon | `app-icon.svg`, `app-icon-512.png`, `app-icon-180.png`, `app-icon-32.png`, `app-icon-16.png`; plus the client's own `site-favicon*.ico` | The mark in the client's own on-dark ink `#E5DBC7` (the colour of its `favicon-on-dark.ico`) at 59% of a square ground `#0F2805` (the client's Brand 1 / 500 green, the colour of its primary button). PNGs are 1024 px renders of the SVG scaled down with Lanczos. `app-mark-on-light.svg` and `app-mark-on-dark.svg` are the bare mark for the two themes. | derived; the ground is ours, the two colours are the client's |

## Colours in the artwork

- Mark and wordmark ink: `#847347` (Gold, hue 43.3 degrees). It is the only colour in the client's file.
- Measured contrast of `#847347` on the client's own grounds: 4.64:1 on `#FFFFFF`, 4.20:1 on the page cream
  `#F7F3ED`, 3.74:1 on Sand 200 `#EDE6D7`, 3.41:1 on `#0F2805`, 4.07:1 on `#081403`. Each clears the 3:1 bar for a
  graphical object. The ratios on the app's own transformed grounds are measured in phase `look`.
- `#E5DBC7` on `#0F2805`: 11.53:1 (the app icon).

All ratios above came from `reskin.py contrast`.

## What the logo kit does not contain

No wordmark font file. The wordmark is outlined paths in the client's file; the site's UI face is a separate
question and is in `type-note.md`.
