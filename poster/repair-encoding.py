"""
Repair double-encoded UTF-8 in poster.html.

A PowerShell read/write cycle decoded the file's UTF-8 bytes as CP1252 and
re-encoded them, turning '—' into 'â€"' and '·' into 'Â·'. A whole-document
latin-1 round-trip cannot undo it because the CSS comments legitimately
contain box-drawing characters outside latin-1, so the known sequences are
replaced explicitly instead. Longest first, so prefixes do not match early.
"""
import io

PATH = "poster.html"

FIXES = [
    ("â€”", "—"),        # em dash
    ("â€“", "–"),        # en dash
    ("â†’", "→"),        # right arrow
    ("â”€", "─"),        # box drawing light horizontal (CSS comments)
    ("â•\x90", "═"),     # box drawing double horizontal (CSS comments)
    ("Ã—", "×"),         # multiplication sign
    ("Â·", "·"),         # middle dot
    ("â€™", "’"),
    ("â€œ", "“"),
    ("â€\x9d", "”"),
    ("â€¦", "…"),
    ("Â ", " "),    # non-breaking space
]

s = io.open(PATH, encoding="utf-8").read()
before = len(s)
total = 0
for bad, good in FIXES:
    n = s.count(bad)
    if n:
        s = s.replace(bad, good)
        total += n
        print(f"  {n:4d} x {bad!r} -> {good!r}")

io.open(PATH, "w", encoding="utf-8", newline="").write(s)
print(f"replaced {total} sequences ({before} -> {len(s)} chars)")

after = io.open(PATH, encoding="utf-8").read()
leftover = [m for m in ("â€", "Â·", "Ã—", "â†", "â”", "â•") if m in after]
print("remaining mojibake:", leftover if leftover else "NONE")
for probe in ("—", "·", "→", "×", "─", "═"):
    print(f"  {probe} : {after.count(probe)}")
