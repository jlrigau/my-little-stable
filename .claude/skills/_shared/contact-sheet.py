#!/usr/bin/env python3
"""Contact sheet of screenshots (for visual review): python3 contact-sheet.py DIR [OUT.png] [--cols 4] [--w 360]
Each image is labelled with its file name; pages of up to 8 images (OUT-1.png, OUT-2.png…)."""
import sys, glob, os
from PIL import Image, ImageDraw
argv = sys.argv[1:]
args = [a for i, a in enumerate(argv) if not a.startswith("--") and not (i > 0 and argv[i - 1].startswith("--"))]
opt = lambda k, d: int(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
src = args[0]; out = args[1] if len(args) > 1 else os.path.join(src, "_contact.png")
cols, w = opt("--cols", 4), opt("--w", 360)
files = [f for f in sorted(glob.glob(os.path.join(src, "*.png"))) if not os.path.basename(f).startswith("_")]
per = cols * 2
for page in range(0, len(files), per):
    chunk = files[page:page + per]; ims = []
    for f in chunk:
        im = Image.open(f).convert("RGB"); h = int(im.height * w / im.width); ims.append((os.path.basename(f), im.resize((w, h))))
    H = max(i.height for _, i in ims) + 22; rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (w + 8), rows * (H + 8)), (30, 30, 36)); d = ImageDraw.Draw(sheet)
    for k, (n, im) in enumerate(ims):
        x, y = (k % cols) * (w + 8), (k // cols) * (H + 8)
        sheet.paste(im, (x, y + 20)); d.text((x + 4, y + 4), n, fill=(255, 255, 255))
    o = out if len(files) <= per else out.replace(".png", f"-{page // per + 1}.png")
    sheet.save(o); print(o)
