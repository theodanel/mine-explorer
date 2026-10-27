"""Prépare les visuels du Carnet d'aventure (sources Gemini de Théo, 27/10/2026).

  carnet/icone.jpg, carnet/sceau.jpg (fond vert) -> frontend/public/assets/ui/carnet/<nom>.webp, détourés, 256 px
  carnet/carnet-ouvert.jpg (fond de page)        -> frontend/public/assets/ui/carnet/carnet-ouvert.webp, 1080 px de large

Lancer depuis la racine du dépôt : python art-source/carnet/preparer-carnet.py
"""
from pathlib import Path

from PIL import Image

SOURCE = Path(__file__).parent
TARGET = Path(__file__).parents[2] / "frontend" / "public" / "assets" / "ui" / "carnet"
ICONS = ("icone", "sceau")
# En dessous de cet écart vert, le pixel appartient à l'objet ; au-delà de cette part de l'écart du fond, c'est du fond
OPAQUE_SPILL = 5
BACKGROUND_SHARE = 0.8
ICON_SIZE = 256
PAGE_WIDTH = 1080
QUALITY = 88


def key_out(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    red, green, blue, _ = rgba.getpixel((4, 4))
    background = (green - max(red, blue)) * BACKGROUND_SHARE
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, _ = pixels[x, y]
            spill = green - max(red, blue)
            if spill <= 0:
                continue
            alpha = 255 if spill <= OPAQUE_SPILL else max(0, round(255 * (background - spill) / (background - OPAQUE_SPILL)))
            # Le liseré vert des bords redevient neutre
            pixels[x, y] = (red, max(red, blue), blue, alpha)
    return rgba


def trim_square(image: Image.Image) -> Image.Image:
    cropped = image.crop(image.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())
    side = max(cropped.size)
    canvas = Image.new("RGBA", (side, side))
    canvas.paste(cropped, ((side - cropped.width) // 2, (side - cropped.height) // 2))
    return canvas


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    for name in ICONS:
        icon = trim_square(key_out(Image.open(SOURCE / f"{name}.jpg"))).resize((ICON_SIZE, ICON_SIZE), Image.LANCZOS)
        icon.save(TARGET / f"{name}.webp", quality=QUALITY)
    page = Image.open(SOURCE / "carnet-ouvert.jpg").convert("RGB")
    page = page.resize((PAGE_WIDTH, round(page.height * PAGE_WIDTH / page.width)), Image.LANCZOS)
    page.save(TARGET / "carnet-ouvert.webp", quality=QUALITY)


if __name__ == "__main__":
    main()
