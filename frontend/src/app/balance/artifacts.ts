// Équilibrage des artefacts : objets rares de la mine, porteurs de son histoire, équipés dans la 6e case.
import type { EvolutionId } from './balance';
import { BonusId, Rarity } from './skill-tree';

export const ARTIFACT_IDS = [
  'crackedLantern',
  'moleTooth',
  'rustyCompass',
  'minersFlask',
  'singingNugget',
  'firedampVial',
  'firstMinersNotebook',
  'geodeHeart',
  'lostForemansHelmet',
  'crystalHourglass',
  'magmaTear',
  'fallenStar',
  'dwarfKingsPickaxe',
] as const;
export type ArtifactId = (typeof ARTIFACT_IDS)[number];

export interface ArtifactDef {
  readonly id: ArtifactId;
  readonly label: string;
  readonly rarity: Rarity;
  /** Bonus au niveau 1. Chaque niveau suivant ajoute 25 % de cette valeur. */
  readonly effects: Readonly<Partial<Record<BonusId, number>>>;
  readonly lore: string;
}

/**
 * Un seul artefact porté à la fois : son effet doit compter sans tout écraser. Au niveau 5, le meilleur
 * légendaire donne environ ×1,4 de Puissance en fin de partie, autant qu'un niveau de pioche.
 */
export const ARTIFACTS: Readonly<Record<ArtifactId, ArtifactDef>> = {
  crackedLantern: {
    id: 'crackedLantern',
    label: 'Lanterne fêlée',
    rarity: 'common',
    effects: { goldPct: 0.08 },
    lore: 'Elle éclaire encore, mais seulement quand on ne la regarde pas.',
  },
  moleTooth: {
    id: 'moleTooth',
    label: 'Dent de taupe géante',
    rarity: 'common',
    effects: { strikePct: 0.05 },
    lore: 'Personne n\'a jamais vu la taupe. Seulement ses dents, plantées dans la roche la plus dure.',
  },
  rustyCompass: {
    id: 'rustyCompass',
    label: 'Boussole rouillée',
    rarity: 'common',
    effects: { critChance: 0.02 },
    lore: 'Elle n\'indique pas le nord : elle indique la faille la plus proche.',
  },
  minersFlask: {
    id: 'minersFlask',
    label: 'Gourde du mineur',
    rarity: 'common',
    effects: { speed: 0.06 },
    lore: 'Toujours à moitié pleine. Personne ne sait de quoi.',
  },
  singingNugget: {
    id: 'singingNugget',
    label: 'Pépite chantante',
    rarity: 'rare',
    effects: { speed: 0.1 },
    lore: 'Approchée de l\'oreille, elle fredonne une vieille berceuse naine. Le mineur frappe en rythme.',
  },
  firedampVial: {
    id: 'firedampVial',
    label: 'Fiole de grisou',
    rarity: 'rare',
    effects: { blastPct: 0.25 },
    lore: 'Étiquette à peine lisible : « Ne pas secouer. Surtout ne pas secouer. »',
  },
  firstMinersNotebook: {
    id: 'firstMinersNotebook',
    label: 'Carnet du premier mineur',
    rarity: 'rare',
    effects: { shardChance: 0.003 },
    lore: 'Des cartes de galeries qui n\'existent plus… ou pas encore.',
  },
  geodeHeart: {
    id: 'geodeHeart',
    label: 'Cœur de géode',
    rarity: 'epic',
    effects: { shardChance: 0.005, goldPct: 0.1 },
    lore: 'Il bat très lentement. Une fois par siècle, disent les anciens.',
  },
  lostForemansHelmet: {
    id: 'lostForemansHelmet',
    label: 'Casque du contremaître disparu',
    rarity: 'epic',
    effects: { critChance: 0.03, critDamage: 0.2 },
    lore: 'Sa lampe s\'allume toute seule devant les filons les plus riches. Son propriétaire, lui, n\'est jamais remonté.',
  },
  crystalHourglass: {
    id: 'crystalHourglass',
    label: 'Sablier de cristal',
    rarity: 'epic',
    effects: { cooldownPct: 0.12 },
    lore: 'Le sable y remonte au lieu de tomber. Le temps passe plus vite pour qui le porte.',
  },
  magmaTear: {
    id: 'magmaTear',
    label: 'Larme de magma',
    rarity: 'legendary',
    effects: { strikePct: 0.12, speed: 0.08 },
    lore: 'Une goutte du cœur du monde, encore tiède après mille ans.',
  },
  fallenStar: {
    id: 'fallenStar',
    label: 'Étoile tombée',
    rarity: 'legendary',
    effects: { goldPct: 0.2, shardChance: 0.005 },
    lore: 'Elle a percé toutes les couches de la mine pour finir ici. Elle brille encore.',
  },
  dwarfKingsPickaxe: {
    id: 'dwarfKingsPickaxe',
    label: 'Pioche du Roi Nain',
    rarity: 'legendary',
    effects: { strikePct: 0.15, critChance: 0.04 },
    lore: 'Le Roi Nain a creusé la première galerie avec elle. On dit qu\'elle reconnaît son nouveau maître.',
  },
};

