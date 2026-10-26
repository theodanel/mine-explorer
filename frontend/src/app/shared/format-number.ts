// Formats de nombres partagés par les écrans.

const COMPACT = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Au-delà de 1 000 Bn, le format français n'a plus d'unité et écrit « 32 000 Bn » : on passe à la notation
 * scientifique, courte quelle que soit la taille (les chiffres de la renaissance n'ont pas de limite).
 */
const SCIENTIFIC_FROM = 1e15;
const SCIENTIFIC = new Intl.NumberFormat('fr-FR', { notation: 'scientific', maximumFractionDigits: 2 });

/** Nombre court et lisible, comme le compteur d'or du haut : « 4,3 M » plutôt que « 4303846 », « 3,2E16 » au-delà. */
export function compactNumber(value: number): string {
  return Math.abs(value) >= SCIENTIFIC_FROM ? SCIENTIFIC.format(value) : COMPACT.format(value);
}
