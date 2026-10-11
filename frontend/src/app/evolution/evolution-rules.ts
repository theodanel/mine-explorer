// Règles pures de l'évolution du mineur : conditions et coût de la forme suivante.
import { EVOLUTION_FORMS, EvolutionForm } from '../balance/balance';
import { TIER_IDS, TierId } from '../equipment/equipment.model';
import type { OreStock } from '../ores/ores';

export interface Requirement {
  readonly label: string;
  readonly have: number;
  readonly need: number;
  readonly met: boolean;
  /** Matériau concerné, pour afficher sa couleur ; null pour la zone et l'or. */
  readonly tier: TierId | null;
}

/** Forme suivante, ou null si le mineur est déjà à sa dernière forme. */
export function nextForm(formIndex: number): EvolutionForm | null {
  return EVOLUTION_FORMS[formIndex + 1] ?? null;
}

/** Toutes les conditions de la forme suivante, avec ce que le joueur possède déjà. */
export function requirementsFor(
  form: EvolutionForm,
  zone: number,
  ores: OreStock,
  gold: number,
  tierLabel: (tier: TierId) => string,
): Requirement[] {
  const oreRequirements = TIER_IDS.filter((tier) => (form.ores[tier] ?? 0) > 0).map((tier) => {
    const need = form.ores[tier] ?? 0;
    return { label: `Minerai : ${tierLabel(tier)}`, have: ores[tier], need, met: ores[tier] >= need, tier };
  });
  return [
    { label: `Atteindre la zone ${form.minZone}`, have: zone, need: form.minZone, met: zone >= form.minZone, tier: null },
    ...oreRequirements,
    { label: 'Or', have: gold, need: form.gold, met: gold >= form.gold, tier: null },
  ];
}

export function canEvolve(requirements: readonly Requirement[]): boolean {
  return requirements.every((requirement) => requirement.met);
}
