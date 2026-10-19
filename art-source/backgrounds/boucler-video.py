"""Transforme une vidéo de décor en boucle sans couture, pour le fond animé d'une zone.

Usage :
    python boucler-video.py <video.mp4> <sortie.mp4>

- Cherche le passage qui boucle le mieux (première et dernière image les plus proches), après les premières images
  (Gemini part souvent d'une image fixe qui s'anime ensuite) et d'au moins MIN_LOOP_S secondes.
- Fond la fin du passage dans son début (fondu de CROSSFADE_S) : la dernière image de la boucle est exactement la
  première, le retour au début ne se voit pas.
- Encode en H.264 (lisible partout, Safari compris), sans son, en 720 × 1280, prêt à démarrer en streaming.

Dépendances : ffmpeg et ffprobe dans le PATH, Pillow, numpy.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

MIN_START_S = 1.0
MIN_LOOP_S = 5.0
CROSSFADE_S = 0.6
COMPARE_WIDTH = 120
# Qualité de l'encodage : plus haut, plus léger et moins net (23 à 30 restent propres pour un décor)
CRF = 26


def frame_rate(video: Path) -> float:
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "json", str(video)],
        check=True, capture_output=True, text=True,
    )
    numerator, denominator = json.loads(probe.stdout)["streams"][0]["r_frame_rate"].split("/")
    return int(numerator) / int(denominator)


def small_frames(video: Path, folder: Path) -> list[np.ndarray]:
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(video), "-vf", f"scale={COMPARE_WIDTH}:-1", str(folder / "f%04d.png")],
        check=True,
    )
    return [np.asarray(Image.open(path).convert("L")).astype(np.float32) for path in sorted(folder.glob("f*.png"))]


def best_loop(frames: list[np.ndarray], fps: float) -> tuple[float, float]:
    """Début et fin (en secondes) du passage dont la fin ressemble le plus au début."""
    first = round(MIN_START_S * fps)
    min_length = round((MIN_LOOP_S + CROSSFADE_S) * fps)
    best = (float("inf"), first, len(frames) - 1)
    for start in range(first, len(frames)):
        for end in range(start + min_length, len(frames)):
            difference = float(np.mean(np.abs(frames[start] - frames[end])))
            if difference < best[0]:
                best = (difference, start, end)
    print(f"boucle : de {best[1] / fps:.2f} s à {best[2] / fps:.2f} s (écart moyen {best[0]:.2f})")
    return best[1] / fps, best[2] / fps


def main() -> None:
    # La console Windows n'est pas en UTF-8 par défaut : les messages contiennent des accents
    sys.stdout.reconfigure(encoding="utf-8")
    video, out = Path(sys.argv[1]), Path(sys.argv[2])
    fps = frame_rate(video)
    with tempfile.TemporaryDirectory() as tmp:
        start, end = best_loop(small_frames(video, Path(tmp)), fps)
    fade = CROSSFADE_S
    # Le corps de la boucle part de start + fondu ; ses dernières secondes se fondent dans [start, start + fondu] :
    # la boucle finit donc sur l'image où elle commence
    length = end - start - fade
    graph = (
        f"[0:v]trim=start={start + fade}:end={end},setpts=PTS-STARTPTS[body];"
        f"[0:v]trim=start={start}:end={start + fade},setpts=PTS-STARTPTS[head];"
        f"[body][head]xfade=transition=fade:duration={fade}:offset={length - fade},"
        "scale=720:1280,format=yuv420p[out]"
    )
    # La dernière image du fondu est la première de la boucle : on la retire, sinon elle s'afficherait deux fois
    frames = round(length * fps) - 1
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(video), "-filter_complex", graph, "-map", "[out]", "-an",
         "-frames:v", str(frames),
         "-c:v", "libx264", "-preset", "slow", "-crf", str(CRF), "-movflags", "+faststart", str(out)],
        check=True,
    )
    print(f"{out} : {length:.2f} s, {out.stat().st_size / 1024:.0f} Ko")


if __name__ == "__main__":
    main()
