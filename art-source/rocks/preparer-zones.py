"""Prépare les décors et les rochers des zones données pour le jeu.

- Rocher (`art-source/rocks/zoneN.png`, fond vert) : le vert est retiré par « démélange », pour garder propres les
  lueurs semi-transparentes (champignons, poussière de fée), puis l'image est recadrée et mise à 260 px de haut,
  comme les rochers des zones 1 à 10.
- Fond (`art-source/backgrounds/zoneN.png`) : converti tel quel en WebP.

Usage, depuis la racine du dépôt : python art-source/rocks/preparer-zones.py 11 12 13
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ART = Path(__file__).parent.parent
PUBLIC = ART.parent / "frontend" / "public" / "assets"
ROCK_HEIGHT = 260
WEBP_QUALITY = 88
# Mesure du vert : g - max(r, b). Au-delà de FULL c'est le fond, en dessous de OPAQUE c'est le rocher.
GREEN_FULL = 120.0
GREEN_OPAQUE = 10.0
CONTENT_ALPHA = 40


def unmix_green(image: Image.Image) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.float64)
    background = np.median(rgb[:16, :16].reshape(-1, 3), axis=0)
    greenness = rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2])
    alpha = np.clip((GREEN_FULL - greenness) / (GREEN_FULL - GREEN_OPAQUE), 0.0, 1.0)
    safe = np.maximum(alpha, 1e-3)[..., None]
    color = np.clip((rgb - (1 - alpha[..., None]) * background) / safe, 0, 255)
    return Image.fromarray(np.dstack([color, alpha * 255]).round().astype(np.uint8), "RGBA")


def prepare_rock(zone: int) -> None:
    rock = unmix_green(Image.open(ART / "rocks" / f"zone{zone}.png"))
    box = rock.getchannel("A").point(lambda value: 255 if value > CONTENT_ALPHA else 0).getbbox()
    if box is None:
        raise ValueError(f"rocher de la zone {zone} vide après détourage")
    rock = rock.crop(box)
    width = round(rock.width * ROCK_HEIGHT / rock.height)
    rock.resize((width, ROCK_HEIGHT), Image.LANCZOS).save(PUBLIC / "rocks" / f"zone{zone}.webp", quality=WEBP_QUALITY)


def prepare_background(zone: int) -> None:
    background = Image.open(ART / "backgrounds" / f"zone{zone}.png").convert("RGB")
    background.save(PUBLIC / "backgrounds" / f"zone{zone}.webp", quality=WEBP_QUALITY)


if __name__ == "__main__":
    for argument in sys.argv[1:]:
        prepare_rock(int(argument))
        prepare_background(int(argument))
