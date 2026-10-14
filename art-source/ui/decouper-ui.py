"""Prépare les images du lot 3 de la refonte : les rayons de récompense et les petites pièces volantes.

- rayons.png (fond vert) : le vert est retiré par « démélange » (le halo est semi-transparent, un simple seuil
  laisserait une auréole verte), puis l'image est exportée en WebP 512 px.
- pieces.png (déjà détouré) : la pièce d'or à gauche, l'éclat à droite, recadrés sur leur contenu, en WebP 96 px.

Usage, depuis la racine du dépôt : python art-source/ui/decouper-ui.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

SOURCE = Path(__file__).parent
OUTPUT = SOURCE.parent.parent / "frontend" / "public" / "assets" / "ui" / "refonte"
RAYS_SIZE = 512
ICON_SIZE = 96
WEBP_QUALITY = 90
# Mesure du vert : g - max(r, b). Au-delà de FULL c'est le fond, en dessous de OPAQUE c'est le rayon pur.
GREEN_FULL = 150.0
GREEN_OPAQUE = -20.0
# Le détourage Photoroom laisse un voile quasi invisible sur tout le fond : on recadre au-dessus de ce seuil.
CONTENT_ALPHA = 40


def unmix_green(image: Image.Image) -> Image.Image:
    """Retire un fond vert uni d'une image au bord flou, en retrouvant la couleur d'origine des pixels mêlés."""
    rgb = np.asarray(image.convert("RGB"), dtype=np.float64)
    background = np.median(rgb[:16, :16].reshape(-1, 3), axis=0)
    greenness = rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2])
    alpha = np.clip((GREEN_FULL - greenness) / (GREEN_FULL - GREEN_OPAQUE), 0.0, 1.0)
    safe = np.maximum(alpha, 1e-3)[..., None]
    color = np.clip((rgb - (1 - alpha[..., None]) * background) / safe, 0, 255)
    rgba = np.dstack([color, alpha * 255]).round().astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def crop_to_content(image: Image.Image) -> Image.Image:
    box = image.getchannel("A").point(lambda value: 255 if value > CONTENT_ALPHA else 0).getbbox()
    if box is None:
        raise ValueError("image vide : rien à recadrer")
    return image.crop(box)


def square(image: Image.Image, size: int) -> Image.Image:
    """Centre l'image dans un carré transparent, sans la déformer."""
    side = max(image.size)
    canvas = Image.new("RGBA", (side, side))
    canvas.paste(image, ((side - image.width) // 2, (side - image.height) // 2))
    return canvas.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    rays = unmix_green(Image.open(SOURCE / "rayons.png")).resize((RAYS_SIZE, RAYS_SIZE), Image.LANCZOS)
    rays.save(OUTPUT / "rays.webp", quality=WEBP_QUALITY)

    pieces = Image.open(SOURCE / "pieces.png").convert("RGBA")
    half = pieces.width // 2
    for name, box in (("coin-small", (0, 0, half, pieces.height)), ("shard-small", (half, 0, pieces.width, pieces.height))):
        square(crop_to_content(pieces.crop(box)), ICON_SIZE).save(OUTPUT / f"{name}.webp", quality=WEBP_QUALITY)


if __name__ == "__main__":
    main()
