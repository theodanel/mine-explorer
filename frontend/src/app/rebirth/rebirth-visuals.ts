// Montée visuelle de puissance de la Renaissance (demande de Théo, 25/10/2026 : « il doit y avoir une réelle montée
// visuelle de puissance ») : emblème en chiffres romains, lueur du mineur et couleur des chiffres de dégâts qui
// changent de palier en palier.

const ROMAN: readonly (readonly [number, string])[] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

/** Emblème de la Renaissance : « I », « II », « IV »… ; vide avant la première. */
export function romanNumeral(count: number): string {
  let rest = Math.max(Math.floor(count), 0);
  let text = '';
  for (const [value, symbol] of ROMAN) {
    while (rest >= value) {
      text += symbol;
      rest -= value;
    }
  }
  return text;
}

/** Palier de la lueur : une couleur nouvelle toutes les 3 renaissances, de la braise au bleu du Cœur, puis au blanc. */
export interface RebirthAura {
  /** Couleur de la lueur et des chiffres de dégâts (0xRRGGBB). */
  readonly color: number;
  /** Intensité de 0 à 1 dans le palier : la lueur grandit avant de changer de couleur. */
  readonly intensity: number;
  /** Agrandissement des chiffres de dégâts. */
  readonly textScale: number;
}

const AURA_COLORS = [0xffb347, 0xff6a2a, 0xff3d7f, 0xb36bff, 0x4fc3ff, 0x6bffd1, 0xfff4b8] as const;
const REBIRTHS_PER_COLOR = 3;
/** Les chiffres de dégâts grossissent de 4 % par renaissance, jusqu'à 60 % de plus. */
const TEXT_SCALE_PER_REBIRTH = 0.04;
const TEXT_SCALE_MAX = 1.6;

/** Lueur du mineur pour ce nombre de renaissances, ou null avant la première. */
export function rebirthAura(count: number): RebirthAura | null {
  if (count <= 0) {
    return null;
  }
  const step = Math.min(Math.floor((count - 1) / REBIRTHS_PER_COLOR), AURA_COLORS.length - 1);
  const inStep = ((count - 1) % REBIRTHS_PER_COLOR) + 1;
  return {
    color: AURA_COLORS[step],
    intensity: inStep / REBIRTHS_PER_COLOR,
    textScale: Math.min(1 + count * TEXT_SCALE_PER_REBIRTH, TEXT_SCALE_MAX),
  };
}

/** Couleur CSS de la lueur, pour l'emblème et les pages. */
export function auraCss(aura: RebirthAura | null): string | null {
  return aura === null ? null : `#${aura.color.toString(16).padStart(6, '0')}`;
}
