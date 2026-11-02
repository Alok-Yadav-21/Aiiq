"""Build a contact sheet of the captured screenshots for visual review."""
import sys
from PIL import Image

names = sys.argv[1:] or ["dashboard", "quiz", "results", "workspace"]
thumbs = []
for n in names:
    im = Image.open(f"shots/{n}.png").convert("RGB")
    w = 300
    thumbs.append((n, im.size, im.resize((w, int(w * im.size[1] / im.size[0])), Image.LANCZOS)))

h = max(t[2].size[1] for t in thumbs)
sheet = Image.new("RGB", (len(thumbs) * 310 + 10, h + 10), "white")
for i, (n, size, t) in enumerate(thumbs):
    sheet.paste(t, (10 + i * 310, 5))
    print(f"{n:12s} {size[0]}x{size[1]}")
sheet.save("contact.png")
print("contact.png written")
