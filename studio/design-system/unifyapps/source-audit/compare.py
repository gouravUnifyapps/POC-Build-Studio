"""Token-by-job comparison: the source's tokens.css against the fresh v3.4 transform (client.css). Names are mapped by job.
Prints a markdown table: v3.4 token, source token, source value, transform value, hue, sat, Y, dY and hue distance."""
import sys, importlib.util, colorsys
SRC=sys.argv[1]
spec=importlib.util.spec_from_file_location("reskin","/Users/gouravmahunta/.claude/plugins/cache/demo-studio/demo-studio/0.8.1/scripts/reskin.py")
R=importlib.util.module_from_spec(spec); spec.loader.exec_module(R)
S=open(SRC+"/ds/tokens.css").read(); C=open("client.css").read()
SL=R.tokens(R.block(S,r":root")); SD=dict(SL); SD.update(R.tokens(R.block(S,r':root\[data-theme="dark"\]')))
CL=R.tokens(R.block(C,r":root")); CD=dict(CL); CD.update(R.tokens(R.block(C,r':root\[data-theme="dark"\]')))
M=[("page ground","--base","--base"),("page tint","--page-top","--page-tint"),("ink","--ink","--ink"),("ink 2","--ink-2","--ink-2"),("ink 3","--ink-3","--ink-3"),("ink mute (dimmed)","--ink-mute","--ink-mute"),
   ("brand accent (text, focus)","--sp-blue","--brand"),("brand deep","--sp-deep","--brand-deep"),
   ("secondary, light end","--sp-pink","--accent-soft"),("secondary, strong","--sp-cerise","--accent"),
   ("status neutral","--st-neutral","--status-neutral"),("status attention","--st-attention","--status-attention"),("status negative","--st-negative","--status-negative"),("status positive","--st-positive","--status-positive"),
   ("chart 1","--c1","--chart-1"),("chart 2","--c2","--chart-2"),("chart 3","--c3","--chart-3"),("chart 4","--c4","--chart-4"),("chart 5","--c5","--chart-5"),("chart 6","--c6","--chart-6")]
def rgbof(v):
    p=R.parse_color(v); return p[0] if p else None
def fmt(rgb):
    h,s,l=R.hue_sat(rgb); return "%s (H%.0f S%.2f)"%(R.rgb_to_hex(rgb),h,s)
def hd(a,b):
    d=abs(R.hue_sat(a)[0]-R.hue_sat(b)[0]); return min(d,360-d)
print("| job | v3.4 token | source token | source value | fresh transform value | dY | hue gap |")
print("|---|---|---|---|---|---|---|")
for theme,s,c in (("light",SL,CL),("dark",SD,CD)):
    for job,ct,st in M:
        a=rgbof(s[st]); b=rgbof(c[ct])
        if a is None or b is None: continue
        sat_a=R.hue_sat(a)[1]; 
        print("| %s %s | %s | %s | %s | %s | %.3f | %s |"%(theme,job,ct,st,fmt(a),fmt(b),R.Y(a)-R.Y(b),"%.0f deg"%hd(a,b) if min(R.hue_sat(a)[1],R.hue_sat(b)[1])>=.06 else "neutral"))
# button fill stops
print()
print("| fill stop | v3.4 .btn-p stop (transformed) | source --fill | source value | transform value | dY |")
import re
st=re.findall(r"\.btn-p\{background:linear-gradient\([^)]*?(#[0-9A-Fa-f]{6})[^#]*?(#[0-9A-Fa-f]{6})[^#]*?(#[0-9A-Fa-f]{6})",C)[0]
for i,(sv,cv) in enumerate(zip(("--fill-1","--fill-2","--fill-3"),st),1):
    a=R.hex_to_rgb(SL[sv]); b=R.hex_to_rgb(cv)
    print("| %d | %s | %s | %s | %s | %.3f |"%(i,cv,sv,fmt(a),fmt(b),R.Y(a)-R.Y(b)))
# glass, inner, aurora alphas (rgb of the tints)
print()
for lab,ct,st in (("inner","--inner","--inner"),("hair","--hair","--hair"),("hair 2","--hair-2","--hair-2"),("glass solid dark","--glass-solid","--glass-solid")):
    print(lab,"| source",SL[st],"| transform",CL[ct])
print("aurora source",SL["--aurora-1"],SL["--aurora-2"],SL["--aurora-3"],"| transform bare triples",CL["--aur-a"],CL["--aur-b"],CL["--aur-c"],"alphas",CL["--aur-1"],CL["--aur-2"],CL["--aur-3"])
print("lift-1 source",SL["--lift-1"],"| transform",CL["--lift-1"])
