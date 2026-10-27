"""Prépare le sol et les décors d'une zone pour la mine vue du dessus.

Usage :
    python preparer-decors.py <zone>

- Sol : art-source/sols/zone<N>-sol.jpg. Gemini le rend souvent déjà répété en 2 × 2 : le script cherche la période
  de répétition et découpe exactement une période, qui raccorde alors sans couture. Sans répétition trouvée, il
  garde l'image entière (à vérifier à l'œil).
- Décors : chaque image de art-source/decors/zone<N>/ sur fond vert, détourée comme les frappes et recadrée.
- Écrit frontend/public/assets/floors/zone<N>.webp et frontend/public/assets/decors/zone<N>/<nom>.webp.

Dépendances : Pillow, numpy, et animations/decouper-frappe.py (détourage du vert).
"""
import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
FLOOR_SIZE = 512
DECOR_MAX_SIDE = 320
# Les images sont détourées à cette taille : le détourage pixel par pixel est lent sur du 2048
WORK_SIDE = 1024
# Une période est retenue quand l'image décalée d'elle-même diffère moins que ça (niveaux de gris, 0 à 255)
PERIOD_MAX_GAP = 6.0
QUALITY = 85


def load_key_green():
    path = ROOT / "art-source" / "animations" / "decouper-frappe.py"
    spec = importlib.util.spec_from_file_location("decouper_frappe", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.key_green


def repeat_period(gray: np.ndarray, axis: int) -> int | None:
    """Plus petite période de répétition le long d'un axe, au-delà d'un quart de l'image."""
    length = gray.shape[axis]
    gaps = []
    for period in range(length // 4, length - length // 4):
        if axis == 1:
            gap = np.abs(gray[:, period:] - gray[:, : length - period]).mean()
        else:
            gap = np.abs(gray[period:, :] - gray[: length - period, :]).mean()
        gaps.append((gap, period))
    gap, period = min(gaps)
    return period if gap < PERIOD_MAX_GAP else None


def prepare_floor(zone: int) -> None:
    source = Image.open(ROOT / "art-source" / "sols" / f"zone{zone}-sol.jpg").convert("RGB")
    gray = np.asarray(source.convert("L"), dtype=float)
    period_x, period_y = repeat_period(gray, 1), repeat_period(gray, 0)
    if period_x and period_y:
        # Une période prise au milieu : ses bords opposés sont les mêmes pixels, la tuile raccorde
        left, top = (source.width - period_x) // 2, (source.height - period_y) // 2
        source = source.crop((left, top, left + period_x, top + period_y))
        print(f"sol : période {period_x} x {period_y} découpée")
    else:
        print("sol : aucune répétition trouvée, image entière gardée (vérifie les raccords)")
    out = ROOT / "frontend" / "public" / "assets" / "floors"
    out.mkdir(parents=True, exist_ok=True)
    source.resize((FLOOR_SIZE, FLOOR_SIZE), Image.LANCZOS).save(out / f"zone{zone}.webp", "WEBP", quality=QUALITY, method=6)


def prepare_decors(zone: int) -> None:
    key_green = load_key_green()
    out = ROOT / "frontend" / "public" / "assets" / "decors" / f"zone{zone}"
    out.mkdir(parents=True, exist_ok=True)
    for path in sorted((ROOT / "art-source" / "decors" / f"zone{zone}").glob("*.jpg")):
        image = Image.open(path).convert("RGB")
        image.thumbnail((WORK_SIDE, WORK_SIDE), Image.LANCZOS)
        keyed = key_green(image)
        keyed = keyed.crop(keyed.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox())
        keyed.thumbnail((DECOR_MAX_SIDE, DECOR_MAX_SIDE), Image.LANCZOS)
        keyed.save(out / f"{path.stem}.webp", "WEBP", quality=QUALITY, method=6)
        print(f"{path.stem} : {keyed.width}x{keyed.height}")


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    zone = int(sys.argv[1])
    prepare_floor(zone)
    prepare_decors(zone)


if __name__ == "__main__":
    main()
