"""Prépare un fond large qui défile derrière le héros quand il avance d'un filon au suivant.

Usage :
    python preparer-fond-large.py <image source> <zone>

- Gemini rend souvent le fond déjà répété deux fois côte à côte : le script cherche la période de répétition
  horizontale et en découpe exactement une, dont le bord gauche continue alors le bord droit. Sans répétition
  trouvée, il garde toute la largeur (raccord à vérifier à l'œil).
- Ramène la hauteur à 1280 px, celle de la scène : la ligne du sol se mesure alors dans les mêmes unités que
  floorY dans game-assets.ts.
- Écrit frontend/public/assets/backgrounds/zone<N>-large.webp.

Dépendances : Pillow, numpy.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SCENE_HEIGHT = 1280
# Une période est retenue quand l'image décalée d'elle-même diffère moins que ça (niveaux de gris, 0 à 255)
PERIOD_MAX_GAP = 6.0
QUALITY = 85


def horizontal_period(gray: np.ndarray) -> int | None:
    width = gray.shape[1]
    gap, period = min(
        (np.abs(gray[:, shift:] - gray[:, : width - shift]).mean(), shift) for shift in range(width // 4, width - width // 4)
    )
    return period if gap < PERIOD_MAX_GAP else None


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    source, zone = Path(sys.argv[1]), int(sys.argv[2])
    image = Image.open(source).convert("RGB")
    period = horizontal_period(np.asarray(image.convert("L"), dtype=float))
    if period:
        left = (image.width - period) // 2
        image = image.crop((left, 0, left + period, image.height))
        print(f"période de {period} px découpée")
    else:
        print("aucune répétition trouvée : largeur entière gardée, vérifie le raccord gauche-droite")
    width = round(image.width * SCENE_HEIGHT / image.height)
    out = ROOT / "frontend" / "public" / "assets" / "backgrounds" / f"zone{zone}-large.webp"
    image.resize((width, SCENE_HEIGHT), Image.LANCZOS).save(out, "WEBP", quality=QUALITY, method=6)
    print(f"{out.name} : {width}x{SCENE_HEIGHT}")


if __name__ == "__main__":
    main()
