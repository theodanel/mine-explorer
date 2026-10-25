"""Détoure les pièces Divin corrompu (sources Gemini sur fond vert, 2048 px) en icônes de jeu.

  divin-corrompu/<pièce>.jpg -> frontend/public/assets/ui/divin-corrompu/<emplacement>.webp (256 px)

Le vert des sources n'est pas du #00FF00 pur (jusqu'à #2FC727 pour le sac) et la lueur orange autour du casque et
des gants s'y mélange : l'opacité suit l'écart entre le vert et les autres couches, mesuré sur le fond de chaque image,
et le vert restant sur les bords redevient de la braise orange.

Lancer depuis la racine du dépôt : python art-source/divin-corrompu/preparer-divin-corrompu.py
"""
from pathlib import Path

from PIL import Image

SOURCE = Path(__file__).parent
TARGET = Path(__file__).parents[2] / "frontend" / "public" / "assets" / "ui" / "divin-corrompu"
PIECES = {"casque": "helmet", "pioche": "pickaxe", "sac": "bag", "gants": "gloves", "bottes": "boots"}
# En dessous de cet écart vert, le pixel appartient à la pièce
OPAQUE_SPILL = 5
# Part de l'écart du fond au-delà de laquelle le pixel est du fond : la lueur mêlée de vert reste en semi-transparence
BACKGROUND_SHARE = 0.8
# Part du rouge dans le vert gardé : une lueur verdâtre redevient orange
DESPILL_RED = 0.55
ICON_SIZE = 256
QUALITY = 90


def spill_of(pixel: tuple[int, ...]) -> int:
    red, green, blue = pixel[:3]
    return green - max(red, blue)


def key_out(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    background = spill_of(rgba.getpixel((4, 4))) * BACKGROUND_SHARE
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, _ = pixels[x, y]
            spill = green - max(red, blue)
            if spill <= 0:
                continue
            alpha = 255 if spill <= OPAQUE_SPILL else max(0, round(255 * (background - spill) / (background - OPAQUE_SPILL)))
            # Le vert mêlé à la lueur redevient de la braise : le vert est ramené sous le rouge, comme dans l'orange
            pixels[x, y] = (red, min(green, round(DESPILL_RED * red + (1 - DESPILL_RED) * blue)), blue, alpha)
    return rgba


def trim(image: Image.Image) -> Image.Image:
    return image.crop(image.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())


def square(image: Image.Image) -> Image.Image:
    """Centre la pièce dans un carré transparent, pour qu'elle garde ses proportions dans les cadres."""
    side = max(image.size)
    canvas = Image.new("RGBA", (side, side))
    canvas.paste(image, ((side - image.width) // 2, (side - image.height) // 2))
    return canvas


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    for source, slot in PIECES.items():
        icon = square(trim(key_out(Image.open(SOURCE / f"{source}.jpg"))))
        icon = icon.resize((ICON_SIZE, ICON_SIZE), Image.LANCZOS)
        icon.save(TARGET / f"{slot}.webp", quality=QUALITY)
        print(slot, icon.size)


if __name__ == "__main__":
    main()
