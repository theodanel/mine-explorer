// Équilibrage des événements de mine : géode géante, coffre enseveli, rat voleur, pluie de cristaux.
// Fichier pur, simulé par tools/simulate.mts. Voir docs/game-design/idees-fun.md (idée 2).

export const MINE_EVENT_IDS = ['giantGeode', 'buriedChest', 'thiefRat', 'crystalRain'] as const;
export type MineEventId = (typeof MINE_EVENT_IDS)[number];

/**
 * Un événement toutes les 2 à 4 minutes de jeu actif (onglet visible, mine affichée). Rien en absence :
 * ils récompensent le joueur qui reste, sans toucher à celui qui joue peu.
 */
export const EVENT_DELAY_MIN_MS = 2 * 60 * 1000;
export const EVENT_DELAY_MAX_MS = 4 * 60 * 1000;

/** Un événement ignoré disparaît simplement, sans rien faire perdre : pas de chrono qui fait échouer. */
export const EVENT_LIFETIME_MS: Readonly<Record<MineEventId, number>> = {
  giantGeode: 15_000,
  buriedChest: 12_000,
  // Le rat traverse la galerie : il faut le toucher pendant sa course
  thiefRat: 7_000,
  crystalRain: 8_000,
};

/** La géode s'ouvre en 5 touchers ; la pluie fait tomber 3 cristaux. */
export const GEODE_TAPS = 5;
export const CRYSTAL_RAIN_COUNT = 3;

export interface EventReward {
  /** Or exprimé en secondes de revenu actuel : la récompense suit la progression sans réglage par zone. */
  readonly goldSeconds: number;
  readonly shards: number;
  /** Minerai de la zone en cours (aucun en zone 1). */
  readonly ores: number;
}

/**
 * Budget mesuré au simulateur : environ +10 % d'or et +15 % d'éclats en jeu actif, en supposant
 * 80 % d'événements touchés. Pour la pluie, la récompense est celle d'un cristal.
 */
export const EVENT_REWARDS: Readonly<Record<MineEventId, EventReward>> = {
  giantGeode: { goldSeconds: 20, shards: 1, ores: 0 },
  buriedChest: { goldSeconds: 60, shards: 0, ores: 1 },
  thiefRat: { goldSeconds: 80, shards: 0, ores: 0 },
  crystalRain: { goldSeconds: 0, shards: 1, ores: 0 },
};

/** Part des événements que le joueur simulé touche. */
export const EVENT_TOUCH_RATE = 0.8;
