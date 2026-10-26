// Tout l'équilibrage du jeu au même endroit : chiffres, tables et formules.
// Fichier pur (aucune dépendance Angular) pour être testé, simulé en ligne de commande et porté côté Spring.
// Le document docs/game-design/equilibrage.md explique ces choix et la courbe de progression attendue.
import type { MiningStats, StatId, TierId } from '../equipment/equipment.model';

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

/**
 * Affixes selon la qualité : chaque objet porte 1 à 4 stats tirées dans le pool complet, sans doublon.
 * Bois à Cuivre 1, Fer à Or 2, Mithril à Magma 3, Divin 4 : plus la qualité monte, plus l'objet est riche.
 */
export function affixCount(tier: TierId): number {
  return 1 + Math.floor(tierIndex(tier) / 3);
}

// ─── Objets ────────────────────────────────────────────────────────────────

/**
 * Valeur de référence de chaque stat pour un objet en Bois de niveau 1. Les objets n'en portent qu'une part
 * (ITEM_BASE_STRIKE_SHARE, AFFIX_SHARE) : ces références viennent de l'époque où chaque emplacement avait sa stat.
 */
export const MAIN_STAT_BASE: Readonly<MiningStats> = {
  strikePower: 4,
  miningSpeed: 0.05,
  critChance: 0.03,
  critDamage: 0.15,
  goldBonus: 0.08,
};

/**
 * Builds libres (13/10/2026) : n'importe quelle pièce peut porter n'importe quelle stat, pour que le joueur choisisse
 * tout en Frappe, tout en Vitesse, tout en critique ou un mélange. Laissées à leur ancienne valeur, les stats libres
 * donnaient un build tout en Frappe 4 fois plus fort que l'ancien équipement : le jeu devenait trop facile et les autres
 * builds ne servaient à rien. D'où trois règles, réglées au calcul puis au simulateur :
 * 1. Chaque pièce a une Frappe de base (10 % de l'ancienne Frappe de pioche) : un build sans affixe de Frappe frappe quand même.
 * 2. Les affixes valent une part de l'ancienne stat principale, choisie pour que les builds se tiennent : de 0 à 25 % sous
 *    le meilleur build selon le niveau, sauf l'or, qui échange de la Puissance contre du revenu.
 * 3. Le premier affixe vaut plein tarif, les suivants 60 %.
 * Le meilleur build reste à la Puissance de l'ancien équipement jusqu'à la pioche 25 : l'économie ne bouge pas.
 */
export const ITEM_BASE_STRIKE_SHARE = 0.25;
export const AFFIX_SHARE: Readonly<MiningStats> = {
  strikePower: 0.3,
  miningSpeed: 1.1,
  critChance: 1.1,
  critDamage: 0.9,
  goldBonus: 1.2,
};
export const NEXT_AFFIX_RATIO = 0.6;
/** Une stat d'affinité de l'emplacement sort 3 fois plus souvent qu'une autre en affixe. */
export const AFFINITY_WEIGHT = 3;

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

/**
 * Panoplie (lot 3 des idées Forge Master, 19/10/2026) : des pièces portées du même palier donnent de la Frappe.
 * 3 pièces : +3 % ; les 5 : +8 % (le bonus à 3 ne s'y ajoute pas). Du plus grand au plus petit. La spec partait de
 * +5 % et +15 % : en fin de partie presque tout l'équipement est du même palier, et la pioche 30 arrivait 1,3 jour
 * plus tôt ; à +3 % et +8 %, l'écart reste dans le bruit du simulateur (moins d'un demi-jour).
 */
export const SET_BONUSES: readonly { readonly pieces: number; readonly strikePct: number }[] = [
  { pieces: 5, strikePct: 0.08 },
  { pieces: 3, strikePct: 0.03 },
];

/** Un tirage à la Forge coûte des éclats, quel que soit le niveau de la pioche. */
export const FORGE_SHARD_COST = 2;

export const MAX_PICKAXE_LEVEL = 30;
/** Comme dans Forge Master : chaque paiement remplit un segment, 10 segments font un niveau. */
export const SEGMENTS_PER_LEVEL = 10;

