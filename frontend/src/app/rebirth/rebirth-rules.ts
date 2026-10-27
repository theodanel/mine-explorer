// Règles pures de la Renaissance : Braises gagnées, arbre permanent et ce qu'il apporte au mineur.
import {
  afterPhaseStars,
  CORRUPTION_PHASES,
  lifeFamily,
  OFFERING_EMBERS,
  REBIRTH_BRANCHES,
  REBIRTH_ESSENCES_PER_LEVEL,
  REBIRTH_GOLD_PER_LEVEL,
  REBIRTH_MIN_ZONE,
  REBIRTH_PICKAXE_PER_LEVEL,
  REBIRTH_SHARDS_PER_LEVEL,
  REBIRTH_SPEED_PER_LEVEL,
  REBIRTH_START_ZONE,
  REMOVED_SHORTCUT_COST_BASE,
  REBIRTH_STRIKE_PER_LEVEL,
  REBIRTH_TREE,
  RebirthBranch,
  rebirthEmbers,
  rebirthHardness,
} from '../balance/rebirth';
import type { ForgeLineage } from '../equipment/equipment-rules';

export interface RebirthState {
  /** Renaissances faites : elles durcissent les filons et allument l'emblème du mineur. */
  readonly count: number;
  /** Braises du Cœur pas encore dépensées. */
  readonly embers: number;
  /** Paliers achetés dans l'arbre des Braises. */
  readonly tree: Readonly<Partial<Record<RebirthBranch, number>>>;
  /** Étapes atteintes au plus profond, toutes vies confondues : c'est ce que retient le classement. */
  readonly bestStages: number;
  /** Offrandes au Cœur faites dans la vie en cours : leur prix double à chacune. */
  readonly offerings: number;
}

export const EMPTY_REBIRTH: RebirthState = { count: 0, embers: 0, tree: {}, bestStages: 0, offerings: 0 };

export function branchLevel(state: RebirthState, branch: RebirthBranch): number {
  return state.tree[branch] ?? 0;
}

/**
 * La renaissance s'ouvre quand la phase du Divin corrompu de la vie est faite (`phase` : la plus basse des 5 pièces).
 * Après la phase 5, il faut atteindre la zone 20.
 */
export function canRebirth(zone: number, rebirths: number, phase: number): boolean {
  return rebirths < CORRUPTION_PHASES ? phase > rebirths : zone >= REBIRTH_MIN_ZONE;
}

/** Renaît depuis cette zone : une renaissance de plus, ses Braises, et la profondeur gardée pour le classement. */
export function rebirth(state: RebirthState, zone: number, stagesReached: number, phase: number): RebirthState {
  if (!canRebirth(zone, state.count, phase)) {
    return state;
  }
  return {
    ...state,
    count: state.count + 1,
    embers: state.embers + rebirthEmbers(zone),
    bestStages: Math.max(state.bestStages, stagesReached),
    offerings: 0,
  };
}

/** Braises du palier suivant, ou null au maximum. */
export function nextCost(state: RebirthState, branch: RebirthBranch): number | null {
  const level = branchLevel(state, branch);
  const definition = REBIRTH_TREE[branch];
  return level >= definition.maxLevel ? null : definition.cost(level);
}

export function canBuy(state: RebirthState, branch: RebirthBranch): boolean {
  const cost = nextCost(state, branch);
  return cost !== null && state.embers >= cost;
}

export function buy(state: RebirthState, branch: RebirthBranch): RebirthState {
  const cost = nextCost(state, branch);
  if (cost === null || state.embers < cost) {
    return state;
  }
  return { ...state, embers: state.embers - cost, tree: { ...state.tree, [branch]: branchLevel(state, branch) + 1 } };
}

/** Famille et ✦ des pièces forgées dans la vie en cours. */
export function forgeLineage(rebirths: number): ForgeLineage {
  return { family: lifeFamily(rebirths), stars: afterPhaseStars(rebirths) };
}

/** Une Offrande au Cœur : des Braises de plus, payées en or par l'appelant. */
export function offer(state: RebirthState): RebirthState {
  return { ...state, embers: state.embers + OFFERING_EMBERS, offerings: state.offerings + 1 };
}

/** Ce que l'arbre apporte : multiplicateur de Frappe, vitesse, départ, éclats, ressources et or gardé. */
export interface RebirthEffects {
  readonly strikeMultiplier: number;
  readonly speed: number;
  readonly startPickaxe: number;
  readonly startZone: number;
  readonly shardBonus: number;
  readonly essencesPerRock: number;
  readonly goldKept: number;
  /** Multiplicateur des PV des filons de la vie en cours. */
  readonly hardness: number;
}

export function rebirthEffects(state: RebirthState): RebirthEffects {
  return {
    strikeMultiplier: (1 + REBIRTH_STRIKE_PER_LEVEL) ** branchLevel(state, 'strike'),
    speed: branchLevel(state, 'speed') * REBIRTH_SPEED_PER_LEVEL,
    startPickaxe: 1 + branchLevel(state, 'pickaxe') * REBIRTH_PICKAXE_PER_LEVEL,
    startZone: REBIRTH_START_ZONE,
    shardBonus: branchLevel(state, 'shards') * REBIRTH_SHARDS_PER_LEVEL,
    essencesPerRock: branchLevel(state, 'essences') * REBIRTH_ESSENCES_PER_LEVEL,
    goldKept: branchLevel(state, 'gold') * REBIRTH_GOLD_PER_LEVEL,
    hardness: rebirthHardness(state.count),
  };
}

/** Lecture d'une sauvegarde : null si elle est abîmée. */
export function parseRebirth(raw: string): RebirthState | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    // JSON illisible : l'appelant le signale et repart d'une Renaissance vide
    return null;
  }
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { count, embers, tree, bestStages, offerings = 0 } = value as Record<string, unknown>;
  // Sauvegarde d'avant l'Offrande (27/10/2026) : aucune offrande faite
  const counts = [count, embers, bestStages, offerings].every((number) => Number.isSafeInteger(number) && (number as number) >= 0);
  if (!counts || typeof tree !== 'object' || tree === null) {
    return null;
  }
  // Branche Raccourci retirée le 27/10/2026 : ses paliers sont rendus en Braises
  const { shortcut, ...kept } = tree as Record<string, unknown>;
  const refund = Number.isSafeInteger(shortcut) ? shortcutRefund(shortcut as number) : 0;
  const levels = Object.entries(kept);
  const treeValid = levels.every(
    ([branch, level]) =>
      (REBIRTH_BRANCHES as readonly string[]).includes(branch) &&
      Number.isSafeInteger(level) &&
      (level as number) >= 0 &&
      (level as number) <= REBIRTH_TREE[branch as RebirthBranch].maxLevel,
  );
  return treeValid
    ? {
        count: count as number,
        embers: (embers as number) + refund,
        tree: kept as RebirthState['tree'],
        bestStages: bestStages as number,
        offerings: offerings as number,
      }
    : null;
}

/** Braises payées pour `levels` paliers de l'ancienne branche Raccourci. */
function shortcutRefund(levels: number): number {
  let total = 0;
  for (let level = 0; level < levels; level++) {
    total += REMOVED_SHORTCUT_COST_BASE * (level + 1);
  }
  return total;
}
