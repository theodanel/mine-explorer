"""Transforme une vidéo de marche sur place, sur fond vert, en atlas d'animation pour le héros qui avance.

Usage :
    python decouper-marche.py <video.mp4> <première image> <images par cycle> <nom> <dossier de sortie>
                              [--zone x0,y0,x1,y1] [--zoom]

- <première image> : numéro (à partir de 1) d'une image où le cycle de pas commence.
- <images par cycle> : longueur d'un cycle complet de la vidéo (deux pas), en images à 24 i/s. Le script affiche
  l'écart entre l'image de départ et celle d'un cycle plus loin : proche de 0, la boucle ne saute pas.
- Garde une image sur deux (12 i/s, comme les frappes), découpe toutes les images dans un même cadre pour que le
  personnage ne glisse pas, et le centre sur ses pieds.
- --zone : ne garde que ce rectangle de la vidéo (en pixels), pour écarter un filigrane ou un logo.
- --zoom : la caméra de la vidéo avance ou recule (le personnage grossit). Chaque image est alors ramenée à la même
  taille et posée sur les mêmes pieds, d'après une droite ajustée sur toute la boucle (une jambe levée ne fait pas
  sauter la taille d'une image à l'autre).
- Écrit <nom>.webp (grille de 6 colonnes) et <nom>.json (atlas TexturePacker, animation « walk »).

Dépendances : ffmpeg dans le PATH, Pillow, et decouper-frappe.py dans le même dossier (détourage du vert).
"""
import argparse
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


def fitted(values: list[float]) -> list[float]:
    """Droite des moindres carrés passant au mieux par les valeurs, une par image."""
    count = len(values)
    mean_x, mean_y = (count - 1) / 2, sum(values) / count
    spread = sum((x - mean_x) ** 2 for x in range(count)) or 1
    slope = sum((x - mean_x) * (y - mean_y) for x, y in enumerate(values)) / spread
    return [mean_y + slope * (x - mean_x) for x in range(count)]


def cancel_zoom(frames: list[Image.Image]) -> list[Image.Image]:
    """Ramène chaque image à la même taille de corps, pieds au même endroit, malgré une caméra qui zoome."""
    boxes = [frame.getchannel("A").point(lambda a: 255 if a > 128 else 0).getbbox() for frame in frames]
    heights = fitted([b[3] - b[1] for b in boxes])
    bottoms = fitted([b[3] for b in boxes])
    axes = fitted([feet_center(frame) for frame in frames])
    reference = heights[0]
    width, height = frames[0].size
    steady = []
    for frame, body, bottom, axis in zip(frames, heights, bottoms, axes):
        scale = reference / body
        resized = frame.resize((round(frame.width * scale), round(frame.height * scale)), Image.LANCZOS)
        canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        # Pieds de chaque image posés sur ceux de la première
        canvas.alpha_composite(resized, (round(axes[0] - axis * scale), round(bottoms[0] - bottom * scale)))
        steady.append(canvas)
    return steady


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Découpe une boucle de marche sur fond vert en atlas.")
    parser.add_argument("video", type=Path)
    parser.add_argument("first", type=int)
    parser.add_argument("cycle", type=int)
    parser.add_argument("name")
    parser.add_argument("out", type=Path)
    parser.add_argument("--zone", help="x0,y0,x1,y1 : rectangle gardé, pour écarter un filigrane")
    parser.add_argument("--zoom", action="store_true", help="la caméra zoome : chaque image est ramenée à la même taille")
    args = parser.parse_args()
    video, first, cycle, name, out = args.video, args.first, args.cycle, args.name, args.out
    zone = tuple(int(value) for value in args.zone.split(",")) if args.zone else None
    key_green = load_key_green()
    numbers = list(range(first, first + cycle, STEP))

    def read(folder: Path, number: int) -> Image.Image:
        image = Image.open(folder / f"f{number:04d}.png")
        return image.crop(zone) if zone else image

    with tempfile.TemporaryDirectory() as tmp:
        folder = Path(tmp)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video), str(folder / "f%04d.png")], check=True)
        print(f"écart de boucle (image {first} contre {first + cycle}) : {loop_gap(read(folder, first), read(folder, first + cycle)):.2f}")
        frames = [key_green(read(folder, n)) for n in numbers]
    if args.zoom:
        frames = cancel_zoom(frames)

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
