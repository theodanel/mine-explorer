// Équilibrage des compagnons : œufs, éclosion, étoiles, niveaux et expéditions.
// Fichier pur, simulé par tools/simulate.mts. Voir docs/game-design/idees-fun.md (idée 4, déblocage validé le 13/10/2026).
import { BonusId, Rarity } from './skill-tree';

export const COMPANION_IDS = ['canary', 'mole', 'bat', 'firefly', 'golem', 'dragonling'] as const;
export type CompanionId = (typeof COMPANION_IDS)[number];

export interface CompanionDef {
  readonly id: CompanionId;
  readonly label: string;
  readonly rarity: Rarity;
  /** Bonus de base, à 1 étoile et au niveau 1, quand il accompagne le mineur. */
  readonly effects: Readonly<Partial<Record<BonusId, number>>>;
  readonly description: string;
}

/**
 * Un seul compagnon accompagne le mineur : son bonus forme une famille à part, multipliée aux autres.
 * Les autres partent en expédition. Budget simulé : environ ×1,15 de Puissance au jour 49.
 */
export const COMPANIONS: Readonly<Record<CompanionId, CompanionDef>> = {
  canary: {
    id: 'canary',
    label: 'Canari',
    rarity: 'common',
    effects: { goldPct: 0.05 },
    description: 'Il chante tant que l\'air est bon, et le mineur creuse plus content.',
  },
  mole: {
    id: 'mole',
    label: 'Taupe',
    rarity: 'common',
    effects: { strikePct: 0.03 },
    description: 'Elle attaque la roche par en dessous : chaque coup porte mieux.',
  },
  bat: {
    id: 'bat',
    label: 'Chauve-souris',
    rarity: 'rare',
    effects: { critChance: 0.015 },
    description: 'Son écho trouve les failles que l\'œil ne voit pas.',
  },
  firefly: {
    id: 'firefly',
    label: 'Luciole',
    rarity: 'rare',
    effects: { critDamage: 0.1 },
    description: 'Sa lumière tombe pile sur le point faible du filon.',
  },
  golem: {
    id: 'golem',
    label: 'Golem',
    rarity: 'epic',
    effects: { strikePct: 0.05, speed: 0.02 },
    description: 'Lent à se décider, mais il frappe avec toi.',
  },
  dragonling: {
    id: 'dragonling',
    label: 'Dragonnet de magma',
    rarity: 'legendary',
    effects: { strikePct: 0.06, blastPct: 0.15 },
    description: 'Il souffle sur la mèche : la dynamite part plus fort.',
  },
};

// ─── Œufs ──────────────────────────────────────────────────────────────────

/** L'onglet s'ouvre à la zone 3, avec un premier œuf commun offert. */
export const COMPANIONS_UNLOCK_ZONE = 3;

/** Rareté d'un œuf trouvé, en %. Affichée au joueur telle quelle. */
export const EGG_RARITY_WEIGHTS: Readonly<Record<Rarity, number>> = { common: 60, rare: 28, epic: 10, legendary: 2 };

/** Le légendaire est garanti au plus tard au 15e œuf sans légendaire (environ zone 17 pour un joueur régulier). */
export const LEGENDARY_PITY = 15;

/** Chance qu'un coffre enseveli (événement) ou le coffre des missions du jour contienne un œuf. */
export const CHEST_EGG_CHANCE = 0.02;

/** Éclosion : le minuteur continue jeu fermé. */
export const HATCH_MS: Readonly<Record<Rarity, number>> = {
  common: 60 * 60 * 1000,
  rare: 2 * 60 * 60 * 1000,
  epic: 4 * 60 * 60 * 1000,
  legendary: 8 * 60 * 60 * 1000,
};

// ─── Étoiles et niveaux ────────────────────────────────────────────────────

/** Chaque doublon ajoute une étoile (5 au plus), et chaque étoile au-delà de la première ajoute 25 % de l'effet de base. */
export const MAX_STARS = 5;
const STAR_STEP = 0.25;
/** Un doublon d'un compagnon déjà à 5 étoiles se change en éclats. */
export const STAR_OVERFLOW_SHARDS = 10;

/** Nourri de minerais, il monte jusqu'au niveau 10 ; chaque niveau au-delà du premier ajoute 5 % de l'effet de base. */
export const MAX_COMPANION_LEVEL = 10;
const LEVEL_STEP = 0.05;

/** Minerais pour passer du niveau `level` au suivant : 3 au niveau 1, puis 2 de plus à chaque niveau. */
export function feedCost(level: number): number {
  return 1 + 2 * level;
}

/** Multiplicateur de l'effet de base selon les étoiles et le niveau (×1 à 1 étoile niveau 1, ×2,9 au maximum). */
export function companionEffectMultiplier(stars: number, level: number): number {
  return (1 + STAR_STEP * (stars - 1)) * (1 + LEVEL_STEP * (level - 1));
}

// ─── Expéditions ───────────────────────────────────────────────────────────

/** Durées proposées, en heures. */
export const EXPEDITION_HOURS: readonly number[] = [1, 4, 8];

/**
 * Les expéditions rapportent des éclats et du minerai, jamais d'or : elles n'accélèrent pas la pioche.
 * 1 éclat par heure pour un commun, plus selon la rareté ; un minerai toutes les 2 heures.
 * Deux compagnons au plus partent en même temps : sinon toute la collection rapportait plus que l'absence.
 */
export const EXPEDITION_SLOTS = 2;
export const EXPEDITION_SHARDS_PER_HOUR = 1;
export const EXPEDITION_RARITY_BONUS: Readonly<Record<Rarity, number>> = { common: 1, rare: 1.25, epic: 1.5, legendary: 2 };
export const EXPEDITION_HOURS_PER_ORE = 2;
