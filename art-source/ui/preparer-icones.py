"""Icônes de l'application installée (PWA), recadrées sur le mineur de l'écran de lancement.

  ui/lancement-fond.jpeg -> frontend/public/icons/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png

En PNG : c'est le seul format que l'écran d'accueil de l'iPhone accepte. Le cadrage garde la tête du mineur au centre,
dans les 80 % que les icônes « maskable » d'Android ne rognent jamais.

Lancer depuis la racine du dépôt : python art-source/ui/preparer-icones.py
"""
from pathlib import Path

from PIL import Image

SOURCE = Path(__file__).parent / "lancement-fond.jpeg"
TARGET = Path(__file__).parents[2] / "frontend" / "public" / "icons"
# Carré autour du casque et du visage du mineur, dans lancement-fond.jpeg (1438 × 2576)
HEAD_BOX = (380, 800, 1240, 1660)
SIZES = {"icon-192.png": 192, "icon-512.png": 512, "icon-maskable-512.png": 512, "apple-touch-icon.png": 180}


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    head = Image.open(SOURCE).convert("RGB").crop(HEAD_BOX)
    for name, size in SIZES.items():
        head.resize((size, size), Image.LANCZOS).save(TARGET / name, optimize=True)
        print(name, size)


if __name__ == "__main__":
    main()
