// Équilibrage de la Forge du Cœur : les runes à sertir pour éveiller les étoiles du Cœur du monde.
// Voir docs/game-design/forge-du-coeur.md (validé par Théo le 18/10/2026).
import type { TierId } from '../equipment/equipment.model';

export const RUNE_ELEMENTS = ['fire', 'ice', 'earth', 'shadow', 'light'] as const;
export type RuneElement = (typeof RUNE_ELEMENTS)[number];

export const RUNE_LABELS: Readonly<Record<RuneElement, string>> = {
  fire: 'Feu',
  ice: 'Glace',
  earth: 'Terre',
  shadow: 'Ombre',
  light: 'Lumière',
};

export const MAX_RUNE_RANK = 5;

/**
 * Forger une rune de rang 1 : des éclats de cœur et des minerais divins, le seul minerai des zones 10 et plus (il
 * sert aussi à l'Atelier : le joueur choisit où le mettre).
 */
export const RUNE_FORGE_SHARDS = 3;
export const RUNE_FORGE_ORE: TierId = 'divine';
export const RUNE_FORGE_ORES = 10;

/** Fusionner : 3 runes du même élément et du même rang donnent une rune du rang suivant. */
export const RUNE_FUSION_COUNT = 3;
/**
 * Chance qu'une fusion rate, selon le rang visé : à partir du rang 3, le « pari » qui rend les dernières étoiles dures.
 * Une fusion ratée ne rend qu'une des trois runes.
 */
export const RUNE_FUSION_FAIL: Readonly<Record<number, number>> = { 2: 0, 3: 0.2, 4: 0.3, 5: 0.35 };

/** Runes à sertir pour chaque étoile, de la 1re à la 5e : deux runes d'un même rang. */
export const STAR_RUNES: readonly { readonly elements: readonly [RuneElement, RuneElement]; readonly rank: number }[] = [
  { elements: ['fire', 'earth'], rank: 1 },
  { elements: ['ice', 'shadow'], rank: 2 },
  { elements: ['fire', 'light'], rank: 3 },
  { elements: ['ice', 'earth'], rank: 4 },
  { elements: ['shadow', 'light'], rank: 5 },
];

/** Un emplacement de l'anneau par rune à sertir : 2 par étoile, 10 en tout. */
export const RING_SOCKETS = STAR_RUNES.length * 2;

// ─── Sources des éclats de cœur (à partir de la zone 12) ───

export const HEART_SHARD_FIRST_ZONE = 12;
/** Chaque gardien de zone battu. */
export const HEART_SHARDS_PER_GUARDIAN = 3;
/** Chaque filon épuisé : une chance sur 4. */
export const HEART_SHARD_ROCK_CHANCE = 0.25;
/** Le Puits sans fond, dès la Légende : un éclat de cœur tous les 10 étages. */
export const HEART_SHARD_ABYSS_FLOORS = 4;
