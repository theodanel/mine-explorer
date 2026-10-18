"""Détoure les images de la Forge du Cœur (sources Gemini sur fond vert #00FF00).

  forge-du-coeur/runes.png       -> frontend/public/assets/ui/forge-du-coeur/rune-<élément>.webp (5 runes, 128 px)
  forge-du-coeur/anneau.png      -> frontend/public/assets/ui/forge-du-coeur/anneau.webp (600 px, centre transparent)
  forge-du-coeur/eclat-coeur.png -> frontend/public/assets/ui/forge-du-coeur/eclat-coeur.webp (128 px)
  forge-du-coeur/runes-alliance.png -> .../rune-<alliance>.webp (5 runes d'alliance, 128 px)
  forge-du-coeur/ressources.png  -> .../essence-<ressource>.webp (5 ressources des Échos, 128 px)
  forge-du-coeur/creuset.png     -> .../creuset.webp (machine du Creuset, 400 px)
  forge-du-coeur/fond-creuset.png -> .../fond-creuset.webp (fond opaque, taille d'origine)

Lancer depuis la racine du dépôt : python art-source/forge-du-coeur/preparer-forge.py
"""
from pathlib import Path

from PIL import Image

SOURCE = Path(__file__).parent
TARGET = Path(__file__).parents[2] / "frontend" / "public" / "assets" / "ui" / "forge-du-coeur"
ELEMENTS = ("fire", "ice", "earth", "shadow", "light")
# Dans l'ordre de gauche à droite des planches Gemini
ALLIANCES = ("magma", "storm", "grove", "eclipse", "heart")
ESSENCES = ("ember", "frost", "sap", "mist", "dawn")
# Écart entre le vert et la plus forte des deux autres couches : au-delà, fond ; entre les deux, bord adouci
GREEN_OPAQUE = 40
GREEN_TRANSPARENT = 110
ICON_SIZE = 128
RING_SIZE = 600
CRUCIBLE_SIZE = 400
QUALITY = 90


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


def column_spans(image: Image.Image) -> list[tuple[int, int]]:
    """Colonnes occupées, regroupées en blocs séparés par du vide : une rune par bloc."""
    alpha = image.getchannel("A").point(lambda a: 255 if a > 64 else 0)
    filled = [alpha.crop((x, 0, x + 1, image.height)).getbbox() is not None for x in range(image.width)]
    spans: list[tuple[int, int]] = []
    start = None
    for x, on in enumerate(filled + [False]):
        if on and start is None:
            start = x
        elif not on and start is not None:
            spans.append((start, x))
            start = None
    return spans


def split_sheet(source: str, names: tuple[str, ...], prefix: str) -> None:
    """Une planche d'icônes alignées sur fond vert : une icône par bloc de colonnes occupées."""
    sheet = key_out_green(Image.open(SOURCE / source))
    spans = column_spans(sheet)
    if len(spans) != len(names):
        raise SystemExit(f"{source} : {len(spans)} blocs trouvés au lieu de {len(names)}")
    for (left, right), name in zip(spans, names):
        icon = trim(sheet.crop((left, 0, right, sheet.height)))
        icon.thumbnail((ICON_SIZE, ICON_SIZE), Image.LANCZOS)
        icon.save(TARGET / f"{prefix}-{name}.webp", quality=QUALITY)
        print(prefix, name, icon.size)


def prepare_crucible() -> None:
    crucible = trim(key_out_green(Image.open(SOURCE / "creuset.png")))
    crucible.thumbnail((CRUCIBLE_SIZE, CRUCIBLE_SIZE), Image.LANCZOS)
    crucible.save(TARGET / "creuset.webp", quality=QUALITY)


def prepare_crucible_background() -> None:
    Image.open(SOURCE / "fond-creuset.png").convert("RGB").save(TARGET / "fond-creuset.webp", quality=QUALITY)


def prepare_ring() -> None:
    # Pas de recadrage : l'anneau reste centré dans son carré, comme les emplacements calculés par la page
    ring = key_out_green(Image.open(SOURCE / "anneau.png"))
    ring.resize((RING_SIZE, RING_SIZE), Image.LANCZOS).save(TARGET / "anneau.webp", quality=QUALITY)


def prepare_heart_shard() -> None:
    shard = trim(key_out_green(Image.open(SOURCE / "eclat-coeur.png")))
    shard.thumbnail((ICON_SIZE, ICON_SIZE), Image.LANCZOS)
    shard.save(TARGET / "eclat-coeur.webp", quality=QUALITY)


if __name__ == "__main__":
    TARGET.mkdir(parents=True, exist_ok=True)
    split_sheet("runes.png", ELEMENTS, "rune")
    split_sheet("runes-alliance.png", ALLIANCES, "rune")
    split_sheet("ressources.png", ESSENCES, "essence")
    prepare_ring()
    prepare_heart_shard()
    prepare_crucible()
    prepare_crucible_background()
