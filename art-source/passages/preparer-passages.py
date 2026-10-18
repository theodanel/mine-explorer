"""Détoure les silhouettes des passages rares (images Gemini sur fond vert #00FF00) pour le fond de la mine.

  art-source/passages/<nom>.png -> frontend/public/assets/ui/passages/<nom>.webp (recadrée, 512 px de large au plus)

Lancer depuis la racine du dépôt : python art-source/passages/preparer-passages.py
"""
from pathlib import Path

from PIL import Image

SOURCE = Path(__file__).parent
TARGET = Path(__file__).parents[2] / "frontend" / "public" / "assets" / "ui" / "passages"
NAMES = ("chauves-souris", "wagonnet", "golem", "dragon-feu", "dragon-divin", "baleine", "fees")
# Écart entre le vert et la plus forte des deux autres couches : au-delà, fond ; entre les deux, bord adouci
GREEN_OPAQUE = 40
GREEN_TRANSPARENT = 110
# Les silhouettes passent petites et au loin : 512 px de large suffisent
MAX_WIDTH = 512
QUALITY = 88


def key_out_green(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, _ = pixels[x, y]
            spill = green - max(red, blue)
            if spill <= GREEN_OPAQUE:
                continue
            alpha = max(0, round(255 * (GREEN_TRANSPARENT - spill) / (GREEN_TRANSPARENT - GREEN_OPAQUE)))
            # Le vert qui déborde sur le bord est ramené au niveau des autres couches
            pixels[x, y] = (red, max(red, blue), blue, alpha)
    return rgba


def prepare(name: str) -> None:
    image = key_out_green(Image.open(SOURCE / f"{name}.png"))
    image = image.crop(image.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())
    if image.width > MAX_WIDTH:
        image = image.resize((MAX_WIDTH, round(image.height * MAX_WIDTH / image.width)), Image.LANCZOS)
    image.save(TARGET / f"{name}.webp", quality=QUALITY)
    print(name, image.size)


if __name__ == "__main__":
    TARGET.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        prepare(name)
