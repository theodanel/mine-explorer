// Formats de nombres partagés par les écrans.

const COMPACT = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

/** Nombre court et lisible, comme le compteur d'or du haut : « 4,3 M » plutôt que « 4303846 ». */
export function compactNumber(value: number): string {
  return COMPACT.format(value);
}
