#!/usr/bin/env python3
"""
Post-process a generated hero into the final brand banner:
1. Deep-navy color grading toward brand ink navy #1A2151 — strongest in
   shadows/mids, highlights (white yarn) stay near-neutral.
2. Left-edge darkening gradient (headline zone) + bottom gradient.
3. Subtle vignette; slight contrast lift.
4. Export optimized progressive JPG.

Usage: python3 postprocess-hero.py [a|b]
  a -> hero-pva-spinning-a.png   b -> hero-pva-spinning-b.png
Output: public/images/generated/hero-pva-spinning.jpg
"""
import sys
import numpy as np
from PIL import Image, ImageEnhance

VARIANT = sys.argv[1] if len(sys.argv) > 1 else "a"
SRC = f"/home/z/my-project/public/images/generated/hero-pva-spinning-{VARIANT}.png"
DST = "/home/z/my-project/public/images/generated/hero-pva-spinning.jpg"

NAVY = np.array([26, 33, 81], dtype=np.float64)  # brand ink navy #1A2151

img = Image.open(SRC).convert("RGB")
w, h = img.size
arr = np.asarray(img).astype(np.float64)

# --- 1. Shadow-weighted navy grading -------------------------------------
lum = arr @ np.array([0.2126, 0.7152, 0.0722]) / 255.0
# weight: 1.0 in deep shadows -> 0.12 in highlights (white yarn stays white)
shadow_w = (1.0 - lum) ** 1.45 * 0.72
# luminance-preserving tint: shift each pixel toward a navy of same brightness
scale = (lum[..., None] * 255.0 * 1.04) / (NAVY.max() + 1e-6)
navy_layer = np.clip(NAVY[None, None, :] * np.clip(scale, 0, 2.4), 0, 255)
arr = arr * (1 - shadow_w[..., None]) + navy_layer * shadow_w[..., None]

# --- 2. Left darkening (text zone) + bottom gradient (spec bar) -----------
x = np.linspace(0.0, 1.0, w)[None, :]          # 0 left -> 1 right
left_dark = (1.0 - np.clip(x / 0.62, 0, 1)) ** 1.15 * 0.52   # up to -52% at far left
y = np.linspace(0.0, 1.0, h)[:, None]
bottom_dark = (np.clip((y - 0.72) / 0.28, 0, 1)) ** 1.5 * 0.38
arr *= (1.0 - left_dark)[..., None] * (1.0 - bottom_dark)[..., None]

# --- 3. Vignette ----------------------------------------------------------
cx, cy = (x - 0.62), (y - 0.45)
r = np.sqrt((cx * 1.0) ** 2 + (cy * 0.8) ** 2)
vign = 1.0 - np.clip((r - 0.55) / 0.75, 0, 1) * 0.22
arr *= vign[..., None]

arr = np.clip(arr, 0, 255).astype(np.uint8)
out = Image.fromarray(arr)
out = ImageEnhance.Contrast(out).enhance(1.06)
out = ImageEnhance.Color(out).enhance(1.05)

out.save(DST, "JPEG", quality=86, optimize=True, progressive=True)
import os
print("saved:", DST, out.size, os.path.getsize(DST), "bytes")
