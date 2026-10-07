"""Prepares the raw iPhone screenshots for framing (run from this folder).

1. In the board shared by green.jpg and dumped.jpg, swaps the R in TRUMP for an
   H (THUMP), so the store images don't lead with a political name. The H is
   the real glyph from the HALT tile in hero.jpg, scaled to the same cap height
   and recoloured to match each tile. THUMP is in the ENABLE list and the R's
   column has no other tiles, so the board stays valid.
2. Crops the status bar off every shot (times and battery levels differ).

    python3 prepare.py      # writes work/*.png
"""
import sys
import numpy as np
from PIL import Image

K = 1170 / 924  # display coords (as viewed) -> pixels

def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(float)

def glyph_box(a, cx, cy, half, is_letter):
    y0, x0 = int(cy - half), int(cx - half)
    sub = a[y0:y0 + 2 * half, x0:x0 + 2 * half]
    m = is_letter(sub)
    # Ignore stray anti-aliased pixels (e.g. a tile corner): need 3+ per row/column.
    ys = np.nonzero(m.sum(axis=1) >= 3)[0]
    xs = np.nonzero(m.sum(axis=0) >= 3)[0]
    return x0 + xs.min(), y0 + ys.min(), x0 + xs.max(), y0 + ys.max()

def tile_span(a, y, x, fill):
    """Left/right edge of the tile containing (x, y), walking while the fill colour holds."""
    def same(px): return np.abs(px - fill).max() < 30
    l = x
    while l > 0 and (same(a[y, l - 1]) or not same(a[y, l - 6])): l -= 1
    r = x
    while r < a.shape[1] - 1 and (same(a[y, r + 1]) or not same(a[y, r + 6])): r += 1
    return l, r

# The H glyph, as an alpha mask, from the HALT tile in the hero shot.
hero = load('raw/hero.jpg')
hx, hy = 686 * K, 900 * K
brown = lambda s: (s[..., 0] < 160) & (s[..., 0] > s[..., 2] + 15)  # brown, not the navy board
bx0, by0, bx1, by1 = glyph_box(hero, hx, hy, 40, brown)
hsub = hero[by0 - 2:by1 + 3, bx0 - 2:bx1 + 3]
yellow = np.array([252, 225, 75.])
lum = lambda c: c[..., 0] * .299 + c[..., 1] * .587 + c[..., 2] * .114
dark = lum(hero[by0:by1, bx0:bx1]).min()
alpha_h = np.clip((lum(yellow) - lum(hsub)) / (lum(yellow) - dark), 0, 1)
cap_h = by1 - by0 + 1

def swap(src, dst, cx_disp, cy_disp, kind):
    a = load(src)
    cx, cy = cx_disp * K, cy_disp * K
    if kind == 'yellow':
        is_letter = brown
    else:
        is_letter = lambda s: s.min(axis=-1) > 200
    x0, y0, x1, y1 = glyph_box(a, cx, cy, 40, is_letter)
    # Tile fill, sampled just left of the glyph on its middle row.
    ym = (y0 + y1) // 2
    fill = a[ym, x0 - 10].copy()
    letter_col = a[y0:y1, x0:x1][is_letter(a[y0:y1, x0:x1])]
    # Typical colour of the letter's solid core, not its anti-aliased edges.
    l_lum = letter_col @ np.array([.299, .587, .114])
    core = l_lum <= np.percentile(l_lum, 40) if kind == 'yellow' else l_lum >= np.percentile(l_lum, 60)
    letter_col = np.median(letter_col[core], axis=0)
    # Erase the R row by row with the fill colour beside it (tiles are flat).
    for y in range(y0 - 4, y1 + 5):
        a[y, x0 - 4:x1 + 5] = a[y, x0 - 10]
    # Scale H to the R's cap height and centre it on the tile.
    s = (y1 - y0 + 1) / cap_h
    h_img = Image.fromarray((alpha_h * 255).astype(np.uint8)).resize(
        (round(alpha_h.shape[1] * s), round(alpha_h.shape[0] * s)), Image.LANCZOS)
    al = np.asarray(h_img).astype(float)[..., None] / 255
    l, r = tile_span(a, ym, int(cx), fill)
    tcx = (l + r) / 2
    py = int(round(y0 - 2 * s))
    px = int(round(tcx - al.shape[1] / 2))
    region = a[py:py + al.shape[0], px:px + al.shape[1]]
    a[py:py + al.shape[0], px:px + al.shape[1]] = region * (1 - al) + letter_col * al
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(dst)
    print(dst, 'R box', (x0, y0, x1, y1), 'tile', (l, r), 'scale', round(s, 3))

import os
os.makedirs('work', exist_ok=True)
swap('raw/green.jpg', 'work/green.png', 337, 596, 'green')
swap('raw/dumped.jpg', 'work/dumped.png', 337, 596, 'yellow')
for name in ['hero', 'home']:
    Image.open(f'raw/{name}.jpg').save(f'work/{name}.png')

STATUS_BAR = 140  # px at 1170 wide; the app's content starts below it
for name in ['hero', 'home', 'green', 'dumped']:
    im = Image.open(f'work/{name}.png').convert('RGB')
    im.crop((0, STATUS_BAR, im.width, im.height)).save(f'work/{name}.png')
