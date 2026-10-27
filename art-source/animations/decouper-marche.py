"""Transforme une vidéo de marche sur place, sur fond vert, en atlas d'animation pour la mine vue du dessus.

Usage :
    python decouper-marche.py <video.mp4> <première image> <images par cycle> <nom> <dossier de sortie>

- <première image> : numéro (à partir de 1) d'une image où le cycle de pas commence.
- <images par cycle> : longueur d'un cycle complet de la vidéo (deux pas), en images à 24 i/s. Le script affiche
  l'écart entre l'image de départ et celle d'un cycle plus loin : proche de 0, la boucle ne saute pas.
- Garde une image sur deux (12 i/s, comme les frappes), découpe toutes les images dans un même cadre pour que le
  personnage ne glisse pas, et le centre sur ses pieds.
- Écrit <nom>.webp (grille de 6 colonnes) et <nom>.json (atlas TexturePacker, animation « walk »).

Dépendances : ffmpeg dans le PATH, Pillow, et decouper-frappe.py dans le même dossier (détourage du vert).
"""
import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

STEP = 2
COLUMNS = 6
FRAME_DURATION_MS = 83
# Même hauteur de corps que les atlas de frappe : le jeu règle ensuite la taille à l'écran
ATLAS_BODY_HEIGHT = 360
MARGIN = 8
# Les pieds occupent le bas du personnage : leur centre donne l'axe du corps, la queue et la pioche le faussent
FEET_SHARE = 0.15


def load_key_green():
    """Réutilise le détourage des frappes, pour un bord identique."""
    spec = importlib.util.spec_from_file_location("decouper_frappe", Path(__file__).with_name("decouper-frappe.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.key_green


def loop_gap(first: Image.Image, last: Image.Image) -> float:
    """Écart moyen entre deux images (0 à 255) : petit quand la boucle se referme bien."""
    small = (160, 90)
    difference = ImageChops.difference(first.convert("L").resize(small), last.convert("L").resize(small))
    return ImageStat.Stat(difference).mean[0]


def feet_center(frame: Image.Image) -> float:
    alpha = frame.getchannel("A").point(lambda a: 255 if a > 128 else 0)
    box = alpha.getbbox()
    feet_top = box[3] - round((box[3] - box[1]) * FEET_SHARE)
    feet = alpha.crop((0, feet_top, frame.width, box[3])).getbbox()
    return (feet[0] + feet[2]) / 2


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    video, first, cycle, name, out = Path(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], Path(sys.argv[5])
    key_green = load_key_green()
    numbers = list(range(first, first + cycle, STEP))
    with tempfile.TemporaryDirectory() as tmp:
        folder = Path(tmp)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video), str(folder / "f%04d.png")], check=True)
        print(f"écart de boucle (image {first} contre {first + cycle}) : {loop_gap(Image.open(folder / f'f{first:04d}.png'), Image.open(folder / f'f{first + cycle:04d}.png')):.2f}")
        frames = [key_green(Image.open(folder / f"f{n:04d}.png")) for n in numbers]

    boxes = [frame.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox() for frame in frames]
    top = max(min(b[1] for b in boxes) - MARGIN, 0)
    bottom = max(b[3] for b in boxes)
    # Cadre symétrique autour de l'axe moyen des pieds : l'ancre bas-centre du jeu tombe entre les pieds
    axis = sum(feet_center(frame) for frame in frames) / len(frames)
    half = max(max(axis - b[0], b[2] - axis) for b in boxes) + MARGIN
    frames = [frame.crop((round(axis - half), top, round(axis + half), bottom)) for frame in frames]

    body_height = max(frame.height - frame.getchannel("A").point(lambda a: 255 if a > 128 else 0).getbbox()[1] for frame in frames)
    resize = ATLAS_BODY_HEIGHT / body_height
    width, height = round(frames[0].width * resize), round(frames[0].height * resize)
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
        "animations": {"walk": list(atlas_frames)},
        "meta": {
            "app": "art-source/animations/decouper-marche.py (ffmpeg + Pillow)",
            "version": "1.0",
            "image": f"{name}.webp",
            "format": "RGBA8888",
            "size": {"w": sheet.width, "h": sheet.height},
            "scale": "1",
        },
    }
    (out / f"{name}.json").write_text(json.dumps(atlas, indent=1), encoding="utf-8")
    print(f"{len(frames)} images de {width}x{height}, atlas {sheet.width}x{sheet.height}, corps de {ATLAS_BODY_HEIGHT} px")


if __name__ == "__main__":
    main()
