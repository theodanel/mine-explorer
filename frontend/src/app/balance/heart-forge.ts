// Équilibrage de la Forge du Cœur et des Échos : ressources récoltées dans les anciennes zones, recettes du Creuset,
// runes à sertir pour éveiller les étoiles du Cœur du monde.
// Voir docs/game-design/echos-et-creuset.md (idée de Théo, validée le 18/10/2026).

// ─── Ressources des Échos ───

export const ESSENCES = ['sap', 'ember', 'dawn', 'mist', 'frost'] as const;
export type EssenceId = (typeof ESSENCES)[number];

export const ESSENCE_LABELS: Readonly<Record<EssenceId, string>> = {
  sap: 'Sève de pierre',
  ember: 'Braise vive',
  dawn: "Éclat d'aurore",
  mist: "Brume d'ombre",
  frost: 'Givre ancien',
};

/** Ressource de l'Écho de chaque ancienne zone, de la 1 à la 11 : celle qui ressemble à son décor. */
export const ECHO_ESSENCES: readonly EssenceId[] = [
  'sap', // 1 Galerie des racines
  'sap', // 2 Carrière de pierre
  'sap', // 3 Veines de cuivre
  'sap', // 4 Mine de fer
  'ember', // 5 Forge naine
  'dawn', // 6 Caverne d'or
  'mist', // 7 Ruines elfiques
  'frost', // 8 Grotte de cristal
  'ember', // 9 Caverne de magma
  'dawn', // 10 Sanctuaire divin
  'mist', // 11 Forêt souterraine
];

/** Un filon d'Écho résiste environ 2 minutes à la Puissance du joueur quand il y entre : le monde suit le joueur. */
export const ECHO_SECONDS_PER_ROCK = 120;
/** Ressources garanties par filon d'Écho épuisé. */
export const ECHO_ESSENCES_PER_ROCK = 1;
/** Le Puits sans fond, dès la Légende : une ressource de chaque sorte tous les 25 étages. */
export const ABYSS_FLOORS_PER_ESSENCES = 25;

// ─── Runes ───

export const RUNE_ELEMENTS = ['fire', 'ice', 'earth', 'shadow', 'light'] as const;
export const ALLIANCE_RUNES = ['magma', 'storm', 'grove', 'eclipse', 'heart'] as const;
export const RUNE_TYPES = [...RUNE_ELEMENTS, ...ALLIANCE_RUNES] as const;
export type RuneElement = (typeof RUNE_ELEMENTS)[number];
export type AllianceRune = (typeof ALLIANCE_RUNES)[number];
export type RuneType = (typeof RUNE_TYPES)[number];

export const RUNE_LABELS: Readonly<Record<RuneType, string>> = {
  fire: 'Feu',
  ice: 'Glace',
  earth: 'Terre',
  shadow: 'Ombre',
  light: 'Lumière',
  magma: 'Magma',
  storm: 'Tempête',
  grove: 'Bosquet',
  eclipse: 'Éclipse',
  heart: 'Cœur',
};

/** Élément de chaque ressource : 3 ressources identiques donnent la rune de cet élément. */
export const ESSENCE_ELEMENTS: Readonly<Record<EssenceId, RuneElement>> = {
  sap: 'earth',
  ember: 'fire',
  dawn: 'light',
  mist: 'shadow',
  frost: 'ice',
};

/** Recettes des runes d'alliance, à découvrir au Creuset : l'ordre des ressources n'y compte pas. */
export const ALLIANCE_RECIPES: Readonly<Record<AllianceRune, readonly [EssenceId, EssenceId, EssenceId]>> = {
  magma: ['ember', 'ember', 'sap'],
  storm: ['frost', 'frost', 'mist'],
  grove: ['sap', 'sap', 'dawn'],
  eclipse: ['mist', 'dawn', 'dawn'],
  heart: ['ember', 'frost', 'dawn'],
};

export const MAX_RUNE_RANK = 5;

/** Fusionner : 3 runes du même type et du même rang donnent une rune du rang suivant. */
export const RUNE_FUSION_COUNT = 3;
/**
 * Chance qu'une fusion rate, selon le rang visé : à partir du rang 3, le « pari » qui rend les dernières étoiles dures.
 * Une fusion ratée ne rend qu'une des trois runes.
 */
export const RUNE_FUSION_FAIL: Readonly<Record<number, number>> = { 2: 0, 3: 0.2, 4: 0.3, 5: 0.35 };

/** Runes à sertir pour chaque étoile, de la 1re à la 5e : de plus en plus complexes. */
export const STAR_RUNES: readonly (readonly [{ type: RuneType; rank: number }, { type: RuneType; rank: number }])[] = [
  [{ type: 'fire', rank: 1 }, { type: 'earth', rank: 1 }],
  [{ type: 'ice', rank: 2 }, { type: 'magma', rank: 1 }],
  [{ type: 'light', rank: 3 }, { type: 'storm', rank: 2 }],
  [{ type: 'grove', rank: 3 }, { type: 'eclipse', rank: 3 }],
  [{ type: 'heart', rank: 5 }, { type: 'eclipse', rank: 5 }],
];

/**
 * Une rune d'alliance coûte 2 ressources de plus que les 3 de sa recette (les deux premières de la recette, une fois de
 * plus) : depuis le 25/10/2026, l'étoile qui la demande révèle sa recette, on ne la cherche plus au hasard.
 */
export const ALLIANCE_EXTRA_ESSENCES = 2;

/** Un emplacement de l'anneau par rune à sertir : 2 par étoile, 10 en tout. */
export const RING_SOCKETS = STAR_RUNES.length * 2;
