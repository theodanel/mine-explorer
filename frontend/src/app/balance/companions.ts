// Équilibrage des compagnons : œufs, éclosion, étoiles, niveaux et expéditions.
// Fichier pur, simulé par tools/simulate.mts. Voir docs/game-design/idees-fun.md (idée 4, déblocage validé le 13/10/2026).
import { BonusId, Rarity, SpellEffect } from './skill-tree';

export const COMPANION_IDS = ['canary', 'mole', 'bat', 'firefly', 'golem', 'dragonling'] as const;
export type CompanionId = (typeof COMPANION_IDS)[number];

export interface CompanionDef {
  readonly id: CompanionId;
  readonly label: string;
  readonly rarity: Rarity;
  /** Bonus de base, à 1 étoile, quand il accompagne le mineur. */
  readonly effects: Readonly<Partial<Record<BonusId, number>>>;
  readonly description: string;
  /** Compétence unique, lancée comme un sort depuis la barre de sorts quand il accompagne le mineur. */
  readonly ability: CompanionAbility;
}

/**
 * Compétence d'un familier (demande de Théo, 16/10/2026) : un effet de sort à lui, avec sa recharge. Les étoiles la
 * renforcent : une explosion frappe plus fort, un effet dure plus longtemps.
 */
export interface CompanionAbility {
  readonly label: string;
  readonly summary: string;
  readonly cooldownMs: number;
  /** 0 pour un coup unique. */
  readonly durationMs: number;
  readonly effect: SpellEffect;
}

const SECOND = 1000;
/** Chaque étoile au-delà de la première allonge l'effet d'une seconde. */
export const ABILITY_SECONDS_PER_STAR = 1;

/**
 * Un seul compagnon accompagne le mineur : son bonus forme une famille à part, multipliée aux autres.
 * Les autres partent en expédition. Budget simulé : environ ×1,15 de Puissance au jour 49.
 * L'effet de base est celui d'un compagnon à 1 étoile.
 */
export const COMPANIONS: Readonly<Record<CompanionId, CompanionDef>> = {
  canary: {
    id: 'canary',
    label: 'Canari',
    rarity: 'common',
    effects: { goldPct: 0.05 },
    description: 'Il chante tant que l\'air est bon, et le mineur creuse plus content.',
    ability: {
      label: 'Chant de prospecteur',
      summary: "Le canari chante : chaque coup rapporte deux fois plus d'or pendant quelques secondes.",
      cooldownMs: 60 * SECOND,
      durationMs: 8 * SECOND,
      effect: { kind: 'gold', multiplier: 2 },
    },
  },
  mole: {
    id: 'mole',
    label: 'Taupe',
    rarity: 'common',
    effects: { strikePct: 0.03 },
    description: 'Elle attaque la roche par en dessous : chaque coup porte mieux.',
    ability: {
      label: 'Galerie souterraine',
      summary: 'La taupe sape le filon par en dessous : un coup de 6 fois la Frappe.',
      cooldownMs: 40 * SECOND,
      durationMs: 0,
      effect: { kind: 'blast', strike: 6, strikePerRank: 0 },
    },
  },
  bat: {
    id: 'bat',
    label: 'Chauve-souris',
    rarity: 'rare',
    effects: { critChance: 0.015 },
    description: 'Son écho trouve les failles que l\'œil ne voit pas.',
    ability: {
      label: 'Écholocation',
      summary: 'Son cri révèle chaque faille : tous les coups sont critiques pendant quelques secondes.',
      cooldownMs: 50 * SECOND,
      durationMs: 5 * SECOND,
      effect: { kind: 'crit' },
    },
  },
  firefly: {
    id: 'firefly',
    label: 'Luciole',
    rarity: 'rare',
    effects: { critDamage: 0.1 },
    description: 'Sa lumière tombe pile sur le point faible du filon.',
    ability: {
      label: 'Nuée lumineuse',
      summary: 'La luciole éclaire les géodes : chaque coup peut faire tomber un éclat, pendant quelques secondes.',
      cooldownMs: 60 * SECOND,
      durationMs: 8 * SECOND,
      effect: { kind: 'shard', chance: 0.2, chancePerRank: 0 },
    },
  },
  golem: {
    id: 'golem',
    label: 'Golem',
    rarity: 'epic',
    effects: { strikePct: 0.05, speed: 0.02 },
    description: 'Lent à se décider, mais il frappe avec toi.',
    ability: {
      label: 'Poing de pierre',
      summary: 'Le golem abat son poing sur le filon : un coup de 15 fois la Frappe.',
      cooldownMs: 60 * SECOND,
      durationMs: 0,
      effect: { kind: 'blast', strike: 15, strikePerRank: 0 },
    },
  },
  dragonling: {
    id: 'dragonling',
    label: 'Dragonnet de magma',
    rarity: 'legendary',
    effects: { strikePct: 0.06, blastPct: 0.15 },
    description: 'Il souffle sur la mèche : la dynamite part plus fort.',
    ability: {
      label: 'Souffle de magma',
      summary: 'Le dragonnet crache sa lave : le mineur frappe deux fois plus vite pendant quelques secondes.',
      cooldownMs: 50 * SECOND,
      durationMs: 7 * SECOND,
      effect: { kind: 'speed', amount: 1 },
    },
  },
};

