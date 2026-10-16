"""Rule-by-rule comparison of the source bundle.css against the v3.4 stylesheet (v34.css).
Reads both files, writes nothing but stdout. Names of variables are mapped by job before values are compared."""
import re, sys, json
def parse(css):
    css=re.sub(r"/\*.*?\*/","",css,flags=re.S)
    rules={}  # key: (media, selector) -> dict(prop->val)
    i=0; n=len(css)
    def block(i):
        # returns (content, end) for the block starting at i (after '{')
        d=1; j=i
        while j<n and d:
            if css[j]=="{": d+=1
            elif css[j]=="}": d-=1
            j+=1
        return css[i:j-1], j
    def walk(text, media):
        k=0; m=len(text)
        while k<m:
            b=text.find("{",k)
            if b<0: break
            sel=text[k:b].strip()
            d=1; j=b+1
            while j<m and d:
                if text[j]=="{": d+=1
                elif text[j]=="}": d-=1
                j+=1
            inner=text[b+1:j-1]
            if sel.startswith("@media") or sel.startswith("@supports"):
                walk(inner, media+" "+sel)
            elif sel.startswith("@"):
                rules[(media,sel)]={"__raw__":inner.strip()}
            else:
                decl={}
                for p in re.split(r";(?![^()]*\))",inner):
                    if ":" in p:
                        a,v=p.split(":",1); decl[a.strip()]=v.strip()
                for s in [x.strip() for x in sel.split(",")]:
                    rules.setdefault((media,s),{}).update(decl)
            k=j
    walk(css,"")
    return rules
v=parse(open("v34.css").read()); b=parse(open(sys.argv[1]).read())
vk=set(v); bk=set(b)
print("selectors in v34:",len(vk)," in source bundle:",len(bk))
print("v34 selectors missing from bundle:",len(vk-bk))
for k in sorted(vk-bk)[:80]: print("   missing",k)
print("selectors only in bundle:",len(bk-vk))
# differing declarations in shared selectors
diffs=[]
for k in sorted(vk&bk):
    for p in set(v[k])|set(b[k]):
        x=v[k].get(p); y=b[k].get(p)
        if x!=y: diffs.append((k,p,x,y))
print("shared selectors:",len(vk&bk)," declarations differing:",len(diffs))
json.dump([[list(k),p,x,y] for k,p,x,y in diffs],open("source-audit/rulediff.json","w"),indent=1)
