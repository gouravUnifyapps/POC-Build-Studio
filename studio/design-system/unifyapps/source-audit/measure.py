"""Measures the SOURCE stylesheet (orbit/ds/tokens.css + bundle.css) with the studio's own reskin.py maths.
Step A: writes source-measured.css = tokens.css with variable NAMES mapped to v3.4's (no value changed) so that
        `reskin.py audit` can read it, then runs the audit.
Step B: contrast rows the audit does not cover (accent, rail ink, logo, fills, chart ramp, focus).
Step C: token-by-job comparison of the source against the fresh transform (client.css)."""
import re, sys, importlib.util, subprocess, json
SRC=sys.argv[1]
spec=importlib.util.spec_from_file_location("reskin","/Users/gouravmahunta/.claude/plugins/cache/demo-studio/demo-studio/0.8.1/scripts/reskin.py")
R=importlib.util.module_from_spec(spec); spec.loader.exec_module(R)
tok=open(SRC+"/ds/tokens.css").read()
bun=open(SRC+"/ds/bundle.css").read()
T_light=R.tokens(R.block(tok,r":root"))
T_dark=dict(T_light); T_dark.update(R.tokens(R.block(tok,r':root\[data-theme="dark"\]')))
# ---- Step A: name-mapped copy
m=tok
m=re.sub(r"--status-(neutral|attention|negative|positive)-tint",r"--st-\1-t",m)
m=re.sub(r"--status-(neutral|attention|negative|positive)\b",r"--st-\1",m)
m=m.replace(":root {",":root {\n  --sp-blue: %s; /* alias of --brand, name only */"%T_light["--brand"],1)
m=m.replace(':root[data-theme="dark"] {',':root[data-theme="dark"] {\n  --sp-blue: %s; /* alias of --brand, name only */'%T_dark["--brand"],1)
f=[T_light["--fill-1"],T_light["--fill-2"],T_light["--fill-3"]]
m+="\n/* from bundle.css .btn-p{background:linear-gradient(180deg,var(--fill-1) 0%%,var(--fill-2) 42%%,var(--fill-3) 100%%)} with the three tokens inlined */\n.btn-p{background:linear-gradient(180deg,%s 0%%,%s 42%%,%s 100%%)}\n"%tuple(f)
open("source-audit/source-measured.css","w").write(m)
print("## A. reskin.py audit on source-measured.css (tokens.css with names mapped, no value touched)")
print(subprocess.run(["python3","/Users/gouravmahunta/.claude/plugins/cache/demo-studio/demo-studio/0.8.1/scripts/reskin.py","audit","--css","source-audit/source-measured.css"],capture_output=True,text=True).stdout)
# ---- Step B
def col(tk,name):
    v=R.parse_color(tk[name]); return v
def comp(tk,name,over):
    v=col(tk,name); return R.composite(v[0],v[1],over)
rows=[]
def add(theme,label,fg,bg,bar,kind):
    r=R.contrast(fg,bg); rows.append((theme,label,r,r>=bar,bar,kind))