// ─── Œufs ──────────────────────────────────────────────────────────────────

/** L'onglet s'ouvre à la zone 3, avec un premier œuf commun offert. Les suivants : Défi, zones terminées, loterie. */
export const COMPANIONS_UNLOCK_ZONE = 3;

/**
 * Chaque zone terminée une fois l'onglet ouvert (de la zone 3 à la suite) donne un œuf commun : avancer dans la
 * mine fait grandir la collection, sans dépendre du seul Défi. Le 14/10/2026, Théo, en zone 7, ne savait pas
 * comment gagner des compagnons : le Défi, caché dans l'onglet, était la seule source.
 */
export function zoneClearGivesEgg(clearedZone: number): boolean {
  return clearedZone >= COMPANIONS_UNLOCK_ZONE;
}

/** Rareté d'un œuf trouvé, en %. Affichée au joueur telle quelle. */
export const EGG_RARITY_WEIGHTS: Readonly<Record<Rarity, number>> = { common: 60, rare: 28, epic: 10, legendary: 2 };

/** Le légendaire est garanti au plus tard au 15e œuf sans légendaire. */
export const LEGENDARY_PITY = 15;

/** Éclosion : le minuteur continue jeu fermé. */
export const HATCH_MS: Readonly<Record<Rarity, number>> = {
  common: 60 * 60 * 1000,
  rare: 2 * 60 * 60 * 1000,
  epic: 4 * 60 * 60 * 1000,
  legendary: 8 * 60 * 60 * 1000,
};

// ─── Étoiles et pierres d'éveil ──────────────────────────────────────────────

/**
 * Améliorer un compagnon, c'est monter son étoile, de 1 à 5, avec des pierres d'éveil.
 * Chaque étoile au-delà de la première ajoute 50 % de l'effet de base : ×3 à 5 étoiles.
 */
export const MAX_STARS = 5;
const STAR_STEP = 0.5;

/** Pierres pour passer de l'étoile `stars` à la suivante : 10, 25, 50, puis 100 (185 pour aller de 1 à 5). */
const STAR_COSTS: readonly number[] = [10, 25, 50, 100];

export function starCost(stars: number): number | null {
  return STAR_COSTS[stars - 1] ?? null;
}

/** Un doublon se change en pierres d'éveil, d'autant plus que le compagnon est rare. */
export const DUPLICATE_STONES: Readonly<Record<Rarity, number>> = { common: 3, rare: 6, epic: 12, legendary: 25 };

/** Les anciennes sauvegardes avaient des niveaux payés en minerai : 2 pierres rendues par niveau au-delà du premier. */
export const LEGACY_STONES_PER_LEVEL = 2;

/** Multiplicateur de l'effet de base selon les étoiles (×1 à 1 étoile, ×3 à 5). */
export function companionEffectMultiplier(stars: number): number {
  return 1 + STAR_STEP * (stars - 1);
}

// ─── Expéditions ───────────────────────────────────────────────────────────

/** Durées proposées, en heures. */
export const EXPEDITION_HOURS: readonly number[] = [1, 4, 8];

/**
 * Les expéditions rapportent des éclats et des pierres d'éveil, jamais d'or : elles n'accélèrent pas la pioche.
 * Par heure : 1 éclat pour un commun, et une pierre toutes les 4 heures, plus selon la rareté.
 * Deux compagnons au plus partent en même temps : sinon toute la collection rapportait plus que l'absence.
 */
export const EXPEDITION_SLOTS = 2;
/** Butin par heure d'expédition (3 éclats et 0,5 pierre depuis le 14/10/2026, 1 et 0,25 avant : trop maigre). */
export const EXPEDITION_SHARDS_PER_HOUR = 3;
export const EXPEDITION_STONES_PER_HOUR = 0.5;
export const EXPEDITION_RARITY_BONUS: Readonly<Record<Rarity, number>> = { common: 1, rare: 1.25, epic: 1.5, legendary: 2 };
