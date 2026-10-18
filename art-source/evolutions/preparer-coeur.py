"""Prépare les images de la Légende du Cœur du monde et des étoiles de rang (sources Gemini sur fond vert #00FF00).

  evolutions/coeur-pied.jpg -> art-source/animations/coeur-depart-16x9.png (image de départ de la vidéo de frappe,
                               découpée ensuite par art-source/animations/decouper-frappe.py)
  evolutions/coeur-portrait.jpg -> frontend/public/assets/evolutions/coeur-portrait.webp (tête et plastron, 160 px)
  ui/etoiles.png            -> frontend/public/assets/ui/etoile-pleine.webp et etoile-vide.webp

Lancer depuis la racine du dépôt : python art-source/evolutions/preparer-coeur.py
"""
from pathlib import Path

from PIL import Image

ART = Path(__file__).parents[1]
ASSETS = Path(__file__).parents[2] / "frontend" / "public" / "assets"
# Écart entre le vert et la plus forte des deux autres couches : au-delà, fond ; entre les deux, bord adouci
GREEN_OPAQUE = 40
GREEN_TRANSPARENT = 110
QUALITY = 90
PORTRAIT_SIZE = 160
# Cadre du portrait dans coeur-portrait.jpg (2048 × 2048) : cornes, casque et cœur serti dans le plastron
PORTRAIT_BOX = (250, 120, 1690, 1560)
STAR_SIZE = 128
# Image de départ de la vidéo : 16:9, le personnage n'occupe que 62 % de la hauteur, pour que Gemini
# garde la tête et les pieds dans le cadre pendant tout le coup
START_SIZE = (1920, 1080)
START_BODY_SHARE = 0.62
GREEN = (0, 255, 0)


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


def trim(image: Image.Image) -> Image.Image:
    return image.crop(image.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())


def fit_height(image: Image.Image, height: int) -> Image.Image:
    return image.resize((round(image.width * height / image.height), height), Image.LANCZOS)


def prepare_heart() -> None:
    keyed = key_out_green(Image.open(ART / "evolutions" / "coeur-pied.jpg"))
    body = trim(keyed)
    start = Image.new("RGBA", START_SIZE, (*GREEN, 255))
    small = fit_height(body, round(START_SIZE[1] * START_BODY_SHARE))
    start.alpha_composite(small, ((START_SIZE[0] - small.width) // 2, (START_SIZE[1] - small.height) // 2))
    start.convert("RGB").save(ART / "animations" / "coeur-depart-16x9.png")


def prepare_portrait() -> None:
    portrait = key_out_green(Image.open(ART / "evolutions" / "coeur-portrait.jpg")).crop(PORTRAIT_BOX)
    portrait.resize((PORTRAIT_SIZE, PORTRAIT_SIZE), Image.LANCZOS).save(
        ASSETS / "evolutions" / "coeur-portrait.webp", quality=QUALITY
    )


def prepare_stars() -> None:
    sheet = key_out_green(Image.open(ART / "ui" / "etoiles.png"))
    half = sheet.width // 2
    for name, box in (("etoile-pleine", (0, 0, half, sheet.height)), ("etoile-vide", (half, 0, sheet.width, sheet.height))):
        star = trim(sheet.crop(box))
        star.thumbnail((STAR_SIZE, STAR_SIZE), Image.LANCZOS)
        star.save(ASSETS / "ui" / f"{name}.webp", quality=QUALITY)


if __name__ == "__main__":
    prepare_heart()
    prepare_portrait()
    prepare_stars()
    for path in ("evolutions/coeur-portrait.webp", "ui/etoile-pleine.webp", "ui/etoile-vide.webp"):
        with Image.open(ASSETS / path) as result:
            print(path, result.size)
