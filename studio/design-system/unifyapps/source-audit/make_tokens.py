"""Writes ../tokens.css: the source's tokens.css declarations, byte for byte, in the source's order, with a group header
and a measured ratio beside each token. Every ratio comes from reskin.py (audit, contrast) via measure*.py output; no value is changed."""
import re, sys
src=open(sys.argv[1]+"/ds/tokens.css").read()
HEAD={
"--font-serif":"FACES  (type-note.md; the app loads both from Google Fonts in index.html)",
"--r":"RADII  five-step scale: 10 everything, 6 small inner, pill, circle. The studio steps (28/22/16/12) are declared and unused by any screen",
"--space-4":"SPACING  (not a colour; no ratio)",
"--type-display-size":"TYPE  display 34 / title 19 / body 15 / small 13 / micro 11 mono / table head 10.5 mono; weights 400 and 600",
"--base":"GROUND  page and glass tiers.  Ratios: --ink, --ink-2, --ink-3, --ink-mute on each ground, LIGHT (dark in the second block)",
"--ink":"INK  text on the grounds above",
"--brand":"BRAND  accent text, focus ring, the 'Building' tag. v3.4 doctrine: brand colour is for the primary action, the active nav item and the selected state",
"--fill-1":"FILL  the .btn-p gradient, top to bottom, with white text (--on-fill)",
"--accent":"ACCENT  bronze, the client's logo gold. Carries: italic accent word, avatar tone, iteration chips, 'stale' banner",
"--status-neutral":"STATUS  tonal only: text on its own tint over glass-1 (the audit's convention), and plain on glass-solid",
"--pos-fill-1":"POSITIVE FILL  pips and done stepper stops; white digit on it",
"--chart-1":"CHART RAMP  one hue, six lightness steps; non-text, held to 3:1 on glass-solid. Not rendered by any screen; tone-5 avatars borrow --chart-3 and --chart-1",
"--aurora-1":"AMBIENT  three washes, not text. No screen renders an .amb element, so these paint nothing today",
"--nav-1":"NAV RAIL  the brand gradient (199deg, nav-1 to nav-2 to nav-3 over background-color nav-3), the one branded surface",
"--scrim":"OVERLAY  scrim and tooltip",
"--edge":"ELEVATION  one 1px top edge, two lifts. Non-text",
}
LIGHT={
"--base":"ink 17.03 · ink-2 6.81 · ink-3 4.73 · ink-mute 2.59 (dimmed) · brand 4.55 · accent-text 6.14",
"--page-tint":"non-text wash",
"--glass-1":"ink 18.19 · ink-2 7.27 · ink-3 5.05 · ink-mute 2.77 (dimmed)",
"--glass-2":"ink 18.36 · ink-2 7.34 · ink-3 5.10 · ink-mute 2.79 (dimmed)",
"--glass-3":"ink 18.53 · ink-2 7.41 · ink-3 5.14 · ink-mute 2.82 (dimmed)",
"--glass-solid":"ink 18.64 · ink-2 7.45 · ink-3 5.18 · ink-mute 2.83 (dimmed); the ground under every table, banner, drawer",
"--inner":"non-text tint; --ink-2 on it 6.75 (.tag, over glass-1)",
"--hair":"non-text, decorative separator",
"--hair-2":"non-text, decorative separator",
"--ink":"17.03 on base · 18.64 on glass-solid",
"--ink-2":"6.81 on base · 7.45 on glass-solid",
"--ink-3":"4.73 on base · 5.18 on glass-solid",
"--ink-mute":"2.59 on base · 2.83 on glass-solid: DIMMED role, placeholder and disabled only, under 3:1 by design as in v3.4",
"--brand":"text 4.55 on base · 4.98 on glass-solid · focus ring non-text 4.55 · as text on its own 10% tint (.tag.ob-tag-brand 'Building') 4.27 on glass-1 / 4.38 on glass-solid: FAIL 4.5",
"--brand-deep":"9.65 on base",
"--brand-tint":"non-text tint; see --brand for the tag text on it",
"--fill-1":"white on it 7.61",
"--fill-2":"white on it 11.40",
"--fill-3":"white on it 15.84",
"--on-fill":"the white above; also on --status-negative 7.64 (badge, .btn-d:hover)",
"--focus":"non-text 4.55 on base",
"--focus-halo":"non-text halo",
"--accent":"AS DECLARED non-text 4.28 on base. AS RENDERED in light it is NOT bronze: orbit.css:22 re-binds --accent to var(--inner), computed in a browser as rgba(41,70,27,.045); 1.08:1 on glass-solid (port-note, defect D1)",
"--accent-soft":"non-text 2.37 on base · 2.59 on glass-solid: under 3:1 (gate ring, selected-phase ring; defect D4)",
"--accent-text":"6.14 on base · 6.72 on glass-solid",
"--accent-tint":"non-text tint; --accent-text on it 5.69 (glass-1) · 5.80 (glass-solid)",
"--status-neutral":"on its tint 6.30 · plain on glass-solid 7.45",
"--status-neutral-tint":"non-text tint",
"--status-attention":"on its tint 4.92 · plain on glass-solid 5.88",
"--status-attention-tint":"non-text tint",
"--status-negative":"on its tint 6.25 · plain on glass-solid 7.63",
"--status-negative-tint":"non-text tint",
"--status-positive":"on its tint 5.03 · plain on glass-solid 6.03",
"--status-positive-tint":"non-text tint",
"--on-status":"no rule in bundle.css or orbit.css reads it",
"--pos-fill-1":"white on it 4.20 (v3.4's own #2C8A74 measures the same 4.20: inherited)",
"--pos-fill-2":"white on it 6.03",
"--chart-1":"non-text 12.97 on glass-solid",
"--chart-2":"non-text 8.06",
"--chart-3":"non-text 5.05",
"--chart-4":"non-text 3.23",
"--chart-5":"non-text 2.44: under 3:1 (v3.4's own step 5 is 2.44)",
"--chart-6":"non-text 1.78: under 3:1 (v3.4's own step 6 is 1.79)",
"--aurora-1":"non-text","--aurora-2":"non-text","--aurora-3":"non-text",
"--nav-1":"--nav-ink on it 8.72 · ink-2 6.24 · ink-3 4.63 · marker 4.35 (non-text) · cream logo 8.72 (non-text)",
"--nav-2":"--nav-ink 12.68 · ink-2 8.50 · ink-3 5.91 · marker 6.32 (non-text) · cream logo 12.68",
"--nav-3":"--nav-ink 14.58 · ink-2 9.58 · ink-3 6.53 · marker 7.27 (non-text) · cream logo 14.58; text on --nav-mark (badge) 7.27",
"--nav-ink":"on the active item (nav-active over the stops) 6.03 · 8.83 · 10.21",
"--nav-ink-2":"80% of nav-ink, composited: 6.24 · 8.50 · 9.58 on the three stops",
"--nav-ink-3":"64% of nav-ink, composited: 4.63 · 5.91 · 6.53 on the three stops",
"--nav-hover":"non-text","--nav-active":"non-text; see --nav-ink","--nav-mark":"non-text 4.35 · 6.32 · 7.27 on the three stops","--nav-line":"non-text separator",
"--scrim":"non-text",
"--tip-bg":"--tip-ink on it 17.03",
"--tip-ink":"17.03 on --tip-bg",
"--edge":"non-text","--lift-1":"non-text","--lift-2":"non-text",
}
DARK={
"--base":"ink 12.29 · ink-2 8.05 · ink-3 7.18 · ink-mute 4.46 · brand 7.21 · accent-text 8.00",
"--glass-1":"ink 10.00 · ink-2 6.55 · ink-3 5.84 · ink-mute 3.63",
"--glass-2":"ink 9.07 · ink-2 5.94 · ink-3 5.30 · ink-mute 3.29",
"--glass-3":"ink 8.09 · ink-2 5.30 · ink-3 4.73 · ink-mute 2.93 (dimmed)",
"--glass-solid":"ink 8.22 · ink-2 5.38 · ink-3 4.80 · ink-mute 2.98 (dimmed)",
"--ink":"12.29 on base · 8.22 on glass-solid","--ink-2":"8.05 · 5.38","--ink-3":"7.18 · 4.80","--ink-mute":"4.46 · 2.98 (dimmed)",
"--brand":"7.21 on base · 4.82 on glass-solid · as text on its tint (.ob-tag-brand) 4.49 on glass-1 · 3.78 on glass-solid: FAIL",
"--brand-deep":"3.58 on base: FAIL as text (read as text only by --info-subtle-foreground, never fired)",
"--fill-1":"white 4.98","--fill-2":"white 6.45","--fill-3":"white 10.26",
"--accent":"non-text 6.74 on base","--accent-soft":"non-text 10.17","--accent-text":"8.00 on base · 5.35 on glass-solid",
"--accent-tint":"--accent-text on it 5.09 (glass-1) · 4.28 (glass-solid): FAIL on glass-solid (.av.ob-av-ai, .ob-tag-accent)",
"--status-neutral":"on its tint 5.70 · plain on glass-solid 5.69","--status-attention":"5.61 · 5.67","--status-negative":"5.75 · 5.65 · white (--on-fill) on it 1.92: FAIL (badge, latent)","--status-positive":"5.82 · 5.90",
"--chart-1":"non-text 9.59","--chart-2":"7.72","--chart-3":"5.97","--chart-4":"4.51","--chart-5":"3.18","--chart-6":"2.26: under 3:1",
"--tip-bg":"--tip-ink on it 12.29",
}
out=[]
out.append("""/* UnifyApps · POC Studio: the token block of the CLONED stylesheet, with a measured ratio beside each token.
   Values are the source's, byte for byte (src/orbit/ds/tokens.css; checked by source-audit/verify_tokens.py). Nothing here is a
   new colour and no value was moved: this file is the source's block annotated, not a second stylesheet. Do not import it
   into the app (the app imports the source's own three files, design-package.md).
   Ratios are WCAG contrast from reskin.py (scripts/reskin.py audit and contrast), composited over --base as the audit does.
   Bar: 4.5 for text, 3.0 for non-text. 'FAIL' and 'under 3:1' are printed, not fixed: see port-note.md section 3.
   LIGHT is the theme the app runs (Shell.tsx forces data-theme=light). DARK is live in the source but not wired. */
""")
cur=None; section=None
lines=src.splitlines()
for ln in lines:
    m=re.match(r"\s*(--[a-z0-9-]+):\s*(.*?);\s*$",ln)
    if ln.startswith(":root {"):
        section="light"; out.append(":root {"); continue
    if ln.startswith(':root[data-theme="dark"]'):
        section="dark"; out.append("\n/* DARK: live, not wired. Only what the source overrides. */"); out.append(':root[data-theme="dark"] {'); continue
    if ln.startswith("}"):
        out.append("}"); continue
    if not m: continue
    name,val=m.group(1),m.group(2)
    if section=="light" and name in HEAD:
        out.append("\n  /* %s */"%HEAD[name])
    note=(LIGHT if section=="light" else DARK).get(name)
    if note is None:
        if re.match(r"--(font|r|space|type)",name): note="not a colour pair"
        elif section=="dark": note="same use and rule as light"
        else: note="non-text"
    out.append("  %s: %s; /* %s */"%(name,val,note))
open("tokens.css","w").write("\n".join(out)+"\n")
print(len(out),"lines")