for theme,tk in (("light",T_light),("dark",T_dark)):
    base=col(tk,"--base")[0]
    gs=comp(tk,"--glass-solid",base); g1=comp(tk,"--glass-1",base)
    add(theme,"--brand (accent text) on base",col(tk,"--brand")[0],base,4.5,"text")
    add(theme,"--brand on glass-solid",col(tk,"--brand")[0],gs,4.5,"text")
    add(theme,"--brand-deep on base",col(tk,"--brand-deep")[0],base,4.5,"text")
    add(theme,"--accent-text on base",col(tk,"--accent-text")[0],base,4.5,"text")
    add(theme,"--accent-text on glass-solid",col(tk,"--accent-text")[0],gs,4.5,"text")
    add(theme,"--accent (bronze) on base, non-text",col(tk,"--accent")[0],base,3.0,"non-text")
    add(theme,"--accent-soft on base, non-text",col(tk,"--accent-soft")[0],base,3.0,"non-text")
    add(theme,"--focus ring on base, non-text",col(tk,"--focus")[0],base,3.0,"non-text")
    for i in (1,2,3):
        add(theme,"%s on --fill-%d"%(tk["--on-fill"],i),col(tk,"--on-fill")[0],col(tk,"--fill-%d"%i)[0],4.5,"text")
    for i in (1,2):
        add(theme,"white on --pos-fill-%d (.pip.done digit)"%i,(255,255,255),col(tk,"--pos-fill-%d"%i)[0],4.5,"text")
    for s in ("neutral","attention","negative","positive"):
        t=col(tk,"--status-%s"%s)[0]
        add(theme,"--status-%s on glass-solid (plain)"%s,t,gs,4.5,"text")
    add(theme,"tooltip --tip-ink on --tip-bg",col(tk,"--tip-ink")[0],col(tk,"--tip-bg")[0],4.5,"text")
    for i in range(1,7):
        add(theme,"--chart-%d on glass-solid, non-text"%i,col(tk,"--chart-%d"%i)[0],gs,3.0,"non-text")
    # chart: nearest-step separation (non-text) , printed for the record
    for i in range(1,6):
        add(theme,"--chart-%d vs --chart-%d, adjacent steps"%(i,i+1),col(tk,"--chart-%d"%i)[0],col(tk,"--chart-%d"%(i+1))[0],1.3,"adjacent")
# rail: nav ink on the three gradient stops (theme-independent in the source: both themes carry the same nav tokens)
tk=T_light
for i in (1,2,3):
    stop=col(tk,"--nav-%d"%i)[0]
    ink=col(tk,"--nav-ink")[0]
    add("rail","--nav-ink on --nav-%d %s"%(i,tk["--nav-%d"%i]),ink,stop,4.5,"text")
    add("rail","--nav-ink-2 (.80) on --nav-%d"%i,R.composite(*(lambda v:(v[0],v[1]))(col(tk,"--nav-ink-2")),stop),stop,4.5,"text")
    add("rail","--nav-ink-3 (.64) on --nav-%d"%i,R.composite(*(lambda v:(v[0],v[1]))(col(tk,"--nav-ink-3")),stop),stop,4.5,"text")
    add("rail","--nav-mark (active marker) on --nav-%d, non-text"%i,col(tk,"--nav-mark")[0],stop,3.0,"non-text")
    add("rail","logo #EDE6D7 (source's reversed PNG) on --nav-%d, non-text"%i,(237,230,215),stop,3.0,"non-text")
    add("rail","kit reversed-mono.svg #FFFFFF on --nav-%d, non-text"%i,(255,255,255),stop,3.0,"non-text")
# nav-active/hover composites for the active item text
act=col(tk,"--nav-active"); 
for i in (1,2,3):
    stop=col(tk,"--nav-%d"%i)[0]; surf=R.composite(act[0],act[1],stop)
    add("rail","--nav-ink on active item over --nav-%d"%i,col(tk,"--nav-ink")[0],surf,4.5,"text")
# logo gold on the app grounds (kit horizontal lockup #847347 in the page header only)
logo=R.hex_to_rgb("#847347")
base=col(T_light,"--base")[0]; gs=comp(T_light,"--glass-solid",base)
add("light","kit gold lockup #847347 on --base, non-text",logo,base,3.0,"non-text")
add("light","kit gold lockup #847347 on glass-solid, non-text",logo,gs,3.0,"non-text")
print("## B. contrast rows the audit does not cover  (bar: 4.5 text, 3.0 non-text; adjacent chart steps listed for the record)")
fails=0
for th,l,r,ok,bar,kind in rows:
    if kind=="adjacent": mark="(info)"
    else:
        mark="pass" if ok else ("FAIL" if kind=="text" else "under 3:1")
        if not ok: fails+=1
    print("%-6s %-62s %6.2f:1  bar %.1f  %s"%(th,l,r,bar,mark))
print("rows below their bar:",fails)
json.dump([[a,b,round(c,2),d,e,f] for a,b,c,d,e,f in rows],open("source-audit/extra-rows.json","w"))
