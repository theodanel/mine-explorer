"""Transforme la vidéo de l'aura sombre (fond vert) en atlas d'animation en boucle pour le jeu.

Usage :
    python decouper-aura.py <video.mp4> <nom> <dossier de sortie>

- Cherche dans la vidéo le passage qui boucle le mieux (première et dernière image les plus proches), entre
  MIN_LOOP_S et MAX_LOOP_S secondes, puis en garde une image sur deux (12 i/s).
- Écrit <nom>.webp (grille de COLUMNS colonnes) et <nom>.json (atlas TexturePacker, animation « aura »).

Dépendances : ffmpeg dans le PATH, Pillow, numpy.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

VIDEO_FPS = 24
STEP = 2
FRAME_DURATION_MS = 83
MIN_LOOP_S = 2
MAX_LOOP_S = 4
COLUMNS = 8
# Hauteur de l'aura dans l'atlas (pixels) ; le jeu la met à l'échelle selon les étoiles
ATLAS_HEIGHT = 420
MARGIN = 6
# Détourage : un pixel est du fond quand le vert dépasse nettement le rouge et le bleu
GREEN_FULL = 60
GREEN_EDGE = 25
# Une colonne ou une rangée compte dans le cadre à partir de ce nombre de pixels opaques
SOLID_PIXELS = 4
# Recherche de boucle sur des images réduites, pour aller vite
COMPARE_WIDTH = 160


def key_green(image: Image.Image) -> Image.Image:
    """Rend le fond vert transparent, avec un bord adouci et le reflet vert retiré des contours."""
    rgb = np.asarray(image.convert("RGB")).astype(np.int16)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    greenness = g - np.maximum(r, b)
    alpha = np.clip((GREEN_FULL - greenness) * 255 / (GREEN_FULL - GREEN_EDGE), 0, 255)
    # Le vert qui reste sur les bords est ramené au niveau du rouge ou du bleu
    g = np.where(greenness > 0, np.maximum(r, b), g)
    rgba = np.stack([r, g, b, alpha], axis=-1).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def solid_box(frame: Image.Image) -> tuple[int, int, int, int]:
    """Boîte des colonnes et rangées assez remplies : une étincelle égarée loin de l'anneau n'agrandit pas le cadre."""
    opaque = np.asarray(frame.getchannel("A")) > 16
    columns = np.flatnonzero(opaque.sum(axis=0) >= SOLID_PIXELS)
    rows = np.flatnonzero(opaque.sum(axis=1) >= SOLID_PIXELS)
    return int(columns[0]), int(rows[0]), int(columns[-1]) + 1, int(rows[-1]) + 1


def best_loop(paths: list[Path]) -> tuple[int, int]:
    """Indices (début, fin exclue) du passage dont la fin ressemble le plus au début."""
    small = []
    for path in paths:
        image = Image.open(path).convert("L")
        height = round(image.height * COMPARE_WIDTH / image.width)
        small.append(np.asarray(image.resize((COMPARE_WIDTH, height))).astype(np.float32))
    best = (float("inf"), 0, 0)
    for start in range(len(small)):
        for length in range(MIN_LOOP_S * VIDEO_FPS, MAX_LOOP_S * VIDEO_FPS + 1, STEP):
            end = start + length
            if end >= len(small):
                break
            difference = float(np.mean(np.abs(small[start] - small[end])))
            if difference < best[0]:
                best = (difference, start, end)
    print(f"boucle : images {best[1] + 1} à {best[2]} (écart moyen {best[0]:.2f})")
    return best[1], best[2]


def main() -> None:
    # La console Windows n'est pas en UTF-8 par défaut : les messages contiennent des accents
    sys.stdout.reconfigure(encoding="utf-8")
    video, name, out = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
    with tempfile.TemporaryDirectory() as tmp:
        folder = Path(tmp)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video), str(folder / "f%04d.png")], check=True)
        paths = sorted(folder.glob("f*.png"))
        start, end = best_loop(paths)
        frames = [key_green(Image.open(path)) for path in paths[start:end:STEP]]

    # Cadre commun à toutes les images, pour que l'aura ne saute pas d'une image à l'autre. Il est centré sur
    # l'anneau (centre de masse de l'opacité), pas sur la boîte englobante qu'une étincelle isolée décentre :
    # le jeu place le milieu du cadre derrière le mineur
    boxes = [solid_box(frame) for frame in frames]
    alpha = np.asarray(frames[0].getchannel("A")).astype(np.float64)
    center = float((alpha.sum(axis=0) * np.arange(alpha.shape[1])).sum() / alpha.sum())
    half_width = max(max(center - box[0], box[2] - center) for box in boxes) + MARGIN
    left = max(round(center - half_width), 0)
    right = round(center + half_width)
    top = max(min(box[1] for box in boxes) - MARGIN, 0)
    bottom = max(box[3] for box in boxes) + MARGIN
    frames = [frame.crop((left, top, right, bottom)) for frame in frames]
    resize = ATLAS_HEIGHT / frames[0].height
    width, height = round(frames[0].width * resize), ATLAS_HEIGHT
    frames = [frame.resize((width, height), Image.LANCZOS) for frame in frames]

    rows = (len(frames) + COLUMNS - 1) // COLUMNS
    sheet = Image.new("RGBA", (width * COLUMNS, height * rows), (0, 0, 0, 0))
    atlas_frames = {}
    for index, frame in enumerate(frames):
        x, y = (index % COLUMNS) * width, (index // COLUMNS) * height
        sheet.paste(frame, (x, y))
        atlas_frames[f"{name}_{index:04d}"] = {
            "frame": {"x": x, "y": y, "w": width, "h": height},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": width, "h": height},
            "sourceSize": {"w": width, "h": height},
            "duration": FRAME_DURATION_MS,
        }
    out.mkdir(parents=True, exist_ok=True)
    sheet.save(out / f"{name}.webp", "WEBP", quality=88, method=6)
    atlas = {
        "frames": atlas_frames,
        "animations": {"aura": list(atlas_frames)},
        "meta": {
            "app": "art-source/animations/decouper-aura.py (ffmpeg + Pillow)",
            "version": "1.0",
            "image": f"{name}.webp",
            "format": "RGBA8888",
            "size": {"w": sheet.width, "h": sheet.height},
            "scale": "1",
        },
    }
    (out / f"{name}.json").write_text(json.dumps(atlas, indent=1), encoding="utf-8")
    print(f"{len(frames)} images {width}x{height}, atlas {sheet.width}x{sheet.height}")


if __name__ == "__main__":
    main()
