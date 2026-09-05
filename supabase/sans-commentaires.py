import io, re, sys
src = open(sys.argv[1], encoding="utf-8").read()
out = []
i, n = 0, len(src)
in_s = False        # '...'
dollar = None       # $$ ou $tag$
while i < n:
    c = src[i]
    if in_s:
        out.append(c)
        if c == "'":
            in_s = False
        i += 1
        continue
    if dollar is not None:
        if src.startswith(dollar, i):
            out.append(dollar); i += len(dollar); dollar = None
        else:
            out.append(c); i += 1
        continue
    m = re.match(r"\$[A-Za-z_]*\$", src[i:])
    if m:
        dollar = m.group(0); out.append(dollar); i += len(dollar); continue
    if c == "'":
        in_s = True; out.append(c); i += 1; continue
    if src.startswith("--", i):
        j = src.find("\n", i)
        i = n if j == -1 else j
        continue
    out.append(c); i += 1
txt = "".join(out)
lignes = [l.rstrip() for l in txt.split("\n")]
res, blanc = [], False
for l in lignes:
    if l == "":
        if blanc: continue
        blanc = True
    else:
        blanc = False
    res.append(l)
open(sys.argv[2], "w", encoding="utf-8", newline="\r\n").write("\n".join(res).strip() + "\n")
print("ok")
