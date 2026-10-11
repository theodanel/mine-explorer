// Tout l'équilibrage du jeu au même endroit : chiffres, tables et formules.
// Fichier pur (aucune dépendance Angular) pour être testé, simulé en ligne de commande et porté côté Spring.
// Le document docs/equilibrage.md explique ces choix et la courbe de progression attendue.
import type { MiningStats, SlotId, StatId, TierId } from '../equipment/equipment.model';

// ─── Mineur ────────────────────────────────────────────────────────────────

/** Stats du mineur sans équipement. critDamage est le bonus du critique : 0.5 → coup ×1,5. */
export const BASE_STATS: Readonly<MiningStats> = {
  strikePower: 5,
  miningSpeed: 0,
  critChance: 0.05,
  critDamage: 0.5,
  goldBonus: 0,
};

/** Coups par seconde sans bonus de vitesse : l'animation a 23 frames jouées à 12 fps. */
export const BASE_HITS_PER_SECOND = 12 / 23;

/** Plafonds : au-delà, l'animation devient illisible et les chances n'ont plus de sens. */
export const STAT_CAPS: Readonly<Partial<MiningStats>> = { miningSpeed: 2, critChance: 1 };

// ─── Paliers de matériaux ──────────────────────────────────────────────────

/** Ordre des paliers, du plus faible au plus fort. Le libellé et la couleur sont dans equipment.model. */
export const TIER_ORDER: readonly TierId[] = [
  'wood',
  'stone',
  'copper',
  'iron',
  'steel',
  'gold',
  'mithril',
  'crystal',
  'magma',
  'divine',
];

/**
 * Chaque palier multiplie la stat principale. La Frappe grimpe vite pour suivre les PV des rochers ;
 * les pourcentages grimpent lentement, sinon ils se multiplient entre eux et la Puissance explose.
 */
const STRIKE_TIER_GROWTH = 1.6;
const PERCENT_TIER_GROWTH = 1.2;

export function tierIndex(tier: TierId): number {
  return TIER_ORDER.indexOf(tier);
}

/** Stats secondaires selon le palier : aucune en Bois-Pierre-Cuivre, jusqu'à 3 en Divin. */
export function secondaryStatCount(tier: TierId): number {
  const index = tierIndex(tier);
  return index === TIER_ORDER.length - 1 ? 3 : Math.floor(index / 3);
}

// ─── Objets ────────────────────────────────────────────────────────────────

/** Valeur de la stat principale d'un objet en Bois de niveau 1. */
export const MAIN_STAT_BASE: Readonly<MiningStats> = {
  strikePower: 4,
  miningSpeed: 0.05,
  critChance: 0.03,
  critDamage: 0.15,
  goldBonus: 0.08,
};

/** Les stats secondaires valent moitié moins que la stat principale. */
export const SECONDARY_STAT_RATIO = 0.5;

/** Croissance par niveau d'objet (le niveau de l'objet est celui de la pioche qui l'a forgé). */
const STRIKE_LEVEL_GROWTH = 1.1;
const PERCENT_LEVEL_GROWTH = 1.01;

/** Variation aléatoire autour de la valeur attendue : de −10 % à +10 %. */
export const STAT_ROLL_SPREAD = 0.1;

export function expectedStatValue(stat: StatId, tier: TierId, level: number, ratio = 1): number {
  const isStrike = stat === 'strikePower';
  const tierGrowth = (isStrike ? STRIKE_TIER_GROWTH : PERCENT_TIER_GROWTH) ** tierIndex(tier);
  const levelGrowth = (isStrike ? STRIKE_LEVEL_GROWTH : PERCENT_LEVEL_GROWTH) ** (level - 1);
  return MAIN_STAT_BASE[stat] * tierGrowth * levelGrowth * ratio;
}

/** Vente : 5 pièces pour du Bois niveau 1, ×2 par palier, +8 % par niveau. */
const BASE_SELL_PRICE = 5;
const SELL_TIER_GROWTH = 2;
const SELL_LEVEL_GROWTH = 1.08;

