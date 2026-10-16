import re,sys
def decls(p):
    t=re.sub(r"/\*.*?\*/","",open(p).read(),flags=re.S)
    return re.findall(r"(--[a-z0-9-]+):\s*(.*?);",t)
a=decls(sys.argv[1]+"/ds/tokens.css"); b=decls(sys.argv[2])
print("source declarations",len(a),"tokens.css declarations",len(b),"identical in value and order:",a==b)
