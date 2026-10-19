// Équilibrage des donjons de ressources : des niveaux sans fin, un nombre de coups fixe, pas de chrono.
// Lot 5 des idées inspirées de Forge Master (demande de Théo, 19/10/2026). Voir docs/game-design/donjons.md.

export const DUNGEON_IDS = ['crystal', 'forge'] as const;
export type DungeonId = (typeof DUNGEON_IDS)[number];

export interface DungeonDefinition {
  readonly label: string;
  readonly text: string;
  /** Ce que rapporte une victoire : des éclats de géode, ou le minerai de la zone la plus profonde atteinte. */
  readonly reward: 'shards' | 'ores';
  /** Décor de la zone dont le donjon reprend l'ambiance. */
  readonly zone: number;
}

export const DUNGEONS: Readonly<Record<DungeonId, DungeonDefinition>> = {
  crystal: { label: 'Grotte de cristal', text: 'Des géodes à éclats, de plus en plus dures.', reward: 'shards', zone: 8 },
  forge: { label: 'Forge ancestrale', text: 'Les filons oubliés des nains, riches en minerai.', reward: 'ores', zone: 5 },
};

export const DUNGEON_UNLOCK_ZONE = 4;
/** 2 clés par jour et par donjon ; les clés non utilisées s'accumulent jusqu'à 4. */
export const DUNGEON_DAILY_KEYS = 2;
export const DUNGEON_MAX_KEYS = 4;
/** Coups pour casser le rocher du niveau : jamais de chrono, un nombre de coups fixe. */
export const DUNGEON_STRIKES = 20;

/**
 * PV du rocher d'un niveau : +20 % par niveau, sans fin. Une victoire ouvre le niveau suivant, et une clé n'est
 * dépensée que sur une victoire : la malchance aux critiques ne coûte jamais rien.
 */
const DUNGEON_BASE_HP = 300;
const DUNGEON_HP_GROWTH = 1.2;

export function dungeonHp(level: number): number {
  return Math.round(DUNGEON_BASE_HP * DUNGEON_HP_GROWTH ** (level - 1));
}

/**
 * Récompense d'une victoire : une base, plus une hausse linéaire par niveau (principe de Forge Master). Au simulateur,
 * 10 + 2 éclats par niveau faisaient 14 000 éclats en 60 jours et avançaient la pioche 30 d'un jour : divisés par deux.
 */
const SHARD_BASE = 5;
const SHARDS_PER_LEVEL = 1;
const ORE_BASE = 2;
const ORES_PER_LEVEL = 0.5;

export function dungeonReward(id: DungeonId, level: number): number {
  return DUNGEONS[id].reward === 'shards'
    ? SHARD_BASE + SHARDS_PER_LEVEL * level
    : Math.round(ORE_BASE + ORES_PER_LEVEL * level);
}