/**
 * L'or est le vrai régulateur du rythme. Le coût est multiplié par 2,09 à chaque niveau alors que la Puissance,
 * donc le revenu, grandit d'environ ×1,4 : chaque niveau demande un peu plus de temps que le précédent, le mur
 * classique des jeux idle (coûts exponentiels, production plus lente). Résultat simulé pour un joueur qui joue 1 h
 * par jour, avec tous les systèmes (arbre, sorts, artefacts, Atelier, événements, galeries, compagnons, évolution
 * par objectifs ; moyenne de 5 tirages) : niveau 10 le premier jour, 20 vers le jour 8, 25 vers le jour 19,
 * 30 vers le jour 49. Ce chiffre est très sensible : ×2 donnait le niveau 30 au jour 35 ; ×2,05 au jour 43 une fois
 * les éclats rendus plus faciles (deux fois plus de forges, donc plus de ventes et de meilleurs objets).
 */
const SEGMENT_BASE_COST = 15;
// 2,085 avec le Campement (14/10/2026), qui accélère l'or hors ligne, puis 2,09 avec le Mineur et le Contremaître
// plus rapides et l'Atelier moins cher à l'ouverture : pioche 30 au jour 47,8 sur 5 tirages
const SEGMENT_COST_GROWTH = 2.09;

/**
 * Entre les niveaux 15 et 25, le prix monte moins vite (×1,95) : c'est là que Théo butait, le 15/10/2026, entre le
 * Contremaître et le Maître des profondeurs, avec un stuff en retard sur sa zone. Les niveaux 25 à 29 rattrapent
 * l'écart (×2,4) : le niveau 29 coûte comme avant, pour que la fin de partie ne raccourcisse pas.
 */
const SOFT_SEGMENT_FROM = 15;
const SOFT_SEGMENT_TO = 25;
const SOFT_SEGMENT_GROWTH = 1.95;
const SOFT_SPAN = SOFT_SEGMENT_TO - SOFT_SEGMENT_FROM;
const CATCH_UP_SPAN = MAX_PICKAXE_LEVEL - 1 - SOFT_SEGMENT_TO;
const CATCH_UP_GROWTH = SEGMENT_COST_GROWTH * (SEGMENT_COST_GROWTH / SOFT_SEGMENT_GROWTH) ** (SOFT_SPAN / CATCH_UP_SPAN);

/** Prix en or d'un segment au niveau donné, ou null au niveau maximum. */
export function segmentCost(pickaxeLevel: number): number | null {
  if (pickaxeLevel >= MAX_PICKAXE_LEVEL) {
    return null;
  }
  const softSteps = Math.min(Math.max(pickaxeLevel - SOFT_SEGMENT_FROM, 0), SOFT_SPAN);
  const catchUpSteps = Math.max(pickaxeLevel - SOFT_SEGMENT_TO, 0);
  const steps = pickaxeLevel - 1 - softSteps - catchUpSteps;
  return Math.round(SEGMENT_BASE_COST * SEGMENT_COST_GROWTH ** steps * SOFT_SEGMENT_GROWTH ** softSteps * CATCH_UP_GROWTH ** catchUpSteps);
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

/**
 * Jackpot (demande de Théo, 19/10/2026) : à chaque tirage, une petite chance (en %) d'un objet deux paliers au-dessus
 * du palier de base, prise sur la part du palier de base. Un moment fort rare : environ 5 sur toute une partie au
 * rythme de 200 forges par jour. Le palier « deux crans au-dessus » à 3 % avait été retiré (Fer dès le niveau 5) ;
 * Théo autorise 0,05 à 0,5 %, le simulateur montre que 0,05 % ne bouge pas la courbe.
 */
export const JACKPOT_CHANCE = 0.05;
const JACKPOT_TIER_GAP = 2;

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
  const jackpotIndex = baseTier + JACKPOT_TIER_GAP;
  if (jackpotIndex < TIER_ORDER.length) {
    const base = TIER_ORDER[baseTier];
    chances[TIER_ORDER[jackpotIndex]] = JACKPOT_CHANCE;
    chances[base] = Math.round((chances[base] - JACKPOT_CHANCE) * 100) / 100;
  }
  return chances;
}

/** Objet forgé deux paliers (ou plus) au-dessus de la base de son niveau : un jackpot. */
export function isJackpot(tier: TierId, pickaxeLevel: number): boolean {
  return pickaxeLevel > 1 && tierIndex(tier) - baseTierIndex(pickaxeLevel) >= JACKPOT_TIER_GAP;
}

