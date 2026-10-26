// Dessin de l'Astre du Cœur, partagé par la mine (PixiJS) et la page de la Forge (SVG) : une constellation à 5 étoiles.
import { ASTRE_STAGES } from '../balance/astre';

export interface AstrePoint {
  readonly x: number;
  readonly y: number;
  readonly lit: boolean;
}

export interface AstreLine {
  readonly from: AstrePoint;
  readonly to: AstrePoint;
}

export interface AstreLayout {
  readonly points: readonly AstrePoint[];
  /** Traits allumés entre étoiles : le contour se ferme étoile après étoile, l'étoile intérieure brille à Supernova. */
  readonly lines: readonly AstreLine[];
}

/** Ordre de tracé de l'étoile intérieure (pentagramme) : une pointe sur deux. */
const PENTAGRAM_STEP = 2;

/** Étoiles de l'Astre autour de (0, 0), la première en haut ; chaque stade en allume une. */
export function astreLayout(stage: number, radius: number): AstreLayout {
  const points = Array.from({ length: ASTRE_STAGES }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / ASTRE_STAGES;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle), lit: index < stage };
  });
  const lines: AstreLine[] = [];
  for (let index = 0; index < ASTRE_STAGES; index++) {
    const next = points[(index + 1) % ASTRE_STAGES];
    if (points[index].lit && next.lit) {
      lines.push({ from: points[index], to: next });
    }
  }
  if (stage >= ASTRE_STAGES) {
    for (let index = 0; index < ASTRE_STAGES; index++) {
      lines.push({ from: points[index], to: points[(index + PENTAGRAM_STEP) % ASTRE_STAGES] });
    }
  }
  return { points, lines };
}

/** Petites étoiles de la Constellation, en orbite autour de l'Astre : une par niveau, jusqu'à ce nombre. */
export const ORBIT_STARS_SHOWN = 12;

export function orbitStars(constellation: number, radius: number): readonly { readonly x: number; readonly y: number }[] {
  const count = Math.min(constellation, ORBIT_STARS_SHOWN);
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });
}
