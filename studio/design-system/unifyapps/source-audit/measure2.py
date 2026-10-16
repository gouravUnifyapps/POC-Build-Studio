"""Product-level compositions in the source's own CSS (orbit.css + bundle.css), measured with reskin.py's maths.
Each row names the rule it comes from. Grounds are composited over --base, as the audit does."""
import sys, importlib.util, re
SRC=sys.argv[1]
spec=importlib.util.spec_from_file_location("reskin","/Users/gouravmahunta/.claude/plugins/cache/demo-studio/demo-studio/0.8.1/scripts/reskin.py")
R=importlib.util.module_from_spec(spec); spec.loader.exec_module(R)
tok=open(SRC+"/ds/tokens.css").read()
TL=R.tokens(R.block(tok,r":root")); TD=dict(TL); TD.update(R.tokens(R.block(tok,r':root\[data-theme="dark"\]')))
def c(tk,n): return R.parse_color(tk[n])
def over(fg,bg): return R.composite(fg[0],fg[1],bg)
rows=[]
def row(theme,rule,label,fg,bg,bar):
    r=R.contrast(fg,bg); rows.append((theme,rule,label,r,bar,r>=bar))
for theme,tk in (("light",TL),("dark",TD)):
    base=c(tk,"--base")[0]; g1=over(c(tk,"--glass-1"),base); gs=over(c(tk,"--glass-solid"),base)
    for gname,g in (("glass-1",g1),("glass-solid",gs)):
        brand_t=over(c(tk,"--brand-tint"),g)
        row(theme,".tag.ob-tag-brand","--brand on --brand-tint over %s  ('Building' tag)"%gname,c(tk,"--brand")[0],brand_t,4.5)
        acc_t=over(c(tk,"--accent-tint"),g)
        row(theme,".tag.ob-tag-accent","--accent-text on --accent-tint over %s"%gname,c(tk,"--accent-text")[0],acc_t,4.5)
        inner=over(c(tk,"--inner"),g)
        row(theme,".tag (no tone)","--ink-2 on --inner over %s"%gname,c(tk,"--ink-2")[0],inner,4.5)
        row(theme,".av.ob-av-ai","--accent-text on --accent-tint over %s"%gname,c(tk,"--accent-text")[0],acc_t,4.5)
    row(theme,".ps-nav-item .ct.hot","--nav-3 on --nav-mark",c(tk,"--nav-3")[0],c(tk,"--nav-mark")[0],4.5)
    row(theme,".ps-iconbtn .badge / .btn-d:hover","--on-fill on --status-negative",c(tk,"--on-fill")[0],c(tk,"--status-negative")[0],4.5)
# avatar tones: white (--on-fill) on gradient start / mid / end; tone-1 starts at --accent which orbit.css:22 rebinds to --inner
tk=TL; base=c(tk,"--base")[0]; gs=over(c(tk,"--glass-solid"),base)
white=(255,255,255)
def mix(a,b,t): return tuple(round(a[i]*(1-t)+b[i]*t) for i in range(3))
tones={0:("--fill-1","--fill-3"),1:("--accent","--accent-text"),2:("--pos-fill-1","--pos-fill-2"),3:("--status-attention","--accent-text"),4:("--brand","--brand-deep"),5:("--chart-3","--chart-1")}
for t,(a,b) in tones.items():
    if t==1:
        # CSS interpolates in premultiplied space; --accent resolves to --inner (rgba(41,70,27,.045))
        a_rgba=c(tk,"--inner"); b_rgb=c(tk,b)[0]
        for lab,tt in (("start",0),("mid",.5),("end",1)):
            al=a_rgba[1]*(1-tt)+1.0*tt
            pm=[a_rgba[0][i]*a_rgba[1]*(1-tt)+b_rgb[i]*tt for i in range(3)]
            col=tuple(pm[i]/al for i in range(3))
            fg=R.composite(tuple(round(x) for x in col),al,gs)
            row("light",".av.ob-tone-1 (as rendered: --accent = --inner)","white on gradient %s"%lab,white,fg,4.5)
        # what it would be if --accent were the bronze the tokens declare
        for lab,tt in (("start",0),("mid",.5),("end",1)):
            fg=mix(c(tk,"--accent")[0] if False else R.hex_to_rgb(tk["--accent"]),c(tk,b)[0],tt)
        # tokens.css's own --accent value, for the record (see below)
    else:
        A=c(tk,a)[0]; B=c(tk,b)[0]
        for lab,tt in (("start",0),("mid",.5),("end",1)):
            row("light",".av.ob-tone-%d"%t,"white on gradient %s (%s to %s)"%(lab,a,b),white,mix(A,B,tt),4.5)
# the open-gate ring: inset 2px var(--accent) (orbit.css:701), a non-text boundary on a glass-solid diamond
for theme,tk in (("light",TL),("dark",TD)):
    base=c(tk,"--base")[0]; gs=over(c(tk,"--glass-solid"),base)
    inner=over(c(tk,"--inner"),gs)
    row(theme,".ob-jgate.is-open .ob-jgate-d ring, as rendered in light (--accent = --inner)" if theme=="light" else ".ob-jgate.is-open ring, dark (--accent = bronze, but dark is not wired)","ring colour on --glass-solid (non-text 3:1)",
        inner if theme=="light" else c(tk,"--accent")[0],gs,3.0)
row("light",".ob-jgate.is-open ring if --accent were the declared bronze #857242","ring colour on --glass-solid (non-text 3:1)",R.hex_to_rgb(TL["--accent"]),over(c(TL,"--glass-solid"),c(TL,"--base")[0]),3.0)
for th,rule,l,r,bar,ok in rows:
    print("%-6s %-62s %-62s %6.2f:1 bar %.1f %s"%(th,rule,l,r,bar,"pass" if ok else "FAIL"))
print("rows below bar:",sum(1 for x in rows if not x[5]))