/** Palier que le jackpot donne au niveau de pioche donné, ou null (niveau 1, ou au-delà du Divin). */
export function jackpotTier(pickaxeLevel: number): TierId | null {
  const level = Math.min(Math.max(Math.floor(pickaxeLevel), 1), MAX_PICKAXE_LEVEL);
  const index = baseTierIndex(level) + JACKPOT_TIER_GAP;
  return level > 1 && index < TIER_ORDER.length ? TIER_ORDER[index] : null;
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

/**
 * 1 PV miné rapporte 0,34 pièce (avant le bonus d'or). C'était 0,25 tant que le sac portait toujours du bonus d'or :
 * avec les builds libres, l'or devient un choix qui coûte de la Puissance, et le simulateur, qui équipe pour la
 * Puissance, finissait avec +5 % d'or au lieu de +89 %. Le revenu de base compense, pour garder la pioche 30 vers le jour 48.
 */
const GOLD_PER_DAMAGE = 0.34;

/**
 * Les éclats viennent de deux sources en jouant. Théo les trouvait trop rares : le 13/10/2026, coups, filons
 * et absence en donnent 50 % de plus, soit environ 200 forges par jour pour le joueur régulier, à tout moment.
 * 1. Chaque coup peut en déterrer un : un débit régulier qui ne dépend pas de la zone. 6 % par coup depuis le
 *    14/10/2026 au soir (4 % avant, 3 % encore avant ; Théo trouvait la forge trop pauvre), soit environ 75 éclats par heure sans bonus de Vitesse, une forge toutes les 2 minutes même en profondeur,
 *    où les filons durent longtemps.
 * 2. Chaque filon épuisé en donne. Comme dans Legends of Mushroom, le début arrose : les 5 premiers filons
 *    donnent de quoi forger deux fois chacun (les 5 emplacements remplis en une minute), puis un tirage par filon.
 * Les missions, les fins de zone, l'absence, les événements, les objectifs d'évolution et le Défi de la mine complètent.
 */
export const SHARD_FIND_CHANCE = 0.06;
const WELCOME_STAGES = 5;
const WELCOME_SHARDS = 4;
/** Les filons des zones adoucies donnent un éclat de plus : le début de partie forge davantage. */
const EARLY_STAGE_SHARDS = 3;
/**
 * Plus loin, un filon donne un éclat par tranche de 40 s de son temps visé : il dure plus longtemps, il rapporte
 * plus (demande de Théo, 15/10/2026 : 2 éclats par filon en zone 9, pour 5 minutes de minage, c'était trop peu).
 * 3 en zone 5, 8 en zone 9, 18 en zone 12.
 */
const STAGE_SHARD_SECONDS = 40;
const MIN_STAGE_SHARDS = 2;
/** Le gardien de chaque zone garde un coffre d'éclats : 5 par numéro de zone (45 en zone 9). */
const ZONE_CLEAR_SHARDS_PER_ZONE = 5;

/** Éclats gagnés en épuisant le filon `stage` de la zone `zone`. */
export function shardsForStage(zone: number, stage: number): number {
  if (zone === 1 && stage <= WELCOME_STAGES) {
    return WELCOME_SHARDS;
  }
  if (zone <= SOFT_START_ZONES) {
    return EARLY_STAGE_SHARDS;
  }
  return Math.max(Math.round(stageTargetSeconds(zone) / STAGE_SHARD_SECONDS), MIN_STAGE_SHARDS);
}

/** Éclats du coffre du gardien, en terminant la zone. */
export function zoneClearShards(zone: number): number {
  return ZONE_CLEAR_SHARDS_PER_ZONE * zone;
}

export function stageIndex(zone: number, stage: number): number {
  return (zone - 1) * STAGES_PER_ZONE + (stage - 1);
}

/**
 * Les premières zones sont tendres pour que le joueur avance vite : le 1-1 n'a que 10 % des PV de la courbe,
 * et l'écart se referme progressivement jusqu'au début de la zone 5. Le 13/10/2026, Théo trouvait les zones 2
 * et 3 trop longues (plusieurs minutes par filon avec une pioche 4) : l'adoucissement, limité à la zone 1,
 * couvre désormais les zones 1 à 4. Les PV en zone 2 sont divisés par 4 environ, par 2,4 en zone 3, et la courbe
 * normale reprend au 5-1, si bien que le moyen et le long terme ne bougent pas.
 */
const FIRST_ROCK_HP_FACTOR = 0.1;
const SOFT_START_ZONES = 4;
const SOFT_START_LAST_INDEX = SOFT_START_ZONES * STAGES_PER_ZONE;

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

/**
 * Prix en or qui suivent le revenu (choix de Théo, 27/10/2026) : l'or d'un filon grandit avec la zone et la dureté
 * de la renaissance, alors que la pioche, l'Atelier et le Campement étaient calés sur les zones 1 à 20 de la 1re vie.
 * Au-delà, tout devenait gratuit. Ces prix sont donc multipliés par ce que vaut un filon de ta zone, comparé à un filon
 * de la zone 20 en 1re vie. Jamais moins de ×1 : la 1re vie ne change pas.
 */
export const GOLD_PRICE_REFERENCE_ZONE = 20;
const GOLD_PRICE_REFERENCE_STAGE = 8;

export function goldPriceScale(zone: number, hardness: number): number {
  const reference = rockHp(GOLD_PRICE_REFERENCE_ZONE, GOLD_PRICE_REFERENCE_STAGE);
  return Math.max(1, (rockHp(zone, GOLD_PRICE_REFERENCE_STAGE) * hardness) / reference);
}

/** Or d'un filon moyen de cette zone, dureté comprise : l'unité des prix de fin de jeu. */
export function rockGold(zone: number, hardness: number): number {
  return goldForDamage(rockHp(zone, GOLD_PRICE_REFERENCE_STAGE) * hardness, 0);
}

export function goldForDamage(damage: number, goldBonus: number): number {
  return Math.round(damage * GOLD_PER_DAMAGE * (1 + goldBonus));
}

/**
 * En jeu, chaque PV miné rapporte deux fois plus (15/10/2026). Avant, 78 % de l'or venait de l'absence : le joueur
 * qui jouait voyait son or stagner, celui qui fermait le jeu avançait. L'absence passe en même temps de 50 % à 35 %.
 */
export const ACTIVE_GOLD_MULTIPLIER = 2;

/** Or d'un coup porté en jeu (pioche ou sort). */
export function minedGold(damage: number, goldBonus: number): number {
  return goldForDamage(damage * ACTIVE_GOLD_MULTIPLIER, goldBonus);
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

/**
 * Minerai : chaque coup de pioche a une chance d'en déterrer un, dans toutes les zones (choix de Théo, 14/10/2026 ;
 * c'était 1 par filon épuisé). Une zone terminée en offre en plus un lot.
 */
export const ORE_FIND_CHANCE = 0.03;
export const ZONE_CLEAR_ORES = 20;

export type EvolutionId = 'apprentice' | 'miner' | 'foreman' | 'master' | 'legend' | 'heart';

/**
 * Ce qu'un objectif d'évolution mesure : une jauge de progression ou un compteur de toute la partie.
 * Que des mesures qui dépendent du joueur, pas du hasard : les événements de mine en ont été retirés le 13/10/2026.
 */
export type EvolutionMetric = 'zone' | 'zoneCleared' | 'pickaxeLevel' | 'itemsForged' | 'rocksBroken';

export interface EvolutionObjective {
  /** Palier de la mission, à partir de 1 : un palier s'ouvre quand le précédent est rempli. */
  readonly tier: number;
  readonly metric: EvolutionMetric;
  readonly target: number;
  /** Éclats offerts dès que la mission est remplie. */
  readonly shards: number;
}

/** Missions d'une forme, palier par palier : [palier][mesure, objectif]. Toutes rapportent les mêmes éclats. */
function tiered(shards: number, tiers: readonly (readonly (readonly [EvolutionMetric, number])[])[]): EvolutionObjective[] {
  return tiers.flatMap((missions, index) => missions.map(([metric, target]) => ({ tier: index + 1, metric, target, shards })));
}

export interface EvolutionForm {
  /** Visuel de la forme : toutes les étoiles du Cœur du monde partagent le même. */
  readonly id: EvolutionId;
  readonly label: string;
  /** Étoiles de la Légende du Cœur du monde (0 avant) : ses rangs, de la zone 12 à la zone 20. */
  readonly stars: number;
  /** Objectifs à remplir pour passer à cette forme, façon « Adventure Rank » de Legend of Mushroom. */
  readonly objectives: readonly EvolutionObjective[];
  /** Bonus de Frappe de cette forme, cumulé avec les précédentes. */
  readonly strikeBonus: number;
}

/**
 * Légende du Cœur du monde (choix de Théo, 17/10/2026) : la Légende arrive vers la zone 12, il restait 8 zones sans rang
 * à viser. La forme finale prend le relais en 5 étoiles, une toutes les deux zones (12, 14, 16, 18, 20), avec la même
 * mécanique de missions ; chacune donne de la Frappe, ce qui apporte la Puissance qui manquait au-delà de la zone 16.
 * Les objectifs de zone ne demandent que d'atteindre la zone, jamais de battre son gardien : l'étoile aide justement à
 * le battre. Les objets forgés, qui montent même quand le joueur piétine, espacent les étoiles dans le temps.
 */
const HEART_STAR_BONUS = 1;
/**
 * Zone à atteindre, pioche, objets forgés et filons épuisés de chaque étoile (les filons suivent la zone atteinte).
 * Seule la 1re étoile demande en plus de terminer sa zone (battre le gardien de la 12). Dès la 2e, « terminer la zone »
 * doublait « atteindre la zone » (la 5e demandait d'atteindre la 20 et de terminer la 19 : la même chose, signalé par
 * un joueur le 25/10/2026) ; ce sont les objets forgés qui espacent les étoiles (simulateur : mêmes jours qu'avant).
 */
const HEART_STAR_GOALS: readonly (readonly [zone: number, pickaxe: number, items: number, rocks: number])[] = [
  [12, 25, 11500, 190],
  [14, 26, 17000, 215],
  [16, 28, 23500, 245],
  [18, 30, 32500, 275],
  [20, 30, 44000, 292],
];
/** Zone que la 1re étoile demande de terminer. */
const FIRST_STAR_CLEARED_ZONE = 12;

const HEART_STARS: readonly EvolutionForm[] = HEART_STAR_GOALS.map(([zone, pickaxe, items, rocks], index) => ({
  id: 'heart',
  label: 'Légende du Cœur du monde',
  stars: index + 1,
  // Palier 1 : atteindre la zone ; palier 2 : le chemin ; palier 3 : tout le reste, et pour la 1re étoile seulement,
  // terminer la zone 12 (demande de Théo, 18/10/2026 ; le gardien reste battable sans l'étoile).
  objectives: tiered(12 + 2 * index, [
    [['zone', zone], ['itemsForged', Math.round(items * 0.75)]],
    [['pickaxeLevel', pickaxe], ['itemsForged', Math.round(items * 0.85)], ['rocksBroken', rocks - 10]],
    [
      ...(index === 0 ? [['zoneCleared', FIRST_STAR_CLEARED_ZONE] as const] : []),
      ['itemsForged', items],
      ['rocksBroken', rocks],
    ],
  ]),
  strikeBonus: HEART_STAR_BONUS,
}));

/**
 * Formes du mineur, de la première à la dernière. Chacune se gagne en remplissant des missions rangées en 3 paliers,
 * façon « Adventure Rank » de Legend of Mushroom, sans rien payer : le joueur évolue parce qu'il a joué.
 * Le dernier palier reprend les objectifs calés sur ce que le joueur régulier avait fait quand il évoluait avec l'ancien
 * coût en or et minerais : les dates ne bougent pas (simulé : Mineur jour 3, Contremaître jour 5, Maître jour 9,
 * Légende jour 19). Les deux premiers paliers jalonnent le chemin, pour qu'il y ait toujours une mission proche.
 * Chaque forme donne +50 % de Frappe, multipliés entre eux (×5 en Légende) : les paliers multiplicateurs des jeux idle.
 */
export const EVOLUTION_FORMS: readonly EvolutionForm[] = [
  { id: 'apprentice', label: 'Apprenti', stars: 0, objectives: [], strikeBonus: 0 },
  {
    id: 'miner',
    label: 'Mineur',
    stars: 0,
    objectives: tiered(4, [
      [['zone', 2], ['pickaxeLevel', 3], ['itemsForged', 40]],
      [['zone', 3], ['pickaxeLevel', 6], ['itemsForged', 120], ['rocksBroken', 25]],
      [['zone', 4], ['pickaxeLevel', 8], ['itemsForged', 220], ['rocksBroken', 45]],
    ]),
    strikeBonus: 0.5,
  },
  {
    id: 'foreman',
    label: 'Contremaître',
    stars: 0,
    objectives: tiered(6, [
      [['zone', 5], ['pickaxeLevel', 10], ['itemsForged', 350]],
      [['pickaxeLevel', 12], ['itemsForged', 480], ['rocksBroken', 65]],
      [['zone', 6], ['pickaxeLevel', 13], ['itemsForged', 600], ['rocksBroken', 80]],
    ]),
    strikeBonus: 0.5,
  },
  {
    id: 'master',
    label: 'Maître des profondeurs',
    stars: 0,
    objectives: tiered(8, [
      [['zone', 8], ['pickaxeLevel', 18], ['itemsForged', 900]],
      [['pickaxeLevel', 19], ['itemsForged', 1050], ['rocksBroken', 125]],
      [['zone', 9], ['pickaxeLevel', 20], ['itemsForged', 1200], ['rocksBroken', 140]],
    ]),
    strikeBonus: 0.5,
  },
  {
    id: 'legend',
    label: 'Légende de la mine',
    stars: 0,
    objectives: tiered(10, [
      [['zone', 10], ['pickaxeLevel', 22], ['itemsForged', 2600]],
      [['zone', 11], ['pickaxeLevel', 23], ['itemsForged', 3300], ['rocksBroken', 165]],
      [['zone', 12], ['pickaxeLevel', 24], ['itemsForged', 4000], ['rocksBroken', 180]],
    ]),
    strikeBonus: 0.5,
  },
  ...HEART_STARS,
];

/** Multiplicateur de Frappe cumulé jusqu'à la forme d'index donné. */
export function evolutionStrikeMultiplier(formIndex: number): number {
  return EVOLUTION_FORMS.slice(0, formIndex + 1).reduce((total, form) => total * (1 + form.strikeBonus), 1);
}

// ─── Hors ligne ────────────────────────────────────────────────────────────

/** Les gains hors ligne s'arrêtent après 4 h, comme dans Forge Master : il faut revenir pour en profiter. */
export const OFFLINE_CAP_MS = 4 * 60 * 60 * 1000;
/** Hors ligne, le mineur rapporte 35 % de ses dégâts (50 % avant le 15/10/2026), sans le bonus du jeu actif. */
export const OFFLINE_EFFICIENCY = 0.35;
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
/** `capMs` : absence prise en compte au plus, allongée par l'Entrepôt du Campement. */
export function offlineGains(
  stats: MiningStats,
  elapsedMs: number,
  efficiency = OFFLINE_EFFICIENCY,
  capMs = OFFLINE_CAP_MS,
): OfflineGains {
  const creditedMs = Math.min(Math.max(elapsedMs, 0), capMs);
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

/**
 * Gardien de fin de zone : le dernier filon de chaque zone est un gardien à casser en 30 secondes, sinon il se
 * reforme et le joueur reste dans la zone (demande de Théo, 15/10/2026 : en laissant tourner le jeu, n'importe quelle
 * Frappe finissait par passer toutes les zones). Ses PV ne suivent pas les filons : ils valent ce qu'inflige en
 * 30 secondes un joueur à GUARDIAN_POWER_SHARE de la Puissance conseillée pour le dernier filon de la zone.
 */
export const GUARDIAN_SECONDS = 30;
export const GUARDIAN_POWER_SHARE = 0.5;

export function guardianHp(zone: number): number {
  return Math.round(GUARDIAN_SECONDS * (recommendedPower(zone, STAGES_PER_ZONE) / POWER_PER_DPS) * GUARDIAN_POWER_SHARE);
}

/** Puissance qui casse le gardien de la zone juste à temps. */
export function guardianPower(zone: number): number {
  return Math.ceil((guardianHp(zone) / GUARDIAN_SECONDS) * POWER_PER_DPS);
}

/** Secondes pour miner les PV restants à cette Puissance. */
export function secondsToMine(remainingHp: number, power: number): number {
  return (remainingHp / power) * POWER_PER_DPS;
}

// ─── Courbe attendue (pour le document d'équilibrage et les tests) ───────────

/**
 * Stats d'un joueur moyen avec la pioche au niveau donné : cinq objets du palier moyen de la table et du niveau
 * de la pioche, avec leur Frappe de base, et des affixes répartis à parts égales entre les cinq stats.
 */
const SLOT_COUNT = 5;
const STAT_KEYS = Object.keys(MAIN_STAT_BASE) as StatId[];

export function expectedStatsAtPickaxe(level: number): MiningStats {
  const chances = tierChances(level);
  const stats: MiningStats = { ...BASE_STATS };
  for (const tier of TIER_ORDER) {
    const share = chances[tier] / 100;
    const affixes = 1 + (affixCount(tier) - 1) * NEXT_AFFIX_RATIO;
    stats.strikePower += share * SLOT_COUNT * expectedStatValue('strikePower', tier, level, ITEM_BASE_STRIKE_SHARE);
    for (const stat of STAT_KEYS) {
      stats[stat] += share * affixes * expectedStatValue(stat, tier, level, AFFIX_SHARE[stat]);
    }
  }
  return stats;
}
