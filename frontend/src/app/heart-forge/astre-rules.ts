// Règles pures de l'Astre du Cœur : ce qu'on lui a donné, son stade, ses bonus et sa couleur.
import {
  ASTRE_COLORS,
  ASTRE_ELEMENT_BONUS,
  ASTRE_STAGE_POWER,
  ASTRE_STAGE_TOTALS,
  astreStage,
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

/** Où en est l'Astre vers son stade suivant : ressources données et à donner, ou null au stade 5. */
export function nextStageProgress(fed: AstreFed): { readonly given: number; readonly needed: number } | null {
  const stage = stageOf(fed);
  const target = ASTRE_STAGE_TOTALS[stage];
  if (target === undefined) {
    return null;
  }
  const from = stage === 0 ? 0 : ASTRE_STAGE_TOTALS[stage - 1];
  return { given: totalFed(fed) - from, needed: target - from };
}

/** Bonus de l'Astre : chaque ressource renforce son domaine selon sa part dans la nourriture, et selon le stade. */
export function astreBonuses(fed: AstreFed): Bonuses {
  const totals: Record<BonusId, number> = { ...NO_BONUSES };
  const total = totalFed(fed);
  const stage = stageOf(fed);
  if (stage === 0 || total === 0) {
    return totals;
  }
  const power = ASTRE_STAGE_POWER[stage - 1];
  for (const id of ESSENCES) {
    const { bonus, full } = ASTRE_ELEMENT_BONUS[id];
    totals[bonus] += full * (fed[id] / total) * power;
  }
  return totals;
}

/** Couleur de l'Astre : le mélange des couleurs de sa nourriture, pondéré par la part de chacune. */
export function astreColor(fed: AstreFed): number {
  const total = totalFed(fed);
  if (total === 0) {
    return ASTRE_COLORS.dawn;
  }
  let red = 0;
  let green = 0;
  let blue = 0;
  for (const id of ESSENCES) {
    const share = fed[id] / total;
    const color = ASTRE_COLORS[id];
    red += ((color >> 16) & 0xff) * share;
    green += ((color >> 8) & 0xff) * share;
    blue += (color & 0xff) * share;
  }
  return (Math.round(red) << 16) | (Math.round(green) << 8) | Math.round(blue);
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
