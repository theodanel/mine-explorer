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

/**
 * Vente : comme dans Legend of Mushroom, vendre doit compter. Le prix grandit un peu moins vite que les segments
 * de pioche (×1,66 par niveau contre ×2,065) : une vente vaut environ 5 % d'un segment au niveau 10, 0,5 % au niveau 20
 * et 0,07 % au niveau 29. Généreux au début, les ventes font environ 18 % de l'or d'une partie (simulation).
 * À ×1,73, elles en faisaient la moitié et écrasaient le minage.
 * Un objet d'un palier au-dessus de la base de son niveau vaut 50 % de plus, un palier en dessous un tiers de moins.
 */
const BASE_SELL_PRICE = 5;
const SELL_LEVEL_GROWTH = 1.66;
const SELL_TIER_STEP = 1.5;

export function sellPriceFor(tier: TierId, level: number): number {
  const tierGap = tierIndex(tier) - baseTierIndex(level);
  return Math.round(BASE_SELL_PRICE * SELL_LEVEL_GROWTH ** (level - 1) * SELL_TIER_STEP ** tierGap);
}

// ─── Pioche (Forge) ────────────────────────────────────────────────────────

/** Un tirage à la Forge coûte des éclats, quel que soit le niveau de la pioche. */
export const FORGE_SHARD_COST = 2;

export const MAX_PICKAXE_LEVEL = 30;
/** Comme dans Forge Master : chaque paiement remplit un segment, 10 segments font un niveau. */
export const SEGMENTS_PER_LEVEL = 10;

/**
 * L'or est le vrai régulateur du rythme. Le coût est multiplié par 2,065 à chaque niveau alors que la Puissance,
 * donc le revenu, grandit d'environ ×1,4 : chaque niveau demande un peu plus de temps que le précédent, le mur
 * classique des jeux idle (coûts exponentiels, production plus lente). Résultat simulé pour un joueur qui joue 1 h
 * par jour, avec tous les systèmes (arbre, sorts, artefacts, Atelier, événements, galeries, compagnons, évolution
 * par objectifs ; moyenne de 5 tirages) : niveau 10 le premier jour, 20 vers le jour 8, 25 vers le jour 19,
 * 30 vers le jour 49. Ce chiffre est très sensible : ×2 donnait le niveau 30 au jour 35 ; ×2,05 au jour 43 une fois
 * les éclats rendus plus faciles (deux fois plus de forges, donc plus de ventes et de meilleurs objets).
 */
const SEGMENT_BASE_COST = 15;
const SEGMENT_COST_GROWTH = 2.065;

/** Prix en or d'un segment au niveau donné, ou null au niveau maximum. */
export function segmentCost(pickaxeLevel: number): number | null {
  if (pickaxeLevel >= MAX_PICKAXE_LEVEL) {
    return null;
  }
  return Math.round(SEGMENT_BASE_COST * SEGMENT_COST_GROWTH ** (pickaxeLevel - 1));
}

/**
 * Une fois les 10 segments payés, la pioche met du temps à passer au niveau suivant, comme dans Forge Master.
 * Le minuteur crée l'attente et continue jeu fermé, mais il reste court : quand il durait des jours, l'or
 * s'entassait sans usage pendant que le joueur attendait. 1 min pour le niveau 2, ×1,25 à chaque niveau :
 * 1 h 30 pour passer au 20, 8 h 30 pour passer au 30, moins de 2 jours cumulés en tout.
 */
const UPGRADE_BASE_MS = 60 * 1000;
const UPGRADE_TIME_GROWTH = 1.25;

/** Durée de l'amélioration qui fait passer la pioche du niveau donné au suivant. */
export function upgradeDurationMs(pickaxeLevel: number): number {
  return Math.round(UPGRADE_BASE_MS * UPGRADE_TIME_GROWTH ** (pickaxeLevel - 1));
}

/**
 * Fenêtre glissante de chances : tous les 3 niveaux, le palier de base monte d'un cran.
 * Chaque motif liste les chances du palier précédent, du palier de base et du suivant.
 * Le palier suivant arrive par petites touches (3 %, 8 %, 16 %) et l'ancien s'efface sur 3 niveaux.
 * Pas de palier « deux crans au-dessus » : il donnait du Fer dès le niveau 5, beaucoup trop tôt.
 */
const TIER_WINDOW_PATTERNS: readonly (readonly [number, number, number])[] = [
  [25, 72, 3],
  [12, 80, 8],
  [4, 80, 16],
];
const LEVELS_PER_TIER_STEP = TIER_WINDOW_PATTERNS.length;

/** Palier le plus probable au niveau de pioche donné (Bois au niveau 1). */
function baseTierIndex(pickaxeLevel: number): number {
  return Math.floor((Math.max(pickaxeLevel, 1) - 1) / LEVELS_PER_TIER_STEP);
}

