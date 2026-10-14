"""Prépare les visuels du Wagonnet fou pour le jeu.

- Objets (déjà détourés par Photoroom) : recadrés sur leur contenu, centrés dans un carré de 256 px, en WebP.
- Fond (`fond-wagonnet.jpg`) : converti en WebP. La page le fait défiler pendant la course ; la perspective de
  minecart-page.ts est mesurée sur ses rails (point de fuite en x 286, y 503 sur l'image 572×1024).

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


if __name__ == "__main__":
    for name in OBJECTS:
        prepare_object(name)
    prepare_background()