/**
 * Découverte : un artefact garanti à chaque zone terminée, plus une petite chance à chaque coup
 * (environ un toutes les 2 h de jeu actif). Un joueur régulier en trouve 2 le premier jour, puis un tous les 2 à 3 jours.
 */
export const ARTIFACT_FIND_CHANCE = 1 / 30000;

/** Poids de tirage par rareté. Les légendaires sont rares, mais un doublon fait toujours progresser. */
export const ARTIFACT_RARITY_WEIGHTS: Readonly<Record<Rarity, number>> = {
  common: 55,
  rare: 30,
  epic: 12,
  legendary: 3,
};

/**
 * Un doublon fait monter l'artefact d'un niveau, jusqu'au niveau 5 (effet ×2). Au-delà, il donne un jeton de réforge
 * de cet artefact (depuis le 18/10/2026 ; c'était 10 éclats).
 */
export const ARTIFACT_MAX_LEVEL = 5;
export const ARTIFACT_LEVEL_STEP = 0.25;

export function artifactEffectMultiplier(level: number): number {
  return 1 + ARTIFACT_LEVEL_STEP * (Math.min(level, ARTIFACT_MAX_LEVEL) - 1);
}

// ─── Emplacements et réforge (Théo, 18/10/2026 ; voir docs/game-design/reliques.md) ───

/** Trois artefacts portés : le 1er dès le départ, le 2e au Contremaître, le 3e à la Légende de la mine. */
export const ARTIFACT_SLOT_COUNT = 3;
export const ARTIFACT_SLOT_FORMS: readonly EvolutionId[] = ['foreman', 'legend'];

/** Effet secondaire de réforge : son bonus et sa qualité. */
export interface ArtifactAffix {
  readonly bonus: BonusId;
  readonly rarity: Rarity;
}

/** Valeur de chaque effet secondaire, de la qualité Commune à Légendaire (mêmes unités que les autres bonus). */
export const AFFIX_VALUES: Readonly<Partial<Record<BonusId, readonly [number, number, number, number]>>> = {
  strikePct: [0.04, 0.06, 0.08, 0.1],
  goldPct: [0.06, 0.09, 0.12, 0.15],
  speed: [0.03, 0.05, 0.06, 0.08],
  critChance: [0.01, 0.015, 0.02, 0.03],
  critDamage: [0.08, 0.12, 0.16, 0.2],
  shardChance: [0.002, 0.003, 0.004, 0.005],
};

/** Chance de chaque qualité à la réforge. */
export const AFFIX_RARITY_WEIGHTS: Readonly<Record<Rarity, number>> = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 5,
};

/**
 * Prix d'une réforge : ce nombre de minerais dans chacun de 3 matériaux différents (ceux dont le joueur a le plus).
 * Chaque réforge du même artefact coûte 50 % de plus, jusqu'à 3 fois le prix de départ.
 */
export const REFORGE_ORE_KINDS = 3;
export const REFORGE_BASE_ORES = 30;
export const REFORGE_COST_GROWTH = 1.5;
export const REFORGE_MAX_COST_FACTOR = 3;

