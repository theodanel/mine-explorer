"""Prépare les images de l'écran de lancement (sources Gemini) pour le jeu.

  lancement-fond.jpeg  -> frontend/public/assets/ui/splash-bg.webp (portrait, réduit à 720 px de large)
  lancement-logo.jpeg  -> frontend/public/assets/ui/logo.webp (fond vert #00FF00 rendu transparent, recadré)

Lancer depuis la racine du dépôt : python art-source/ui/preparer-lancement.py
"""
from pathlib import Path

from PIL import Image

SOURCE = Path(__file__).parent
TARGET = Path(__file__).parents[2] / "frontend" / "public" / "assets" / "ui"
BACKGROUND_WIDTH = 720
LOGO_WIDTH = 1000
# Écart entre le vert et la plus forte des deux autres couches : au-delà, le pixel est du fond ; entre les deux
# seuils, il devient semi-transparent pour adoucir le bord (le JPEG brouille la limite avec le vert)
GREEN_OPAQUE = 40
GREEN_TRANSPARENT = 110
QUALITY = 88


def key_out_green(image: Image.Image) -> Image.Image:
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, _ = pixels[x, y]
            spill = green - max(red, blue)
            if spill <= GREEN_OPAQUE:
                continue
            alpha = max(0, round(255 * (GREEN_TRANSPARENT - spill) / (GREEN_TRANSPARENT - GREEN_OPAQUE)))
            # Le vert qui déborde sur le bord est ramené au niveau des autres couches
            pixels[x, y] = (red, max(red, blue), blue, alpha)
    return image


def prepare_background() -> None:
    image = Image.open(SOURCE / "lancement-fond.jpeg").convert("RGB")
    height = round(image.height * BACKGROUND_WIDTH / image.width)
    image.resize((BACKGROUND_WIDTH, height), Image.LANCZOS).save(TARGET / "splash-bg.webp", quality=QUALITY)


def prepare_logo() -> None:
    image = key_out_green(Image.open(SOURCE / "lancement-logo.jpeg").convert("RGBA"))
    image = image.crop(image.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())
    height = round(image.height * LOGO_WIDTH / image.width)
    image.resize((LOGO_WIDTH, height), Image.LANCZOS).save(TARGET / "logo.webp", quality=QUALITY)


if __name__ == "__main__":
    prepare_background()
    prepare_logo()
    for name in ("splash-bg.webp", "logo.webp"):
        with Image.open(TARGET / name) as result:
            print(name, result.size)
