"""Pin the exported PDF to exactly A1, then verify geometry and content."""
from decimal import Decimal
from pypdf import PdfReader, PdfWriter
from PIL import Image

A1_W, A1_H = Decimal("1683.78"), Decimal("2383.94")   # 594 x 841 mm at 72 dpi
PDF = "AIIQ-Poster-A1.pdf"

r = PdfReader(PDF)
print(f"chrome output : {float(r.pages[0].mediabox.width):.2f} x {float(r.pages[0].mediabox.height):.2f} pt")

w = PdfWriter()
for page in r.pages:
    for box in ("mediabox", "cropbox", "trimbox", "bleedbox", "artbox"):
        try:
            b = getattr(page, box)
            b.lower_left = (0, 0)
            b.upper_right = (A1_W, A1_H)
        except Exception:
            pass
    w.add_page(page)
w.add_metadata({
    "/Title": "AIIQ - An AI-Powered, Source-Grounded Learning & Assessment Platform",
    "/Subject": "University project poster (A1 portrait, 594 x 841 mm)",
    "/Author": "Alok Yadav",
    "/Creator": "AIIQ project",
})
with open(PDF, "wb") as f:
    w.write(f)

# ── verify ────────────────────────────────────────────────────────────────
r2 = PdfReader(PDF)
p = r2.pages[0]
mw, mh = float(p.mediabox.width), float(p.mediabox.height)
mmf = 25.4 / 72
print("=" * 56)
print("A1 VERIFICATION")
print("=" * 56)
print(f"pages       : {len(r2.pages)}")
print(f"MediaBox    : {mw:.4f} x {mh:.4f} pt")
print(f"            : {mw*mmf:.4f} x {mh*mmf:.4f} mm")
print(f"CropBox     : {float(p.cropbox.width):.4f} x {float(p.cropbox.height):.4f} pt")
print(f"rotation    : {p.get('/Rotate', 0)}")
print(f"orientation : {'PORTRAIT' if mh > mw else 'LANDSCAPE'}")
print(f"exact A1    : {'YES' if round(mw,2)==1683.78 and round(mh,2)==2383.94 else 'NO'}")
print(f"images      : {len(p.images)} embedded")
txt = p.extract_text() or ""
print(f"text        : {len(txt)} chars (selectable)")
missing = [s for s in ["Project Overview","Problem","Objectives","The Application",
                       "Key Features","Technology","AI & Data Science Components",
                       "Results & Evaluation","Future Scope"] if s not in txt]
print(f"sections    : {'all 9 present' if not missing else 'MISSING ' + ', '.join(missing)}")
for gone in ["Responsive audit","horizontal overflow","Production build","browser refresh","HTTP 409"]:
    if gone in txt:
        print(f"  !! still present: {gone}")
print("=" * 56)

# ── clipping check on the matching raster ────────────────────────────────
im = Image.open("full.png").convert("RGB")
iw, ih = im.size
px = im.load()
last = next(y for y in range(ih - 1, -1, -1)
            if any(sum(px[x, y]) < 720 for x in range(0, iw, 7)))
right = next(x for x in range(iw - 1, -1, -1)
             if any(sum(px[x, y]) < 720 for y in range(0, ih, 7)))
print(f"bottom clearance : {ih-last-1}px = {(ih-last-1)*594/iw:.1f}mm")
print(f"right clearance  : {iw-right-1}px = {(iw-right-1)*594/iw:.1f}mm")
im.resize((780, int(780 * ih / iw)), Image.LANCZOS).save("preview.png")
print("preview.png written")
