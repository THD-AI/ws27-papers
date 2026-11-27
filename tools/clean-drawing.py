"""Clean a forge drawing for the big screen, as the Renovate drawings were cleaned
(articles/renovate/art/SOURCES.md): the faint haze away from the strokes removed,
the strokes set to solid ink, and the image doubled so the edges hold at 4K.

  python tools/clean-drawing.py <raw.png> <out.png> [--ink 2E2C27] [--scale 2] [--lo 28]

Steps: 1. upscale the alpha (Lanczos); 2. a level curve per stroke: each stroke
against its own darkest point nearby (a light stroke turns solid, not dashed);
areas whose darkest point is under LO are haze; 3. keep
only what lies within REACH pixels of solid ink (drops the smudges between
strokes); 4. drop solid specks smaller than SPECK pixels; 5. one ink colour.
The output carries no metadata: IHDR, IDAT, IEND only.
"""
import argparse
import numpy as np
from PIL import Image
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--ink', default='2E2C27')
ap.add_argument('--scale', type=int, default=2)
ap.add_argument('--lo', type=float, default=28)
args = ap.parse_args()

im = Image.open(args.src).convert('RGBA')
w, h = im.size
s = args.scale
alpha = im.getchannel('A').resize((w * s, h * s), Image.LANCZOS)
a = np.asarray(alpha, dtype=np.float32)

# 2. levels, per stroke: each stroke is measured against its own darkest point
# nearby, so a stroke the model drew lighter becomes solid too instead of breaking
# into dashes. Areas whose darkest point is below FLOOR are haze and go.
peak = ndimage.maximum_filter(a, size=4 * s + 1)
a = np.where(peak < args.lo, 0, a)
a = np.clip((a / np.maximum(peak * 0.8, 1) - 0.3) / 0.45, 0, 1)

# 3. only what is near solid ink survives
core = a >= 0.98
REACH = 2 * s
near = ndimage.binary_dilation(core, iterations=REACH)
a[~near] = 0

# 4. lone specks of ink are dust, not drawing
lab, k = ndimage.label(a > 0.5)
if k:
    size = ndimage.sum(np.ones_like(a), lab, index=np.arange(1, k + 1))
    SPECK = 12 * s * s
    small = np.zeros(k + 1, bool); small[1:] = size < SPECK
    a[small[lab]] = 0

ink = tuple(int(args.ink[i:i + 2], 16) for i in (0, 2, 4))
out = np.zeros((h * s, w * s, 4), np.uint8)
out[..., 0], out[..., 1], out[..., 2] = ink
out[..., 3] = np.round(a * 255).astype(np.uint8)
Image.fromarray(out).save(args.out, optimize=True)
print(f'{args.out}: {w * s}x{h * s}, solid {float((a >= 0.98).mean()):.4f}, any {float((a > 0).mean()):.4f}')
