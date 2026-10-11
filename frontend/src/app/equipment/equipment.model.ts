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
  /** Stat garantie sur tout objet de cet emplacement. */
  readonly mainStat: StatId;
}

export const SLOTS: Readonly<Record<SlotId, SlotDefinition>> = {
  // La pioche frappe, les gants assurent la prise, la lampe du casque montre les points faibles,
  // les bottes donnent l'appui, le sac emporte plus d'or
  pickaxe: { label: 'Pioche', iconUrl: 'assets/ui/pickaxe.png', mainStat: 'strikePower' },
  gloves: { label: 'Gants', iconUrl: 'assets/ui/gloves.png', mainStat: 'critChance' },
  helmet: { label: 'Casque', iconUrl: 'assets/ui/helmet.png', mainStat: 'critDamage' },
  boots: { label: 'Bottes', iconUrl: 'assets/ui/boots.png', mainStat: 'miningSpeed' },
  bag: { label: 'Sac', iconUrl: 'assets/ui/backpack.png', mainStat: 'goldBonus' },
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
  /** Les dégâts sont entiers ; les autres stats sont des pourcentages. */
  readonly kind: 'integer' | 'percent';
}

export const STATS: Readonly<Record<StatId, StatDefinition>> = {
  strikePower: { label: 'Frappe', kind: 'integer' },
  miningSpeed: { label: 'Vitesse', kind: 'percent' },
  critChance: { label: 'Critique', kind: 'percent' },
  critDamage: { label: 'Dégâts crit.', kind: 'percent' },
  goldBonus: { label: 'Bonus d\'or', kind: 'percent' },
};
