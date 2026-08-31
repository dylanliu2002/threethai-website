#!/usr/bin/env python3
"""Process uploaded brand assets for the website."""
from PIL import Image
import os

UP = "/home/z/my-project/upload"
OUT = "/home/z/my-project/public/images/brand"
os.makedirs(OUT, exist_ok=True)

# ---- 1. Logo: white background -> transparent ----
logo = Image.open(f"{UP}/pasted_image_1788193457023.png").convert("RGBA")
px = logo.load()
w, h = logo.size
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        # Whiteness-driven alpha: pure white -> 0, keep colored strokes fully opaque
        m = min(r, g, b)
        if m >= 246 and abs(r - g) < 10 and abs(g - b) < 10:
            px[x, y] = (r, g, b, 0)
        elif m >= 210:
            # antialiased edge: fade proportionally
            alpha = int(255 * (246 - m) / 36)
            px[x, y] = (r, g, b, max(0, min(255, alpha)))
logo.save(f"{OUT}/threethai-logo.png", optimize=True)
print("logo:", logo.size, os.path.getsize(f'{OUT}/threethai-logo.png'), "bytes")

# 2x padding variant not needed (340x90 covers h-10 display at 5x density)

# ---- 2. Hero banner: JPG q88 ----
hero = Image.open(f"{UP}/download.png").convert("RGB")
hero.save(f"{OUT}/threethai-hero.jpg", quality=88, optimize=True, progressive=True)
print("hero:", hero.size, os.path.getsize(f"{OUT}/threethai-hero.jpg"), "bytes")

# ---- 3. Square favicon source from hero? No — derive from logo mark (left icon area is text; skip) ----
print("done")
