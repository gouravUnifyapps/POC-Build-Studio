# UnifyApps logo kit: usage matrix

Clear space is half the mark's height on all four sides, and nothing crosses it, the product name included.
The mark is 22.07 units tall inside a 23-unit-high lockup (viewBox 90 x 23), so at the minimum sizes below the
clear space comes out as follows. The measured contrast on the app's own grounds is added in phase `look`.

| Variant | File | Where it goes | Min size | Clear space at min size | Ground | Contrast on the client's own grounds |
|---|---|---|---|---|---|---|
| Primary lockup | `primary-lockup.svg` | Sign-in, splash, document header, build report cover | 140 px wide | 17 px | Light page only | `#847347` on `#F7F3ED` 4.20:1 · on `#FFFFFF` 4.64:1 |
| Horizontal lockup | `horizontal-lockup.svg` | Product header, email and Slack signature | 110 px wide | 13.5 px | Light page or tier-1 glass | as above |
| Stacked lockup (**[UNVERIFIED]** arrangement) | `stacked-lockup.svg` | Narrow columns, print, square crops | 96 px wide | 16.6 px | Light page only | as above |
| Mark only | `mark-only.svg` | Collapsed rail, tab strip, compact header, avatar of the org | 24 px | 12 px | Any, in the right ink: `app-mark-on-light.svg` on light, `app-mark-on-dark.svg` on dark | `#847347` on `#0F2805` 3.41:1 · `#E5DBC7` on `#0F2805` 11.53:1 |
| Reversed mono | `reversed-mono.svg` | The nav rail, the one branded surface | mark 24 px, lockup 110 px wide | 12 px / 13.5 px | The brand gradient only | measured on the rail's gradient stops in `audit.txt` |
| One-colour | `one-colour.svg` | Watermark, single-ink print, fax-grade output | 24 px (mark) or 110 px (lockup) | 12 px / 13.5 px | Any | the ink is the ground's text colour |
| App / favicon | `app-icon.svg`, `app-icon-{512,180,32,16}.png`, the client's `site-favicon*.ico` | Tab, bookmark, PWA, Slack app icon | 16 · 32 · 180 · 512 | its own square | Its own ground `#0F2805` | `#E5DBC7` on `#0F2805` 11.53:1 |

## Rules for this app

- The rail carries the reversed mono lockup (expanded) or the reversed mono mark (collapsed) on the brand
  gradient: never the gold lockup on the gradient, never a white plate behind it.
- Org and account avatars are circles: crop `mark-only.svg` to a circle on the dark ground, never letterbox it.
- The gold lockup is full colour. Do not place it on the brand fill, recolour it outside the mono and reversed
  versions, stretch, rotate, outline, shadow or redraw it.
- Inline use: define the artwork once as an SVG `<symbol>` and reference it with `<use>`; the file is 188 KB
  because the mark is 748 dot paths, so it is never repeated in the markup. In the app the mono variants take
  `fill="currentColor"`.
- The stacked lockup stays `[UNVERIFIED]` until UnifyApps brand approves it; the product header uses the
  horizontal lockup, which is the client's own file.

## Measured on the app's own grounds (phase `look`, clone; `reskin.py` maths, rows in `../audit.txt` D1)

The app keeps the source's stylesheet, so the grounds are the source's tokens (`../tokens.css`).

| Mark | On | Ratio | Bar |
|---|---|---|---|
| Source's cream lockup/mark PNG, `#EDE6D7` (`src/assets/unifyapps-*-reversed.png`) | rail stops `--nav-1` `#324223` / `--nav-2` `#012A00` / `--nav-3` `#071A05` | 8.72 / 12.68 / 14.58 | 3.0 non-text |
| Kit `reversed-mono.svg`, `#FFFFFF` | the same three stops | 10.83 / 15.76 / 18.12 | 3.0 non-text |
| Kit gold lockup `#847347` | `--base` `#F8F4EE` · `--glass-solid` over base | 4.24 · 4.64 | 3.0 non-text |

Every variant used in the app clears 3:1 on its ground. The rail's logo in the source is the cream PNG, not the kit's SVG (port-note §6 g); either is allowed.
