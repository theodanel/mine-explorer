// Équilibrage des embranchements : à la fin de chaque zone, le joueur choisit la galerie de la suivante.
// Fichier pur, simulé par tools/simulate.mts. Voir docs/game-design/idees-fun.md (idée 3).

export const GALLERY_IDS = ['neutral', 'flooded', 'goldVein', 'unstable', 'crystal'] as const;
export type GalleryId = (typeof GALLERY_IDS)[number];

/** Effets d'une galerie, valables pour toute la zone et seulement en jeu : l'absence n'en tient pas compte. */
export interface GalleryEffects {
  /** Or gagné en minant. */
  readonly gold: number;
  /** Chance de déterrer un éclat à chaque coup. */
  readonly shards: number;
  /** Minerai ramassé (filons et fin de zone). */
  readonly ores: number;
  /** Dureté des filons : 1,15 = il faut 15 % de dégâts en plus pour les épuiser. */
  readonly hardness: number;
  /** Dégâts des explosions de sorts. */
  readonly blast: number;
  /** Points de Vitesse en plus ou en moins. */
  readonly speed: number;
}

export interface Gallery {
  readonly id: GalleryId;
  readonly label: string;
  /** Une ligne par effet, affichée sur la carte de choix. */
  readonly effects: readonly string[];
  readonly modifiers: GalleryEffects;
}

const NEUTRAL: GalleryEffects = { gold: 1, shards: 1, ores: 1, hardness: 1, blast: 1, speed: 0 };

/**
 * Chaque galerie est un échange : un gain et une contrepartie de valeur comparable, aucune n'est meilleure en tout.
 * Simulé : bien choisir à chaque zone ne fait pas gagner plus de 10 % de temps sur la galerie neutre.
 */
export const GALLERIES: Readonly<Record<GalleryId, Gallery>> = {
  neutral: { id: 'neutral', label: 'Galerie ordinaire', effects: ['Aucun effet'], modifiers: NEUTRAL },
  flooded: {
    id: 'flooded',
    label: 'Galerie inondée',
    effects: ['+50 % de minerai', 'Filons 15 % plus durs'],
    modifiers: { ...NEUTRAL, ores: 1.5, hardness: 1.15 },
  },
  goldVein: {
    id: 'goldVein',
    label: 'Veine d\'or',
    effects: ['+30 % d\'or en minant', '−30 % d\'éclats déterrés'],
    modifiers: { ...NEUTRAL, gold: 1.3, shards: 0.7 },
  },
  unstable: {
    id: 'unstable',
    label: 'Galerie instable',
    effects: ['+50 % de dégâts des explosions', '−10 points de Vitesse'],
    modifiers: { ...NEUTRAL, blast: 1.5, speed: -0.1 },
  },
  crystal: {
    id: 'crystal',
    label: 'Grotte de cristal',
    effects: ['+40 % d\'éclats déterrés', '−20 % d\'or en minant'],
    modifiers: { ...NEUTRAL, shards: 1.4, gold: 0.8 },
  },
};

/** Galeries proposées en fin de zone : deux au hasard parmi celles-ci. La neutre est le choix par défaut. */
export const OFFERED_GALLERIES: readonly GalleryId[] = ['flooded', 'goldVein', 'unstable', 'crystal'];
export const GALLERY_OFFER_SIZE = 2;
