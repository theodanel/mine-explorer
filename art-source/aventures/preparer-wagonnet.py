"""Prépare les visuels du Wagonnet fou pour le jeu.

- Objets (déjà détourés par Photoroom) : recadrés sur leur contenu, centrés dans un carré de 256 px, en WebP.
- Fond (`fond-wagonnet.jpg`) : converti en WebP pour le fond de la page, et une découpe autour des rails pour la
  voie de course. La découpe met le point de fuite à 34 % de sa hauteur et le bas des rails tout en bas, comme
  la perspective calculée dans minecart-page.ts.

Usage, depuis la racine du dépôt : python art-source/aventures/preparer-wagonnet.py
"""

from pathlib import Path

from PIL import Image

SOURCE = Path(__file__).parent
PUBLIC = SOURCE.parent.parent / "frontend" / "public" / "assets"
ICON_SIZE = 256
WEBP_QUALITY = 88
# Le détourage Photoroom laisse un voile quasi invisible sur tout le fond : on recadre au-dessus de ce seuil.
CONTENT_ALPHA = 40
OBJECTS = ("wagonnet", "wagonnet-carte", "chauve-souris", "rail-casse", "eboulement")
# Bande du fond (en px de l'image 572×1024) qui contient le tunnel et ses rails.
TRACK_TOP = 300
TRACK_BOTTOM = 800


def prepare_object(name: str) -> None:
    image = Image.open(SOURCE / f"{name}.png").convert("RGBA")
    box = image.getchannel("A").point(lambda value: 255 if value > CONTENT_ALPHA else 0).getbbox()
    if box is None:
        raise ValueError(f"{name}.png est vide après détourage")
    image = image.crop(box)
    side = max(image.size)
    canvas = Image.new("RGBA", (side, side))
    canvas.paste(image, ((side - image.width) // 2, side - image.height))
    canvas.resize((ICON_SIZE, ICON_SIZE), Image.LANCZOS).save(PUBLIC / "ui" / "aventures" / f"{name}.webp", quality=WEBP_QUALITY)


def prepare_background() -> None:
    background = Image.open(SOURCE / "fond-wagonnet.jpg").convert("RGB")
    background.save(PUBLIC / "backgrounds" / "aventure-wagonnet.webp", quality=WEBP_QUALITY)
    track = background.crop((0, TRACK_TOP, background.width, TRACK_BOTTOM))
    track.save(PUBLIC / "backgrounds" / "aventure-wagonnet-voie.webp", quality=WEBP_QUALITY)


if __name__ == "__main__":
    for name in OBJECTS:
        prepare_object(name)
    prepare_background()
