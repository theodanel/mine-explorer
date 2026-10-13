// Équilibrage des artefacts : objets rares de la mine, porteurs de son histoire, équipés dans la 6e case.
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

/** Un doublon fait monter l'artefact d'un niveau, jusqu'au niveau 5 (effet ×2). Au-delà, il se change en éclats. */
export const ARTIFACT_MAX_LEVEL = 5;
export const ARTIFACT_LEVEL_STEP = 0.25;
export const ARTIFACT_OVERFLOW_SHARDS = 10;

export function artifactEffectMultiplier(level: number): number {
  return 1 + ARTIFACT_LEVEL_STEP * (Math.min(level, ARTIFACT_MAX_LEVEL) - 1);
}
