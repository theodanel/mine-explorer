// Règles pures des runes d'équipement : sertir une rune de la réserve sur un emplacement, la retirer, et les bonus
// qu'elles donnent. Les runes serties appartiennent à l'emplacement : elles restent quand une meilleure pièce
// remplace celle qui était portée.
import {
  AFFINITY_MULTIPLIER,
  ALLIANCE_ELEMENTS,
  ALLIANCE_TOTAL_SHARE,
  ELEMENT_EFFECTS,
  GEAR_SOCKETS_TOTAL,
  RESONANCE_MIN_RUNES,
  RESONANCE_MULTIPLIER,
  STAT_BONUS,
} from '../balance/gear-runes';
import { AllianceRune, RUNE_ELEMENTS, RuneElement } from '../balance/heart-forge';
import { BonusId, Bonuses, NO_BONUSES } from '../balance/skill-tree';
import { SLOT_IDS, SLOTS, SlotId } from '../equipment/equipment.model';
import type { Rune } from './heart-forge-rules';

/** Runes serties sur chaque emplacement, châsse par châsse (null : châsse vide). */
export type GearRunes = Readonly<Record<SlotId, readonly (Rune | null)[]>>;

/** Châsses ouvertes sur chaque emplacement : selon les étoiles, et l'Éveil de la pièce. */
export type OpenSockets = Readonly<Record<SlotId, number>>;

export function sameOpenSockets(count: number): OpenSockets {
  return Object.fromEntries(SLOT_IDS.map((slot) => [slot, count])) as Record<SlotId, number>;
}

function emptySockets(): (Rune | null)[] {
  return Array.from({ length: GEAR_SOCKETS_TOTAL }, () => null);
}

export const EMPTY_GEAR_RUNES: GearRunes = Object.fromEntries(SLOT_IDS.map((slot) => [slot, emptySockets()])) as unknown as GearRunes;

/** Un effet d'une rune : le bonus et sa valeur, affinité et résonance comprises. */
export interface RuneEffect {
  readonly bonus: BonusId;
  readonly value: number;
}

function isElement(type: Rune['type']): type is RuneElement {
  return (RUNE_ELEMENTS as readonly string[]).includes(type);
}

/** Éléments d'une rune, et la part d'une rune élémentaire que chacun vaut. */
function elementsOf(rune: Rune): { readonly element: RuneElement; readonly share: number }[] {
  if (isElement(rune.type)) {
    return [{ element: rune.type, share: 1 }];
  }
  const elements = ALLIANCE_ELEMENTS[rune.type as AllianceRune];
  return elements.map((element) => ({ element, share: ALLIANCE_TOTAL_SHARE / elements.length }));
}

/** Type de rune qui résonne parmi ces runes (au moins trois du même type), ou null. */
export function resonantType(runes: readonly (Rune | null)[]): Rune['type'] | null {
  const counts = new Map<Rune['type'], number>();
  for (const rune of runes) {
    if (rune !== null) {
      counts.set(rune.type, (counts.get(rune.type) ?? 0) + 1);
    }
  }
  return [...counts].find(([, count]) => count >= RESONANCE_MIN_RUNES)?.[0] ?? null;
}

/** Effets d'une rune sertie sur un emplacement : affinité si elle renforce l'esprit de la pièce, et résonance. */
export function runeEffects(rune: Rune, slot: SlotId, resonance: boolean): RuneEffect[] {
  const affinity = STAT_BONUS[SLOTS[slot].workshopStat];
  return elementsOf(rune).map(({ element, share }) => {
    const { bonus, values } = ELEMENT_EFFECTS[element];
    const multiplier = (bonus === affinity ? AFFINITY_MULTIPLIER : 1) * (resonance ? RESONANCE_MULTIPLIER : 1);
    return { bonus, value: values[rune.rank - 1] * share * multiplier };
  });
}

/**
 * Bonus de toutes les runes serties, en une seule famille : elles s'additionnent entre elles, et la famille se
 * multiplie avec les autres (compétences, artefact, compagnon) pour la Frappe et l'or. Seules les châsses ouvertes
 * comptent.
 */
export function gearRuneBonuses(gear: GearRunes, openSockets: OpenSockets): Bonuses {
  const totals: Record<BonusId, number> = { ...NO_BONUSES };
  for (const slot of SLOT_IDS) {
    const open = gear[slot].slice(0, openSockets[slot]);
    const resonant = resonantType(open);
    for (const rune of open) {
      if (rune === null) {
        continue;
      }
      for (const { bonus, value } of runeEffects(rune, slot, rune.type === resonant)) {
        totals[bonus] += value;
      }
    }
  }
  return totals;
}

/** La châsse avec cette rune (ou vide) ; le reste de l'équipement ne bouge pas. */
export function withGearSocket(gear: GearRunes, slot: SlotId, socket: number, rune: Rune | null): GearRunes {
  const runes = gear[slot].map((current, index) => (index === socket ? rune : current));
  return { ...gear, [slot]: runes };
}

/**
 * Lecture d'une sauvegarde : absente (avant le 19/10/2026), les châsses sont vides ; à trois châsses (avant l'Éveil,
 * 21/10/2026), les deux de l'Éveil s'ajoutent vides.
 */
export function parseGearRunes(value: unknown, isRune: (rune: unknown) => rune is Rune): GearRunes | null {
  if (value === undefined) {
    return EMPTY_GEAR_RUNES;
  }
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const gear = value as Record<string, unknown>;
  const valid = SLOT_IDS.every((slot) => {
    const runes = gear[slot];
    return (
      Array.isArray(runes) &&
      runes.length >= 1 &&
      runes.length <= GEAR_SOCKETS_TOTAL &&
      runes.every((rune) => rune === null || isRune(rune))
    );
  });
  if (!valid) {
    return null;
  }
  const typed = gear as Record<SlotId, readonly (Rune | null)[]>;
  return Object.fromEntries(
    SLOT_IDS.map((slot) => [slot, [...typed[slot], ...emptySockets()].slice(0, GEAR_SOCKETS_TOTAL)]),
  ) as unknown as GearRunes;
}
