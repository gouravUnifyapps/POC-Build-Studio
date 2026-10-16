"""Iteration chip, Latest pill, box rows and the branch numeral in the source's orbit.css, plus what the tone-1 avatar and the open-gate
ring would measure if --accent were the bronze tokens.css declares (the proposed fix P1)."""
import sys, importlib.util
spec=importlib.util.spec_from_file_location("reskin","/Users/gouravmahunta/.claude/plugins/cache/demo-studio/demo-studio/0.8.1/scripts/reskin.py")
R=importlib.util.module_from_spec(spec); spec.loader.exec_module(R)
tok=open(sys.argv[1]+"/ds/tokens.css").read()
T=R.tokens(R.block(tok,r":root"))
base=R.parse_color(T["--base"])[0]; gs=R.composite(*R.parse_color(T["--glass-solid"]),base)
soft=R.hex_to_rgb(T["--accent-soft"]); text=R.hex_to_rgb(T["--accent-text"]); acc=R.hex_to_rgb(T["--accent"])
ink=R.parse_color(T["--ink"])[0]
out=[]
for lab,a in (("chip",.28),("chip hover/open",.48)):
    for gl,g in (("base",base),("glass-solid",gs)):
        out.append((".ob-loops-chip "+lab,"--accent-text on accent-soft %d%% over %s"%(a*100,gl),R.contrast(text,R.composite(soft,a,g)),4.5))
box=R.composite(soft,.12,gs)
out.append((".ob-loops-box rows","--ink on box",R.contrast(ink,box),4.5))
out.append((".ob-loops-box rows","--ink-2 on box",R.contrast(R.parse_color(T["--ink-2"])[0],box),4.5))
out.append((".ob-loops-box rows","--ink-3 (time) on box",R.contrast(R.parse_color(T["--ink-3"])[0],box),4.5))
out.append((".ob-loops-row:hover","--ink on hover wash",R.contrast(ink,R.composite(soft,.22,box)),4.5))
out.append((".ob-loops-latest","--accent-text on accent-soft 45% over box",R.contrast(text,R.composite(soft,.45,box)),4.5))
top=tuple(round(text[i]*.7+soft[i]*.3) for i in range(3))
out.append((".ob-branch-n","white on top stop "+R.rgb_to_hex(top),R.contrast((255,255,255),top),4.5))
out.append((".ob-branch-n","white on bottom stop --accent-text",R.contrast((255,255,255),text),4.5))
# P1: --accent as declared (#857242)
def mix(a,b,t): return tuple(round(a[i]*(1-t)+b[i]*t) for i in range(3))
for lab,t in (("start",0),("mid",.5),("end",1)):
    out.append((".av.ob-tone-1 IF --accent = #857242 (fix P1)","white on gradient "+lab,R.contrast((255,255,255),mix(acc,text,t)),4.5))
out.append((".ob-jgate.is-open ring IF --accent = #857242 (fix P1)","ring on glass-solid, non-text",R.contrast(acc,gs),3.0))
out.append((".ob-jgate-d / .ob-jcard.is-selected ring (--accent-soft, as is)","ring on glass-solid, non-text",R.contrast(soft,gs),3.0))
# tag text if brand-deep (fix P2)
bd=R.parse_color(T["--brand-deep"])[0]; bt=R.composite(*R.parse_color(T["--brand-tint"]),gs)
out.append((".tag.ob-tag-brand IF color = --brand-deep (fix P2)","--brand-deep on --brand-tint over glass-solid",R.contrast(bd,bt),4.5))
for a,b,c,d in out: print("%-62s %-52s %6.2f:1 bar %.1f %s"%(a,b,c,d,"pass" if c>=d else "FAIL"))
