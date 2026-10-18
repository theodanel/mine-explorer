"""Prépare les visuels Gemini du Marchand nain, de la Forge express et de l'Expédition aux flambeaux.

- Objets (déjà détourés par Photoroom) : recadrés sur leur contenu, centrés dans un carré de 256 px, en WebP.
  Le liseré vert laissé par le fond #00FF00 autour du monstre est effacé.
- Case de sol (`case-sol.jpg`, sur fond gris clair) : recadrée sur la dalle, en WebP de 256 px.
- Fond de l'étal (`marchand-etal.jpg`) : converti en WebP.

Usage, depuis la racine du dépôt : python art-source/aventures/preparer-aventures.py
"""

from pathlib import Path

from PIL import Image

SOURCE = Path(__file__).parent
PUBLIC = SOURCE.parent.parent / "frontend" / "public" / "assets"
ICON_SIZE = 256
WEBP_QUALITY = 88
# Le détourage Photoroom laisse un voile quasi invisible sur tout le fond : on recadre au-dessus de ce seuil.
CONTENT_ALPHA = 40
OBJECTS = ("marchand", "lingot", "marteau", "forge-carte", "torche", "monstre", "flambeaux-carte")
# Un pixel est un reste du fond vert quand son vert dépasse nettement son rouge et son bleu.
GREEN_MARGIN = 20
# La dalle du sol se détache du fond gris clair sous cette luminosité.
FLOOR_LUMA = 180


def remove_green_fringe(image: Image.Image) -> Image.Image:
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha > 0 and green - max(red, blue) > GREEN_MARGIN:
                pixels[x, y] = (red, green, blue, 0)
    return image


def prepare_object(name: str) -> None:
    image = remove_green_fringe(Image.open(SOURCE / f"{name}.png").convert("RGBA"))
    box = image.getchannel("A").point(lambda value: 255 if value > CONTENT_ALPHA else 0).getbbox()
    if box is None:
        raise ValueError(f"{name}.png est vide après détourage")
    image = image.crop(box)
    side = max(image.size)
    canvas = Image.new("RGBA", (side, side))
    canvas.paste(image, ((side - image.width) // 2, (side - image.height) // 2))
    canvas.resize((ICON_SIZE, ICON_SIZE), Image.LANCZOS).save(PUBLIC / "ui" / "aventures" / f"{name}.webp", quality=WEBP_QUALITY)


def prepare_floor() -> None:
    image = Image.open(SOURCE / "case-sol.jpg").convert("RGB")
    box = image.convert("L").point(lambda value: 255 if value < FLOOR_LUMA else 0).getbbox()
    if box is None:
        raise ValueError("case-sol.jpg : dalle introuvable")
    image.crop(box).resize((ICON_SIZE, ICON_SIZE), Image.LANCZOS).save(PUBLIC / "ui" / "aventures" / "case-sol.webp", quality=WEBP_QUALITY)


def prepare_background() -> None:
    background = Image.open(SOURCE / "marchand-etal.jpg").convert("RGB")
    background.save(PUBLIC / "backgrounds" / "aventure-marchand.webp", quality=WEBP_QUALITY)


if __name__ == "__main__":
    for name in OBJECTS:
        prepare_object(name)
    prepare_floor()
    prepare_background()
