// Types et libellés de l'équipement. Les nombres d'équilibrage sont tous dans balance/balance.ts.

export const SLOT_IDS = ['helmet', 'pickaxe', 'bag', 'gloves', 'boots'] as const;
export type SlotId = (typeof SLOT_IDS)[number];

/** Paliers de matériaux, du plus faible au plus fort. Ils remplacent les raretés classiques. */
export const TIER_IDS = ['wood', 'stone', 'copper', 'iron', 'steel', 'gold', 'mithril', 'crystal', 'magma', 'divine'] as const;
export type TierId = (typeof TIER_IDS)[number];

export const STAT_IDS = ['strikePower', 'miningSpeed', 'critChance', 'critDamage', 'goldBonus'] as const;
export type StatId = (typeof STAT_IDS)[number];

/** Pourcentages stockés en fraction : 0.05 = 5 %. */
export type MiningStats = Record<StatId, number>;

export interface Item {
  readonly id: string;
  readonly slot: SlotId;
  readonly tier: TierId;
  /** Niveau de l'objet : celui de la pioche qui l'a forgé. */
  readonly level: number;
  readonly stats: Readonly<Partial<MiningStats>>;
}

export type EquippedItems = Readonly<Partial<Record<SlotId, Item>>>;

interface SlotDefinition {
  readonly label: string;
  /** Chemin de l'icône, servie depuis public/. */
  readonly iconUrl: string;
  /**
   * Stat que l'Atelier renforce pour cet emplacement. Depuis les builds libres, un objet peut porter n'importe
   * quelle stat : celle-ci ne dit plus ce que l'objet porte, seulement ce que l'Atelier multiplie.
   */
  readonly workshopStat: StatId;
}

export const SLOTS: Readonly<Record<SlotId, SlotDefinition>> = {
  // L'Atelier garde l'esprit de chaque pièce : la pioche frappe, les gants assurent la prise, la lampe du casque
  // montre les points faibles, les bottes donnent l'appui, le sac emporte plus d'or
  pickaxe: { label: 'Pioche', iconUrl: 'assets/ui/pickaxe.png', workshopStat: 'strikePower' },
  gloves: { label: 'Gants', iconUrl: 'assets/ui/gloves.png', workshopStat: 'critChance' },
  helmet: { label: 'Casque', iconUrl: 'assets/ui/helmet.png', workshopStat: 'critDamage' },
  boots: { label: 'Bottes', iconUrl: 'assets/ui/boots.png', workshopStat: 'miningSpeed' },
  bag: { label: 'Sac', iconUrl: 'assets/ui/backpack.png', workshopStat: 'goldBonus' },
};

/**
 * Affinités : les deux stats que chaque emplacement porte le plus souvent en affixe (demande de Théo, 15/10/2026 :
 * « il n'y a pas de réel composition de stats »). On sait où chercher le Critique ou la Vitesse. La première est
 * aussi celle que l'Atelier renforce.
 */
export const SLOT_AFFINITIES: Readonly<Record<SlotId, readonly [StatId, StatId]>> = {
  pickaxe: ['strikePower', 'critDamage'],
  gloves: ['critChance', 'strikePower'],
  helmet: ['critDamage', 'critChance'],
  boots: ['miningSpeed', 'goldBonus'],
  bag: ['goldBonus', 'miningSpeed'],
};

export const TIER_LABELS: Readonly<Record<TierId, string>> = {
  wood: 'Bois',
  stone: 'Pierre',
  copper: 'Cuivre',
  iron: 'Fer',
  steel: 'Acier',
  gold: 'Or',
  mithril: 'Mithril',
  crystal: 'Cristal',
  magma: 'Magma',
  divine: 'Divin',
};

interface StatDefinition {
  readonly label: string;
  /** Explication affichée en infobulle. */
  readonly description: string;
  /** Les dégâts sont entiers ; les autres stats sont des pourcentages. */
  readonly kind: 'integer' | 'percent';
}

export const STATS: Readonly<Record<StatId, StatDefinition>> = {
  strikePower: { label: 'Frappe', description: 'Dégâts de chaque coup de pioche.', kind: 'integer' },
  miningSpeed: { label: 'Vitesse', description: 'Coups de pioche en plus par seconde.', kind: 'percent' },
  critChance: { label: 'Critique', description: 'Chance qu\'un coup soit critique.', kind: 'percent' },
  critDamage: { label: 'Dégâts crit.', description: 'Dégâts en plus d\'un coup critique.', kind: 'percent' },
  goldBonus: { label: 'Bonus d\'or', description: 'Or en plus gagné en minant.', kind: 'percent' },
};
