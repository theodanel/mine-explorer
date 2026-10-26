// Règles pures de l'Astre du Cœur : ce qu'on lui a donné, son stade, ses bonus et sa couleur.
import {
  ASTRE_COLORS,
  ASTRE_CONSTELLATION_POWER,
  ASTRE_ELEMENT_BONUS,
  ASTRE_STAGE_POWER,
  ASTRE_STAGE_TOTALS,
  ASTRE_STAGES,
  astreStage,
  constellationCost,
  constellationZone,
} from '../balance/astre';
import { ESSENCES, EssenceId } from '../balance/heart-forge';
import { BonusId, Bonuses, NO_BONUSES } from '../balance/skill-tree';

/** Ressources données à l'Astre, par sorte, depuis le début. */
export type AstreFed = Readonly<Record<EssenceId, number>>;

export const EMPTY_ASTRE: AstreFed = Object.fromEntries(ESSENCES.map((id) => [id, 0])) as Record<EssenceId, number>;

export function totalFed(fed: AstreFed): number {
  return ESSENCES.reduce((total, id) => total + fed[id], 0);
}

export function stageOf(fed: AstreFed): number {
  return astreStage(totalFed(fed));
}

/** Multiplicateur de l'Astre (bonus, frappe, pluie d'étoiles) pour ce niveau de Constellation. */
export function astrePower(constellation: number): number {
  return 1 + ASTRE_CONSTELLATION_POWER * constellation;
}

/** Ressources données au-delà de Supernova et des niveaux de Constellation déjà allumés. */
function constellationSurplus(fed: AstreFed, constellation: number): number {
  let surplus = totalFed(fed) - ASTRE_STAGE_TOTALS[ASTRE_STAGES - 1];
  for (let level = 1; level <= constellation; level++) {
    surplus -= constellationCost(level);
  }
  return surplus;
}

/**
 * Où en est l'Astre vers son stade suivant, puis vers son niveau de Constellation suivant : ressources données et à
 * donner.
 */
export function nextStageProgress(fed: AstreFed, constellation = 0): { readonly given: number; readonly needed: number } {
  const stage = stageOf(fed);
  if (stage < ASTRE_STAGES) {
    const from = stage === 0 ? 0 : ASTRE_STAGE_TOTALS[stage - 1];
    return { given: totalFed(fed) - from, needed: ASTRE_STAGE_TOTALS[stage] - from };
  }
  return { given: constellationSurplus(fed, constellation), needed: constellationCost(constellation + 1) };
}

/** Ce qui manque pour allumer le niveau de Constellation suivant. */
export interface ConstellationNeeds {
  readonly level: number;
  readonly supernova: boolean;
  readonly rebirth: boolean;
  readonly fed: boolean;
  /** Zone de l'épreuve, à atteindre dans la vie en cours. */
  readonly zone: number;
  readonly zoneReached: boolean;
}

export function constellationNeeds(fed: AstreFed, constellation: number, rebirths: number, zone: number): ConstellationNeeds {
  const level = constellation + 1;
  return {
    level,
    supernova: stageOf(fed) === ASTRE_STAGES,
    rebirth: rebirths >= level,
    fed: stageOf(fed) === ASTRE_STAGES && constellationSurplus(fed, constellation) >= constellationCost(level),
    zone: constellationZone(level),
    zoneReached: zone >= constellationZone(level),
  };
}

export function canRaiseConstellation(needs: ConstellationNeeds): boolean {
  return needs.supernova && needs.rebirth && needs.fed && needs.zoneReached;
}

/**
 * Bonus de l'Astre : chaque ressource renforce son domaine selon sa part dans la nourriture, selon le stade, et selon
 * la Constellation en fin de jeu.
 */
export function astreBonuses(fed: AstreFed, constellation = 0): Bonuses {
  const totals: Record<BonusId, number> = { ...NO_BONUSES };
  const total = totalFed(fed);
  const stage = stageOf(fed);
  if (stage === 0 || total === 0) {
    return totals;
  }
  const power = ASTRE_STAGE_POWER[stage - 1] * astrePower(constellation);
  for (const id of ESSENCES) {
    const { bonus, full } = ASTRE_ELEMENT_BONUS[id];
    totals[bonus] += full * (fed[id] / total) * power;
  }
  return totals;
}

/** Couleur de l'Astre : le mélange des couleurs de ses deux ressources principales. */
export function astreColor(fed: AstreFed): number {
  // Seules les deux ressources principales colorent l'Astre : mélanger les cinq donnait un gris terne
  const [first, second] = [...ESSENCES].sort((a, b) => fed[b] - fed[a]);
  if (fed[first] === 0) {
    return ASTRE_COLORS.dawn;
  }
  const secondShare = fed[second] / (fed[first] + fed[second]);
  const mix = (shift: number): number => {
    const channel = (color: number): number => (color >> shift) & 0xff;
    return Math.round(channel(ASTRE_COLORS[first]) * (1 - secondShare) + channel(ASTRE_COLORS[second]) * secondShare);
  };
  return (mix(16) << 16) | (mix(8) << 8) | mix(0);
}

export function feedAstre(fed: AstreFed, essence: EssenceId, amount: number): AstreFed {
  return { ...fed, [essence]: fed[essence] + Math.max(amount, 0) };
}

export function parseAstre(value: unknown): AstreFed | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const fed = value as Record<string, unknown>;
  const valid = ESSENCES.every((id) => Number.isSafeInteger(fed[id]) && (fed[id] as number) >= 0);
  return valid ? (fed as AstreFed) : null;
}
