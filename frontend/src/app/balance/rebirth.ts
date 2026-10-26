// Équilibrage de la Renaissance, la boucle de fin de partie (choix de Théo, 25/10/2026) : à partir de la zone 20, le
// joueur renaît quelques zones avant son record avec ses acquis de long terme, gagne des Braises du Cœur et les dépense dans un arbre
// permanent qui fait grimper ses dégâts. Chaque vie va plus vite et plus loin, mais les filons durcissent à chaque
// renaissance : on avance en se battant. Voir docs/game-design/renaissance.md. Simulé par tools/simulate.mts.

/** Zone à atteindre pour pouvoir renaître. */
export const REBIRTH_MIN_ZONE = 20;
/** Les Braises comptent les zones au-delà de celle-ci, au carré : pousser un peu plus loin rapporte nettement plus. */
const EMBERS_BASE_ZONE = 15;

/** Braises par zone au carré : de quoi acheter plusieurs paliers dès la première renaissance. */
const EMBERS_PER_SQUARED_ZONE = 10;

/** Braises du Cœur gagnées en renaissant depuis cette zone : 250 en zone 20, 490 en zone 22, 810 en zone 24. */
export function rebirthEmbers(zone: number): number {
  return zone < REBIRTH_MIN_ZONE ? 0 : EMBERS_PER_SQUARED_ZONE * (zone - EMBERS_BASE_ZONE) ** 2;
}

/**
 * Dureté des filons : leurs PV sont multipliés par ce facteur à chaque renaissance (×2,9 vaut une zone). Les zones
 * continuent sans fin au-delà de la 20, toujours plus dures.
 */
const HARDNESS_PER_REBIRTH = 1.3;

export function rebirthHardness(rebirths: number): number {
  return HARDNESS_PER_REBIRTH ** Math.max(rebirths, 0);
}

export const REBIRTH_BRANCHES = ['strike', 'speed', 'pickaxe', 'shortcut', 'shards', 'essences', 'gold'] as const;
export type RebirthBranch = (typeof REBIRTH_BRANCHES)[number];

export interface RebirthBranchDefinition {
  readonly label: string;
  /** Effet d'un palier, en clair. */
  readonly describe: (level: number) => string;
  readonly maxLevel: number;
  /** Braises du palier suivant `level` (0 : le premier palier). */
  readonly cost: (level: number) => number;
}

/** Le palier coûte un peu plus à chaque fois : base × (palier + 1). */
function linear(base: number): (level: number) => number {
  return (level) => base * (level + 1);
}

/** Paliers d'un gain en pourcentage : « +25 % ». */
function percent(value: number): string {
  return `+${Math.round(value * 100)} %`;
}

/** Frappe : chaque palier multiplie les dégâts, c'est la grosse hausse que le joueur sent d'une vie à l'autre. */
export const REBIRTH_STRIKE_PER_LEVEL = 0.4;
/** Vitesse de frappe en plus, par palier. */
export const REBIRTH_SPEED_PER_LEVEL = 0.04;
/** Niveaux de pioche avec lesquels on renaît, par palier. */
export const REBIRTH_PICKAXE_PER_LEVEL = 3;
/**
 * Zones d'écart entre le record et la zone où l'on renaît, selon le palier du raccourci (choix de Théo, 26/10/2026) :
 * chaque vie repart près du mur au lieu de retraverser des zones devenues une formalité. Avant, le raccourci donnait
 * une zone fixe (1 à 15).
 */
export const REBIRTH_SHORTCUT_GAPS = [10, 9, 8, 7, 6, 5, 4] as const;
/** Éclats de géode en plus, par palier. */
export const REBIRTH_SHARDS_PER_LEVEL = 0.15;
/** Ressources du Cœur en plus par filon d'Écho, par palier. */
export const REBIRTH_ESSENCES_PER_LEVEL = 1;
/** Part de l'or qui repart avec le mineur, par palier. */
export const REBIRTH_GOLD_PER_LEVEL = 0.1;

export const REBIRTH_TREE: Readonly<Record<RebirthBranch, RebirthBranchDefinition>> = {
  strike: {
    label: 'Frappe ancestrale',
    describe: (level) => `Frappe ×${((1 + REBIRTH_STRIKE_PER_LEVEL) ** level).toFixed(2).replace('.', ',')}`,
    // Sans fin, comme les zones : la Frappe suit toujours
    maxLevel: 1000,
    cost: linear(10),
  },
  speed: {
    label: 'Bras infatigable',
    describe: (level) => `${percent(level * REBIRTH_SPEED_PER_LEVEL)} de vitesse de frappe`,
    maxLevel: 10,
    cost: linear(25),
  },
  pickaxe: {
    label: 'Pioche mémoire',
    describe: (level) => `Pioche au niveau ${1 + level * REBIRTH_PICKAXE_PER_LEVEL} en renaissant`,
    maxLevel: 8,
    cost: linear(30),
  },
  shortcut: {
    label: 'Raccourci',
    describe: (level) => `Renaître ${REBIRTH_SHORTCUT_GAPS[level]} zones avant ton record`,
    maxLevel: REBIRTH_SHORTCUT_GAPS.length - 1,
    cost: linear(60),
  },
  shards: {
    label: 'Forge vive',
    describe: (level) => `${percent(level * REBIRTH_SHARDS_PER_LEVEL)} d'éclats de géode`,
    maxLevel: 10,
    cost: linear(30),
  },
  essences: {
    label: 'Mémoire du Cœur',
    describe: (level) => `+${level * REBIRTH_ESSENCES_PER_LEVEL} ressource du Cœur par filon d'Écho`,
    maxLevel: 5,
    cost: linear(50),
  },
  gold: {
    label: 'Bourse héritée',
    describe: (level) => `${percent(level * REBIRTH_GOLD_PER_LEVEL)} de l'or gardé en renaissant`,
    maxLevel: 5,
    cost: linear(20),
  },
};

/**
 * Forge renforcée (choix de Théo, 26/10/2026) : chaque renaissance, les pièces forgées sont plus fortes, au même rythme
 * que la dureté des filons. Une pièce en Bois d'une 5e vie reste utile. Seules les stats sans plafond grandissent
 * (Frappe, dégâts critiques, or) : la vitesse et le critique ont un plafond.
 */
export const REBIRTH_GEAR_POWER = 1.3;
export const REBIRTH_GEAR_STATS = ['strikePower', 'critDamage', 'goldBonus'] as const;

export function rebirthGearPower(rebirths: number): number {
  return REBIRTH_GEAR_POWER ** Math.max(rebirths, 0);
}

/**
 * Offrande au Cœur (choix de Théo, 27/10/2026) : l'or s'échange contre des Braises. Le prix se compte en filons de la
 * zone atteinte (dureté comprise), comme le revenu, et grimpe de 50 % à chaque offrande de la vie : un puits sans fond qui
 * redonne de la valeur à l'or en fin de jeu. 10 Braises valent un palier de Frappe au début de l'arbre.
 */
export const OFFERING_EMBERS = 10;
const OFFERING_FIRST_ROCKS = 200;
const OFFERING_GROWTH = 1.5;

/** Or demandé pour l'offrande suivante, `offerings` étant le nombre déjà faites dans cette vie. */
export function offeringCost(rockGold: number, offerings: number): number {
  return Math.round(rockGold * OFFERING_FIRST_ROCKS * OFFERING_GROWTH ** offerings);
}