export function sellPriceFor(tier: TierId, level: number): number {
  return Math.round(BASE_SELL_PRICE * SELL_TIER_GROWTH ** tierIndex(tier) * SELL_LEVEL_GROWTH ** (level - 1));
}

// ─── Pioche (Forge) ────────────────────────────────────────────────────────

/** Un tirage à la Forge coûte des éclats, quel que soit le niveau de la pioche. */
export const FORGE_SHARD_COST = 2;

export const MAX_PICKAXE_LEVEL = 30;
/** Comme dans Forge Master : chaque paiement remplit un segment, 10 segments font un niveau. */
export const SEGMENTS_PER_LEVEL = 10;

/**
 * Le coût grandit plus vite que la Puissance (×1,26 par niveau en moyenne) : sinon le revenu,
 * qui suit les dégâts, rattraperait toujours le prix et le temps par niveau resterait plat.
 */
const SEGMENT_BASE_COST = 15;
const SEGMENT_COST_GROWTH = 1.7;

/** Prix en or d'un segment au niveau donné, ou null au niveau maximum. */
export function segmentCost(pickaxeLevel: number): number | null {
  if (pickaxeLevel >= MAX_PICKAXE_LEVEL) {
    return null;
  }
  return Math.round(SEGMENT_BASE_COST * SEGMENT_COST_GROWTH ** (pickaxeLevel - 1));
}

/**
 * Une fois les 10 segments payés, la pioche met du temps à passer au niveau suivant, comme dans Forge Master.
 * C'est le vrai régulateur du rythme : il ne dépend ni du temps de jeu ni de l'efficacité du joueur,
 * et le minuteur continue quand le jeu est fermé. 2 min pour le niveau 2, ×1,36 à chaque niveau :
 * environ 1 h 30 cumulées pour le niveau 10, 7 h pour le 15, 1,3 jour pour le 20, 29 jours pour le 30.
 */
const UPGRADE_BASE_MS = 2 * 60 * 1000;
const UPGRADE_TIME_GROWTH = 1.36;

/** Durée de l'amélioration qui fait passer la pioche du niveau donné au suivant. */
export function upgradeDurationMs(pickaxeLevel: number): number {
  return Math.round(UPGRADE_BASE_MS * UPGRADE_TIME_GROWTH ** (pickaxeLevel - 1));
}

/**
 * Fenêtre glissante de chances : tous les 3 niveaux, le palier de base monte d'un cran.
 * Chaque motif liste les chances du palier précédent, du palier de base et des deux suivants.
 * Les paliers supérieurs arrivent par petites touches, et l'ancien palier s'efface sur 3 niveaux.
 */
const TIER_WINDOW_PATTERNS: readonly (readonly [number, number, number, number])[] = [
  [25, 70, 5, 0],
  [10, 78, 11.5, 0.5],
  [3, 72, 23, 2],
];
const LEVELS_PER_TIER_STEP = TIER_WINDOW_PATTERNS.length;

/** Chances de chaque palier en %, au niveau de pioche donné. Affichées au joueur telles quelles. */
export function tierChances(pickaxeLevel: number): Readonly<Record<TierId, number>> {
  const level = Math.min(Math.max(Math.floor(pickaxeLevel), 1), MAX_PICKAXE_LEVEL);
  const chances = Object.fromEntries(TIER_ORDER.map((tier) => [tier, 0])) as Record<TierId, number>;
  // La toute première pioche ne forge que du Bois : le joueur découvre les paliers en l'améliorant
  if (level === 1) {
    chances[TIER_ORDER[0]] = 100;
    return chances;
  }
  const baseTier = Math.floor((level - 1) / LEVELS_PER_TIER_STEP);
  const pattern = TIER_WINDOW_PATTERNS[(level - 1) % LEVELS_PER_TIER_STEP];
  pattern.forEach((chance, offset) => {
    // offset 0 = palier précédent. Aux extrémités, ce qui sortirait de la liste revient au palier le plus proche.
    const index = Math.min(Math.max(baseTier + offset - 1, 0), TIER_ORDER.length - 1);
    const tier = TIER_ORDER[index];
    chances[tier] = Math.round((chances[tier] + chance) * 10) / 10;
  });
  return chances;
}

