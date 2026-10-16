"""Kit components the NEW regions in design.md reuse, measured in the source's tokens against v3.4 and the fresh transform.
AI Insight card (.ai:not(.msg)): .micro in --brand and .ground in --ink-3 on the card's three gradient stops over glass-1.
History bubble (.msg.ai): ink on the bubble; sender label and time on the tab panel."""
import sys, re, importlib.util
spec=importlib.util.spec_from_file_location("reskin","/Users/gouravmahunta/.claude/plugins/cache/demo-studio/demo-studio/0.8.1/scripts/reskin.py")
R=importlib.util.module_from_spec(spec); spec.loader.exec_module(R)
def ai(css_path,brand_tok):
    t=open(css_path).read()
    T=R.tokens(R.block(t,r":root"))
    base=R.parse_color(T["--base"])[0]; g1=R.composite(*R.parse_color(T["--glass-1"]),base)
    m=re.search(r"\.ai:not\(\.msg\)\{[^}]*?background:linear-gradient\(135deg,([^;]*?)\),var\(--glass-1\)",t)
    stops=re.findall(r"rgba\((\d+),(\d+),(\d+),([.\d]+)\)",m.group(1))
    brand=R.parse_color(T[brand_tok])[0]; ink3=R.parse_color(T["--ink-3"])[0]
    out=[]
    for r_,g_,b_,a in stops:
        bg=R.composite((int(r_),int(g_),int(b_)),float(a),g1)
        out.append((R.rgb_to_hex(bg),R.contrast(brand,bg),R.contrast(ink3,bg)))
    return out
for lab,path,tok in (("v3.4 original","v34.css","--sp-blue"),("fresh transform","client.css","--sp-blue"),("SOURCE (bundle.css gradient, tokens.css values)",None,None)):
    if path:
        res=ai(path,tok)
    else:
        # source: gradient is in bundle.css, tokens in tokens.css
        t=open(sys.argv[1]+"/ds/tokens.css").read(); b=open(sys.argv[1]+"/ds/bundle.css").read()
        open("source-audit/_src_ai.css","w").write(t+"\n"+b)
        res=ai("source-audit/_src_ai.css","--brand")
    print("%-48s"%lab," | ".join("stop %s: .micro brand %.2f, .ground ink-3 %.2f"%x for x in res))
