"""Prépare les images du conte d'introduction (sources Gemini de Théo, 27/10/2026).

  intro/<n>-<nom>.jpg -> frontend/public/assets/ui/intro/<n>.webp, 1080 px de large

Lancer depuis la racine du dépôt : python art-source/intro/preparer-intro.py
"""
from pathlib import Path

from PIL import Image

SOURCE = Path(__file__).parent
TARGET = Path(__file__).parents[2] / "frontend" / "public" / "assets" / "ui" / "intro"
WIDTH = 1080
QUALITY = 82


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    for source in sorted(SOURCE.glob("*.jpg")):
        image = Image.open(source).convert("RGB")
        image = image.resize((WIDTH, round(image.height * WIDTH / image.width)), Image.LANCZOS)
        image.save(TARGET / f"{source.stem.split('-')[0]}.webp", quality=QUALITY)


if __name__ == "__main__":
    main()