/** Chances de chaque palier en %, au niveau de pioche donné. Affichées au joueur telles quelles. */
export function tierChances(pickaxeLevel: number): Readonly<Record<TierId, number>> {
  const level = Math.min(Math.max(Math.floor(pickaxeLevel), 1), MAX_PICKAXE_LEVEL);
  const chances = Object.fromEntries(TIER_ORDER.map((tier) => [tier, 0])) as Record<TierId, number>;
  // La toute première pioche ne forge que du Bois : le joueur découvre les paliers en l'améliorant
  if (level === 1) {
    chances[TIER_ORDER[0]] = 100;
    return chances;
  }
  const baseTier = baseTierIndex(level);
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
 * Chaque zone compte 15 filons (1-1 à 1-15, puis 2-1…), un filon par rocher à épuiser. Pas de boss ni de chrono :
 * chaque filon a un peu plus de PV que le précédent, et le joueur trop faible avance simplement plus lentement.
 */
export const STAGES_PER_ZONE = 15;

const BASE_ROCK_HP = 320;
/**
 * +7,3 % de PV par filon, soit ×2,9 par zone, à peu près ce que gagne la Puissance en 2 à 3 niveaux de pioche.
 * À +9 % (×3,6 par zone), les filons duraient 45 minutes dès la zone 11 et la partie butait en zone 12.
 */
const ROCK_HP_GROWTH = 1.073;

/** 1 PV miné rapporte un quart de pièce (avant le bonus d'or). */
const GOLD_PER_DAMAGE = 0.25;

/**
 * Les éclats viennent de deux sources en jouant. Théo les trouvait trop rares : le 13/10/2026, coups, filons
 * et absence en donnent 50 % de plus, soit environ 200 forges par jour pour le joueur régulier, à tout moment.
 * 1. Chaque coup peut en déterrer un : un débit régulier qui ne dépend pas de la zone. 3 % par coup, soit
 *    environ 56 éclats par heure sans bonus de Vitesse, une forge toutes les 2 minutes même en profondeur,
 *    où les filons durent longtemps.
 * 2. Chaque filon épuisé en donne. Comme dans Legends of Mushroom, le début arrose : les 5 premiers filons
 *    donnent de quoi forger deux fois chacun (les 5 emplacements remplis en une minute), puis un tirage par filon.
 * Les missions, les fins de zone, l'absence, les événements, les objectifs d'évolution et le Défi de la mine complètent.
 */
export const SHARD_FIND_CHANCE = 0.03;
const WELCOME_STAGES = 5;
const WELCOME_SHARDS = 4;
const STAGE_SHARDS = 2;
export const ZONE_CLEAR_SHARDS = 5;

/** Éclats gagnés en épuisant le filon `stage` de la zone `zone`. */
export function shardsForStage(zone: number, stage: number): number {
  return zone === 1 && stage <= WELCOME_STAGES ? WELCOME_SHARDS : STAGE_SHARDS;
}

export function stageIndex(zone: number, stage: number): number {
  return (zone - 1) * STAGES_PER_ZONE + (stage - 1);
}

/**
 * Les premiers filons sont tendres pour que le joueur avance tout de suite : le 1-1 n'a que 10 % des PV
 * de la courbe (une dizaine de secondes sans équipement), et l'écart se referme jusqu'au 1-15.
 */
const FIRST_ROCK_HP_FACTOR = 0.1;
const SOFT_START_LAST_INDEX = STAGES_PER_ZONE - 1;

function softStartFactor(index: number): number {
  if (index >= SOFT_START_LAST_INDEX) {
    return 1;
  }
  return FIRST_ROCK_HP_FACTOR ** (1 - index / SOFT_START_LAST_INDEX);
}

export function rockHp(zone: number, stage: number): number {
  const index = stageIndex(zone, stage);
  return Math.round(BASE_ROCK_HP * ROCK_HP_GROWTH ** index * softStartFactor(index));
}

export function goldForDamage(damage: number, goldBonus: number): number {
  return Math.round(damage * GOLD_PER_DAMAGE * (1 + goldBonus));
}

// ─── Minerais et évolutions ────────────────────────────────────────────────

/**
 * Chaque zone donne le minerai de son décor : Pierre en zone 2, Cuivre en zone 3… Divin à partir de la zone 10.
 * La zone 1 (Bois) n'en donne pas : le bois n'est pas un minerai.
 */
export function zoneMaterial(zone: number): TierId | null {
  if (zone <= 1) {
    return null;
  }
  return TIER_ORDER[Math.min(zone, TIER_ORDER.length) - 1];
}

/** Minerai gagné à chaque filon épuisé, et lot offert quand la zone est terminée. */
export const ORE_PER_ROCK = 1;
export const ZONE_CLEAR_ORES = 20;

export type EvolutionId = 'apprentice' | 'miner' | 'foreman' | 'master' | 'legend';

/** Ce qu'un objectif d'évolution mesure : une jauge de progression ou un compteur de toute la partie. */
export type EvolutionMetric = 'zone' | 'pickaxeLevel' | 'itemsForged' | 'eventsTouched';

export interface EvolutionObjective {
  readonly metric: EvolutionMetric;
  readonly target: number;
  /** Éclats offerts dès que l'objectif est rempli. */
  readonly shards: number;
}

export interface EvolutionForm {
  readonly id: EvolutionId;
  readonly label: string;
  /** Objectifs à remplir pour passer à cette forme, façon « Adventure Rank » de Legend of Mushroom. */
  readonly objectives: readonly EvolutionObjective[];
  /** Bonus de Frappe de cette forme, cumulé avec les précédentes. */
  readonly strikeBonus: number;
}

/**
 * Formes du mineur, de la première à la dernière. Chacune se gagne en remplissant des objectifs (zone atteinte,
 * niveau de pioche, objets forgés, événements de mine touchés), sans rien payer : le joueur évolue parce qu'il a joué.
 * Chacune donne +50 % de Frappe, multipliés entre eux (×5 en Légende) : les paliers multiplicateurs des jeux idle.
 * Les objectifs sont calés sur ce que le joueur régulier a fait quand il évoluait avec l'ancien coût en or et minerais
 * (Mineur jour 3, Contremaître jour 6, Maître jour 10, Légende jour 21), un peu en dessous pour récompenser l'assidu.
 */
export const EVOLUTION_FORMS: readonly EvolutionForm[] = [
  { id: 'apprentice', label: 'Apprenti', objectives: [], strikeBonus: 0 },
  {
    id: 'miner',
    label: 'Mineur',
    objectives: [
      { metric: 'zone', target: 5, shards: 10 },
      { metric: 'pickaxeLevel', target: 10, shards: 10 },
      { metric: 'itemsForged', target: 350, shards: 10 },
      { metric: 'eventsTouched', target: 15, shards: 10 },
    ],
    strikeBonus: 0.5,
  },
  {
    id: 'foreman',
    label: 'Contremaître',
    objectives: [
      { metric: 'zone', target: 7, shards: 20 },
      { metric: 'pickaxeLevel', target: 16, shards: 20 },
      { metric: 'itemsForged', target: 1000, shards: 20 },
      { metric: 'eventsTouched', target: 50, shards: 20 },
    ],
    strikeBonus: 0.5,
  },
  {
    id: 'master',
    label: 'Maître des profondeurs',
    objectives: [
      { metric: 'zone', target: 9, shards: 30 },
      { metric: 'pickaxeLevel', target: 20, shards: 30 },
      { metric: 'itemsForged', target: 1900, shards: 30 },
      { metric: 'eventsTouched', target: 110, shards: 30 },
    ],
    strikeBonus: 0.5,
  },
  {
    id: 'legend',
    label: 'Légende de la mine',
    objectives: [
      { metric: 'zone', target: 12, shards: 40 },
      { metric: 'pickaxeLevel', target: 24, shards: 40 },
      { metric: 'itemsForged', target: 4000, shards: 40 },
      { metric: 'eventsTouched', target: 250, shards: 40 },
    ],
    strikeBonus: 0.5,
  },
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

/** Pendant l'absence, un éclat toutes les 6 minutes : 40 au retour de 4 h, de quoi forger vingt fois. */
const OFFLINE_SHARD_INTERVAL_MS = 6 * 60 * 1000;

export interface OfflineGains {
  /** Absence prise en compte, après plafond. */
  readonly creditedMs: number;
  readonly gold: number;
  readonly shards: number;
}

/** Gains d'une absence, plafonnée à 4 h. Les filons et les missions n'avancent qu'en jeu. */
export function offlineGains(stats: MiningStats, elapsedMs: number, efficiency = OFFLINE_EFFICIENCY): OfflineGains {
  const creditedMs = Math.min(Math.max(elapsedMs, 0), OFFLINE_CAP_MS);
  const seconds = creditedMs / 1000;
  return {
    creditedMs,
    gold: goldForDamage(damagePerSecond(stats) * seconds * efficiency, stats.goldBonus),
    shards: Math.floor(creditedMs / OFFLINE_SHARD_INTERVAL_MS),
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
 * Temps visé pour épuiser un filon : 40 secondes en zone 1, puis 30 % de plus à chaque zone, ce que mesure
 * la simulation d'un joueur moyen. Plus de 15 minutes en zone 10 : le joueur sent qu'il doit s'améliorer.
 */
const STAGE_TARGET_BASE_SECONDS = 40;
const STAGE_TARGET_GROWTH = 1.3;

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
