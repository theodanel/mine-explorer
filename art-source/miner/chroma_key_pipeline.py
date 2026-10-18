"""Chroma key + crop + resize + pack. Usage: key.py <raw_dir> <out_dir> <t_opaque> <t_clear>"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

RAW, OUT = Path(sys.argv[1]), Path(sys.argv[2])
T_OPAQUE, T_CLEAR = float(sys.argv[3]), float(sys.argv[4])
TARGET_W = 512
PAD = 8          # margin around the union bounding box, in source pixels
SPACING = 2      # gap between frames in the sheet (avoids texture bleeding)
COLS = 6
NAME = "pickaxe_swing"
FPS = 12


def key(rgb: np.ndarray) -> np.ndarray:
    f = rgb.astype(np.float32)
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    excess = g - np.maximum(r, b)
    alpha = 1.0 - np.clip((excess - T_OPAQUE) / (T_CLEAR - T_OPAQUE), 0, 1)
    # Despill: clamp green to max(R,B) so edges and motion blur lose the green tint.
    g2 = np.minimum(g, np.maximum(r, b))
    out = np.dstack([r, g2, b, alpha * 255]).round().clip(0, 255).astype(np.uint8)
    out[alpha == 0, :3] = 0
    return out


frames = [key(np.asarray(Image.open(p).convert("RGB"))) for p in sorted(RAW.glob("*.png"))]

# Union bbox over all frames keeps the character anchored at the same place in every frame.
mask = np.any(np.stack([f[..., 3] > 8 for f in frames]), axis=0)
ys, xs = np.nonzero(mask)
h_src, w_src = mask.shape
x0, x1 = max(xs.min() - PAD, 0), min(xs.max() + PAD + 1, w_src)
y0, y1 = max(ys.min() - PAD, 0), min(ys.max() + PAD + 1, h_src)
scale = TARGET_W / (x1 - x0)
fw, fh = TARGET_W, round((y1 - y0) * scale)

# Resize in premultiplied space so transparent black pixels don't darken edges.
def resize(rgba: np.ndarray) -> Image.Image:
    return Image.fromarray(rgba, "RGBA").convert("RGBa").resize((fw, fh), Image.LANCZOS).convert("RGBA")

small = [resize(f[y0:y1, x0:x1]) for f in frames]
OUT.mkdir(parents=True, exist_ok=True)
for i, im in enumerate(small):
    im.save(OUT / f"frame_{i:04d}.png")

rows = -(-len(small) // COLS)
sheet_w, sheet_h = COLS * fw + (COLS - 1) * SPACING, rows * fh + (rows - 1) * SPACING
sheet = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))
atlas_frames = {}
for i, im in enumerate(small):
    x, y = (i % COLS) * (fw + SPACING), (i // COLS) * (fh + SPACING)
    sheet.paste(im, (x, y))
    atlas_frames[f"{NAME}_{i:04d}"] = {
        "frame": {"x": x, "y": y, "w": fw, "h": fh},
        "rotated": False,
        "trimmed": False,
        "spriteSourceSize": {"x": 0, "y": 0, "w": fw, "h": fh},
        "sourceSize": {"w": fw, "h": fh},
        "duration": round(1000 / FPS),
    }
# WebP : 4,6 Mo en PNG, 0,6 Mo en WebP pour la même netteté à l'écran
image_name = f"spritesheet_{NAME}_v2.webp"
atlas = {
    "frames": atlas_frames,
    "animations": {NAME: list(atlas_frames)},
    "meta": {
        "app": "custom chroma-key pipeline (ffmpeg + Pillow)",
        "version": "1.0",
        "image": image_name,
        "format": "RGBA8888",
        "size": {"w": sheet_w, "h": sheet_h},
        "scale": "1",
        "frameTags": [{"name": NAME, "from": 0, "to": len(small) - 1, "direction": "forward"}],
    },
}
sheet.save(OUT / image_name, "WEBP", quality=90, method=6)
(OUT / f"atlas_{NAME}_v2.json").write_text(json.dumps(atlas, indent=2), encoding="utf-8")
print(f"crop=({x0},{y0})-({x1},{y1}) frame={fw}x{fh} n={len(small)} sheet={sheet_w}x{sheet_h}")
