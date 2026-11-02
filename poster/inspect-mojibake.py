"""Show the remaining mojibake sequences with context so they can be targeted."""
import io
import re
from collections import Counter

s = io.open("poster.html", encoding="utf-8").read()
seqs = Counter(re.findall(r"[ÂÃâ][-ÿ -⃿œž]{1,3}", s))
for seq, n in seqs.most_common(30):
    i = s.find(seq)
    ctx = s[max(0, i - 40):i + 40].replace("\n", " ")
    print(f"{n:4d}  {seq!r:24s}  …{ctx}…")