// ─── Mine ──────────────────────────────────────────────────────────────────

/**
 * Chaque zone compte 15 étapes (1-1 à 1-15, puis 2-1…), une par rocher. Pas de boss ni de chrono :
 * chaque rocher a un peu plus de PV que le précédent, et le joueur trop faible avance simplement plus lentement.
 */
export const STAGES_PER_ZONE = 15;

const BASE_ROCK_HP = 320;
/** +9 % de PV par rocher, soit ×3,6 par zone : environ 4 à 5 niveaux de pioche par zone. */
const ROCK_HP_GROWTH = 1.09;

/** 1 PV miné rapporte un quart de pièce (avant le bonus d'or). */
const GOLD_PER_DAMAGE = 0.25;

/** Les éclats viennent surtout des missions : la fin d'une zone n'en donne qu'un petit lot. */
export const ZONE_CLEAR_SHARDS = 5;

export function stageIndex(zone: number, stage: number): number {
  return (zone - 1) * STAGES_PER_ZONE + (stage - 1);
}

export function rockHp(zone: number, stage: number): number {
  return Math.round(BASE_ROCK_HP * ROCK_HP_GROWTH ** stageIndex(zone, stage));
}

export function goldForDamage(damage: number, goldBonus: number): number {
  return Math.round(damage * GOLD_PER_DAMAGE * (1 + goldBonus));
}

// ─── Minerais et évolutions ────────────────────────────────────────────────

/** Chaque zone donne le minerai de son décor : Bois en zone 1, Pierre en zone 2… Divin à partir de la zone 10. */
export function zoneMaterial(zone: number): TierId {
  return TIER_ORDER[Math.min(Math.max(zone, 1), TIER_ORDER.length) - 1];
}

/** Minerai gagné à chaque rocher cassé, et lot offert quand la zone est terminée. */
export const ORE_PER_ROCK = 1;
export const ZONE_CLEAR_ORES = 20;

export type EvolutionId = 'apprentice' | 'miner' | 'foreman' | 'master' | 'legend';

export interface EvolutionForm {
  readonly id: EvolutionId;
  readonly label: string;
  /** Zone à atteindre pour pouvoir évoluer vers cette forme. */
  readonly minZone: number;
  /** Minerais à dépenser. Une zone traversée en donne 35 (15 rochers + 20 à la fin) : le coût tient en un passage. */
  readonly ores: Readonly<Partial<Record<TierId, number>>>;
  readonly gold: number;
  /** Bonus de Frappe de cette forme, cumulé avec les précédentes. */
  readonly strikeBonus: number;
}

/**
 * Formes du mineur, de la première à la dernière. Chacune demande d'avoir atteint une zone,
 * les minerais des zones traversées et de l'or, et donne +25 % de Frappe (cumulés).
 */
export const EVOLUTION_FORMS: readonly EvolutionForm[] = [
  { id: 'apprentice', label: 'Apprenti', minZone: 1, ores: {}, gold: 0, strikeBonus: 0 },
  { id: 'miner', label: 'Mineur', minZone: 5, ores: { stone: 30, copper: 30, iron: 30 }, gold: 20_000, strikeBonus: 0.25 },
  { id: 'foreman', label: 'Contremaître', minZone: 7, ores: { steel: 30, gold: 30 }, gold: 1_000_000, strikeBonus: 0.25 },
  { id: 'master', label: 'Maître des profondeurs', minZone: 9, ores: { mithril: 30, crystal: 30 }, gold: 10_000_000, strikeBonus: 0.25 },
  { id: 'legend', label: 'Légende de la mine', minZone: 11, ores: { magma: 30, divine: 30 }, gold: 300_000_000, strikeBonus: 0.25 },
];

