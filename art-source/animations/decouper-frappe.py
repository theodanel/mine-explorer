"""Transforme une vidéo de frappe sur fond vert en atlas d'animation pour le jeu.

Usage :
    python decouper-frappe.py <video.mp4> <image d'impact> <nom> <dossier de sortie>

- <image d'impact> : numéro (à partir de 1) de l'image de la vidéo où la pioche touche le sol.
- Le jeu attend 23 images avec l'impact sur la 11e (index 10), à 12 i/s : on prend une image sur deux
  d'une vidéo à 24 i/s, de l'impact − 20 à l'impact + 24.
- Écrit <nom>.webp (grille 5 × 5) et <nom>.json (atlas TexturePacker, animation « pickaxe_swing »),
  plus deux images quadrillées (repos et impact) pour mesurer les réglages StrikeAnimation de game-assets.ts.

Dépendances : ffmpeg dans le PATH, Pillow.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

FRAME_COUNT = 23
IMPACT_INDEX = 10
STEP = 2
COLUMNS = 5
FRAME_DURATION_MS = 83
# Hauteur visée du personnage dans l'atlas, puis à l'écran (pixels de scène 720 × 1280)
ATLAS_BODY_HEIGHT = 360
SCREEN_BODY_HEIGHT = 300
MARGIN = 8
GRID_STEP = 50
# Détourage : un pixel est du fond quand le vert dépasse nettement le rouge et le bleu
GREEN_FULL = 60
GREEN_EDGE = 25


def key_green(image: Image.Image) -> Image.Image:
    """Rend le fond vert transparent, avec un bord adouci et le reflet vert retiré des contours."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, _ = pixels[x, y]
            greenness = g - max(r, b)
            if greenness >= GREEN_FULL:
                pixels[x, y] = (0, 0, 0, 0)
            elif greenness > GREEN_EDGE:
                alpha = round(255 * (GREEN_FULL - greenness) / (GREEN_FULL - GREEN_EDGE))
                pixels[x, y] = (r, max(r, b), b, alpha)
    return rgba


def extract(video: Path, first: int, folder: Path) -> list[Image.Image]:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video), str(folder / "f%04d.png")], check=True)
    numbers = [first + i * STEP for i in range(FRAME_COUNT)]
    return [key_green(Image.open(folder / f"f{n:04d}.png")) for n in numbers]


def main() -> None:
    video, impact, name, out = Path(sys.argv[1]), int(sys.argv[2]), sys.argv[3], Path(sys.argv[4])
    first = impact - IMPACT_INDEX * STEP
    if first < 1:
        sys.exit(f"Impact trop tôt : il faut {IMPACT_INDEX * STEP} images avant lui")
    with tempfile.TemporaryDirectory() as tmp:
        frames = extract(video, first, Path(tmp))

    # Cadre commun à toutes les images, pour que le personnage ne saute pas d'une image à l'autre
    boxes = [frame.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox() for frame in frames]
    left = max(min(b[0] for b in boxes) - MARGIN, 0)
    top = max(min(b[1] for b in boxes) - MARGIN, 0)
    right = max(b[2] for b in boxes) + MARGIN
    bottom = max(b[3] for b in boxes)
    frames = [frame.crop((left, top, right, bottom)) for frame in frames]

    # Taille du corps mesurée sur la première image (au repos) : du haut du casque aux pieds
    rest_box = frames[0].getchannel("A").point(lambda a: 255 if a > 128 else 0).getbbox()
    body_height = frames[0].height - rest_box[1]
    resize = ATLAS_BODY_HEIGHT / body_height
    width, height = round(frames[0].width * resize), round(frames[0].height * resize)
    frames = [frame.resize((width, height), Image.LANCZOS) for frame in frames]

    rows = (FRAME_COUNT + COLUMNS - 1) // COLUMNS
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
    sheet.save(out / f"{name}.webp", "WEBP", quality=90, method=6)
    atlas = {
        "frames": atlas_frames,
        "animations": {"pickaxe_swing": list(atlas_frames)},
        "meta": {
            "app": "art-source/animations/decouper-frappe.py (ffmpeg + Pillow)",
            "version": "1.0",
            "image": f"{name}.webp",
            "format": "RGBA8888",
            "size": {"w": sheet.width, "h": sheet.height},
            "scale": "1",
        },
    }
    (out / f"{name}.json").write_text(json.dumps(atlas, indent=1), encoding="utf-8")

    # Réglages de game-assets.ts : la mesure automatique se trompait (queue, étincelles), on mesure à l'œil
    # sur deux images quadrillées : le repos (centre du corps) et l'impact (point où la pioche touche le sol)
    for index in (0, IMPACT_INDEX):
        grid = Image.new("RGBA", (width, height), (60, 40, 25, 255))
        grid.alpha_composite(frames[index])
        draw = ImageDraw.Draw(grid)
        for x in range(0, width, GRID_STEP):
            draw.line([(x, 0), (x, height)], fill=(255, 255, 255, 90))
            draw.text((x + 2, 2), str(x), fill="white")
        for y in range(0, height, GRID_STEP):
            draw.line([(0, y), (width, y)], fill=(255, 255, 255, 90))
            draw.text((2, y + 2), str(y), fill="white")
        grid.convert("RGB").save(out / f"{name}-grille-{index}.png")
    print(f"atlas {sheet.width}x{sheet.height}, images {width}x{height}, scale {SCREEN_BODY_HEIGHT / ATLAS_BODY_HEIGHT:.2f}")
    print(f"bodyOffsetX = {width / 2:.0f} − x du centre du corps ; impactOffset = (x − {width / 2:.0f}, y − {height}) du point d'impact")
    print(f"Grilles écrites dans {out} : à supprimer après la mesure, elles ne vont pas dans le jeu")

if __name__ == "__main__":
    main()
