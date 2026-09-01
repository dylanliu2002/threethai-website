#!/usr/bin/env python3
"""Generate OG share image (1200x630 from hero) + square favicon set from logo.

Outputs (all overwrite existing public/ assets):
  public/og.jpg                 1200x630 crop of the hero banner (<300KB)
  public/favicon.svg            SVG wrapper embedding the 256px badge PNG
  public/favicon.ico            16/32/48 multi-size
  public/apple-touch-icon.png   180x180 full-bleed (iOS applies its own mask)
"""

import base64
import io
from PIL import Image
import os

ROOT = "/home/z/my-project/public"
HERO = f"{ROOT}/images/generated/hero-pva-spinning.jpg"
LOGO = f"{ROOT}/images/brand/threethai-logo.png"
NAVY = (26, 33, 81, 255)  # brand #1a2151

def crop_og() -> None:
    hero = Image.open(HERO).convert("RGB")
    w, h = hero.size
    target_ar = 1200 / 630
    crop_w = int(h * target_ar)
    if crop_w <= w:
        x0 = (w - crop_w) // 2  # center crop keeps cone + ring frames
        box = (x0, 0, x0 + crop_w, h)
    else:
        crop_h = int(w / target_ar)
        y0 = (h - crop_h) // 2
        box = (0, y0, w, y0 + crop_h)
    og = hero.crop(box).resize((1200, 630), Image.LANCZOS)
    out = f"{ROOT}/og.jpg"
    og.save(out, "JPEG", quality=85, optimize=True, progressive=True)
    print(f"og.jpg: {og.size}, {os.path.getsize(out) // 1024}KB")

def emblem_image() -> Image.Image:
    logo = Image.open(LOGO).convert("RGBA")
    w, h = logo.size
    # Split emblem from wordmark at the first wide fully-transparent column gap
    # in the right half (column projection of the alpha channel).
    alpha = logo.split()[3]
    # Per-column mean alpha via 1px-high BOX downscale (robust across PIL versions)
    col_means = list(alpha.resize((w, 1), Image.BOX).getdata())
    has_content = [m > 2 for m in col_means]
    gap_start = None
    run = 0
    for x in range(int(w * 0.35), w):
        if not has_content[x]:
            if run == 0:
                gap_start = x
            run += 1
            if run >= 4 and gap_start is not None:
                break
        else:
            gap_start, run = None, 0
    split = gap_start if gap_start else int(w * 0.5)
    left = logo.crop((0, 0, split, h))
    emblem = left.crop(left.getbbox())  # non-transparent bounds

    # Drop the isolated (R) mark: label connected components on the alpha grid;
    # remove any component living entirely in the top-right quadrant.
    W, H = emblem.size
    thr = 16
    alpha_ch = emblem.split()[3]
    px = alpha_ch.load()
    seen = [[False] * W for _ in range(H)]
    for y0 in range(H):
        for x0 in range(W):
            if px[x0, y0] <= thr or seen[y0][x0]:
                continue
            stack = [(x0, y0)]
            seen[y0][x0] = True
            comp = []
            while stack:
                x, y = stack.pop()
                comp.append((x, y))
                for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
                    if 0 <= nx < W and 0 <= ny < H and not seen[ny][nx] and px[nx, ny] > thr:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            xs = [c[0] for c in comp]
            ys = [c[1] for c in comp]
            if min(xs) > W * 0.72 and max(ys) < H * 0.55 and len(comp) < W * H * 0.02:
                for (x, y) in comp:
                    px[x, y] = 0
    emblem.putalpha(alpha_ch)
    emblem = emblem.crop(emblem.getbbox())
    return emblem

def rounded_badge(size: int, radius: int, emblem: Image.Image, pad_ratio: float = 0.10) -> Image.Image:
    badge = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    from PIL import ImageDraw

    d = ImageDraw.Draw(badge)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=(255, 255, 255, 255))
    inner = int(size * (1 - 2 * pad_ratio))
    scale = min(inner / emblem.width, inner / emblem.height)
    em = emblem.resize((max(1, int(emblem.width * scale)), max(1, int(emblem.height * scale))), Image.LANCZOS)
    badge.alpha_composite(em, ((size - em.width) // 2, (size - em.height) // 2))
    return badge

def full_bleed(size: int, emblem: Image.Image, pad_ratio: float = 0.12) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    inner = int(size * (1 - 2 * pad_ratio))
    scale = min(inner / emblem.width, inner / emblem.height)
    em = emblem.resize((max(1, int(emblem.width * scale)), max(1, int(emblem.height * scale))), Image.LANCZOS)
    canvas.alpha_composite(em, ((size - em.width) // 2, (size - em.height) // 2))
    return canvas

def favicons() -> None:
    em = emblem_image()
    print(f"emblem bbox size: {em.size}")

    master = rounded_badge(512, 96, em)          # rounded master
    master.resize((256, 256), Image.LANCZOS).save(f"{ROOT}/favicon-256.png")
    master.resize((48, 48), Image.LANCZOS).save(f"{ROOT}/favicon-48.tmp.png")

    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    imgs = [rounded_badge(s, max(2, s // 5), em) for s in (16, 32, 48)]
    imgs[-1].save(f"{ROOT}/favicon.ico", format="ICO", sizes=ico_sizes)

    full_bleed(180, em).convert("RGB").save(f"{ROOT}/apple-touch-icon.png", "PNG", optimize=True)

    b64 = base64.b64encode(open(f"{ROOT}/favicon-256.png", "rb").read()).decode()
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">'
        f'<image width="256" height="256" href="data:image/png;base64,{b64}"/>'
        "</svg>"
    )
    with open(f"{ROOT}/favicon.svg", "w") as f:
        f.write(svg)
    os.remove(f"{ROOT}/favicon-48.tmp.png")
    print("favicon.ico / favicon.svg / apple-touch-icon.png written")

crop_og()
favicons()
