"""Measure how far the poster content overflows the A1 page height."""
from PIL import Image

im = Image.open("measure.png").convert("RGB")
w, h = im.size
px = im.load()
last = next(y for y in range(h - 1, -1, -1)
            if any(sum(px[x, y]) < 720 for x in range(0, w, 7)))
content_px = last + 1
page_px = round(841 / 594 * w)          # A1 height in the same pixel scale
mm = 594 / w
print(f"canvas       : {w} x {h} px")
print(f"content ends : {content_px} px = {content_px*mm:.1f} mm")
print(f"A1 page      : {page_px} px = 841.0 mm")
over = content_px - page_px
print(f"OVERFLOW     : {over} px = {over*mm:.1f} mm" if over > 0
      else f"fits, spare  : {-over} px = {-over*mm:.1f} mm")