/** Multiplicateur de Frappe cumulé jusqu'à la forme d'index donné. */
export function evolutionStrikeMultiplier(formIndex: number): number {
  return EVOLUTION_FORMS.slice(0, formIndex + 1).reduce((total, form) => total * (1 + form.strikeBonus), 1);
}

// ─── Hors ligne ────────────────────────────────────────────────────────────

/** Les gains hors ligne s'arrêtent après 4 h, comme dans Forge Master : il faut revenir pour en profiter. */
export const OFFLINE_CAP_MS = 4 * 60 * 60 * 1000;
/** Hors ligne, le mineur rapporte moitié moins qu'en jeu. */
export const OFFLINE_EFFICIENCY = 0.5;
/** En dessous, l'absence est trop courte pour mériter un message. */
export const OFFLINE_MIN_MS = 60 * 1000;

export interface OfflineGains {
  /** Absence prise en compte, après plafond. */
  readonly creditedMs: number;
  readonly gold: number;
}

/** Or d'une absence, plafonnée à 4 h et à moitié prix. Les étapes et les missions n'avancent qu'en jeu. */
export function offlineGains(stats: MiningStats, elapsedMs: number): OfflineGains {
  const creditedMs = Math.min(Math.max(elapsedMs, 0), OFFLINE_CAP_MS);
  const seconds = creditedMs / 1000;
  return {
    creditedMs,
    gold: goldForDamage(damagePerSecond(stats) * seconds * OFFLINE_EFFICIENCY, stats.goldBonus),
  };
}

// ─── Combat et Puissance ───────────────────────────────────────────────────

/** La Puissance est le DPS × 100 : un seul chiffre, assez fin pour qu'un petit bonus se voie. */
const POWER_PER_DPS = 100;

export function hitsPerSecond(stats: MiningStats): number {
  return BASE_HITS_PER_SECOND * (1 + stats.miningSpeed);
}

/** Dégâts moyens d'un coup, critiques compris. */
export function averageHitDamage(stats: MiningStats): number {
  return stats.strikePower * (1 + stats.critChance * stats.critDamage);
}

export function damagePerSecond(stats: MiningStats): number {
  return averageHitDamage(stats) * hitsPerSecond(stats);
}

export function powerOf(stats: MiningStats): number {
  return Math.round(damagePerSecond(stats) * POWER_PER_DPS);
}

/**
 * Temps visé pour casser un rocher : 1 minute en zone 1, puis 50 % de plus à chaque zone,
 * au rythme de la pioche. Au-delà, le joueur sent qu'il doit s'améliorer.
 */
const STAGE_TARGET_BASE_SECONDS = 60;
const STAGE_TARGET_GROWTH = 1.5;

export function stageTargetSeconds(zone: number): number {
  return STAGE_TARGET_BASE_SECONDS * STAGE_TARGET_GROWTH ** (zone - 1);
}

/** Puissance qui casse le rocher de l'étape dans le temps visé. En dessous, ça marche quand même, mais plus lentement. */
export function recommendedPower(zone: number, stage: number): number {
  return Math.ceil((rockHp(zone, stage) / stageTargetSeconds(zone)) * POWER_PER_DPS);
}

/** Secondes pour miner les PV restants à cette Puissance. */
export function secondsToMine(remainingHp: number, power: number): number {
  return (remainingHp / power) * POWER_PER_DPS;
}

// ─── Courbe attendue (pour le document d'équilibrage et les tests) ───────────

/**
 * Stats d'un joueur moyen avec la pioche au niveau donné : un objet par emplacement,
 * du palier moyen de la table et du niveau de la pioche, sans stats secondaires.
 */
export function expectedStatsAtPickaxe(level: number, slotMainStats: Readonly<Record<SlotId, StatId>>): MiningStats {
  const chances = tierChances(level);
  const stats: MiningStats = { ...BASE_STATS };
  for (const stat of Object.values(slotMainStats)) {
    stats[stat] += TIER_ORDER.reduce(
      (sum, tier) => sum + (chances[tier] / 100) * expectedStatValue(stat, tier, level),
      0,
    );
  }
  return stats;
}
