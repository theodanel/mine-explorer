// Équilibrage de l'arbre de compétences et des sorts. Fichier pur, comme balance.ts, simulé par tools/simulate.mts.
// Budget mesuré par la simulation (joueur régulier, 90 jours) : arbre et artefact donnent ×1,4 de Puissance permanente,
// les explosions font environ 20 % des dégâts. Le coût de la pioche a été relevé (×2,03 par niveau au lieu de ×2)
// pour que la pioche 30 arrive toujours vers le jour 50 : ces systèmes font progresser autrement, pas plus vite.

/** Rareté d'un sort ou d'un artefact : elle donne la couleur de fond de son icône. */
export const RARITY_IDS = ['common', 'rare', 'epic', 'legendary'] as const;
export type Rarity = (typeof RARITY_IDS)[number];

export const RARITY_LABELS: Readonly<Record<Rarity, string>> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

/**
 * Bonus que l'arbre, les sorts et les artefacts peuvent donner. Les pourcentages sont en fraction (0.04 = 4 %).
 * Règle de cumul : les bonus d'une même famille s'additionnent, les familles (équipement, évolution, arbre,
 * artefact, sort actif) se multiplient. Les points de Critique, de Vitesse et de chance d'éclat s'ajoutent toujours.
 */
export const BONUS_IDS = [
  'strikePct',
  'critChance',
  'critDamage',
  'speed',
  'goldPct',
  'shardChance',
  'offlineEfficiency',
  'cooldownPct',
  'durationPct',
  'blastPct',
] as const;
export type BonusId = (typeof BONUS_IDS)[number];
export type Bonuses = Readonly<Record<BonusId, number>>;

export const NO_BONUSES: Bonuses = {
  strikePct: 0,
  critChance: 0,
  critDamage: 0,
  speed: 0,
  goldPct: 0,
  shardChance: 0,
  offlineEfficiency: 0,
  cooldownPct: 0,
  durationPct: 0,
  blastPct: 0,
};

// ─── Points ────────────────────────────────────────────────────────────────

/**
 * Chaque zone terminée donne 3 points. Un joueur régulier en a environ 6 le premier jour, 30 vers le jour 10
 * et 45 vers la zone 16, alors que l'arbre complet en coûte 67 : il faut choisir une voie principale.
 */
export const SKILL_POINTS_PER_ZONE = 3;

/** L'onglet s'ouvre à la zone 2 (choix de Théo, 18/10/2026), avec les 3 points de la zone 1 terminée. */
export const SKILLS_UNLOCK_ZONE = 2;

/**
 * Points à dépenser dans une branche pour ouvrir chaque rangée. La 5e rangée n'existe que dans les Sceaux : le sceau 5
 * s'ouvre une fois les quatre premiers payés (3 + 4 + 5 + 6 points).
 */
export const ROW_THRESHOLDS: readonly number[] = [0, 3, 7, 12, 18];

/** Un sort coûte 2 points à apprendre, puis 1 par rang. Un passif coûte 1 point par rang. */
export const SPELL_UNLOCK_COST = 2;
export const SPELL_MAX_RANK = 3;

/** Réinitialiser l'arbre coûte un segment de pioche du niveau actuel : assez pour réfléchir, pas pour punir. */
export const RESPEC_SEGMENTS = 1;

// ─── Sorts ─────────────────────────────────────────────────────────────────

export const SPELL_IDS = ['dynamite', 'frenzy', 'goldenVein', 'geologistEye', 'geodeEcho', 'firedamp'] as const;
export type SpellId = (typeof SPELL_IDS)[number];

/** Effet d'un sort. « blast » est un coup unique ; les autres durent quelques secondes. */
export type SpellEffect =
  | { readonly kind: 'blast'; readonly strike: number; readonly strikePerRank: number }
  | { readonly kind: 'speed'; readonly amount: number }
  | { readonly kind: 'crit' }
  | { readonly kind: 'gold'; readonly multiplier: number }
  | { readonly kind: 'shard'; readonly chance: number; readonly chancePerRank: number };

export interface SpellDef {
  readonly id: SpellId;
  readonly label: string;
  readonly rarity: Rarity;
  readonly cooldownMs: number;
  /** 0 pour un coup unique. */
  readonly durationMs: number;
  readonly durationPerRankMs: number;
  readonly effect: SpellEffect;
  /** Phrase courte affichée dans l'arbre et l'infobulle. */
  readonly summary: string;
}

const SECOND = 1000;

/**
 * Durée d'effet sur recharge : 7 à 17 % du temps au rang 1. En lancement automatique, chaque sort
 * vaut en moyenne +10 à +20 % de dégâts ou de gains, jamais un doublement.
 */
export const SPELLS: Readonly<Record<SpellId, SpellDef>> = {
  dynamite: {
    id: 'dynamite',
    label: 'Dynamite',
    rarity: 'common',
    cooldownMs: 30 * SECOND,
    durationMs: 0,
    durationPerRankMs: 0,
    effect: { kind: 'blast', strike: 6, strikePerRank: 2 },
    summary: 'Lance un bâton de dynamite qui inflige un gros coup au filon.',
  },
  frenzy: {
    id: 'frenzy',
    label: 'Frénésie',
    rarity: 'common',
    cooldownMs: 40 * SECOND,
    durationMs: 6 * SECOND,
    durationPerRankMs: 2 * SECOND,
    effect: { kind: 'speed', amount: 1 },
    summary: 'Le mineur frappe deux fois plus vite pendant quelques secondes.',
  },
  goldenVein: {
    id: 'goldenVein',
    label: 'Filon doré',
    rarity: 'rare',
    cooldownMs: 60 * SECOND,
    durationMs: 10 * SECOND,
    durationPerRankMs: 3 * SECOND,
    effect: { kind: 'gold', multiplier: 3 },
    summary: 'Le filon brille : chaque coup rapporte trois fois plus d\'or.',
  },
  geologistEye: {
    id: 'geologistEye',
    label: 'Œil du géologue',
    rarity: 'rare',
    cooldownMs: 45 * SECOND,
    durationMs: 6 * SECOND,
    durationPerRankMs: 2 * SECOND,
    effect: { kind: 'crit' },
    summary: 'Le mineur voit chaque faille : tous ses coups sont critiques.',
  },
  geodeEcho: {
    id: 'geodeEcho',
    label: 'Écho de géode',
    rarity: 'epic',
    cooldownMs: 120 * SECOND,
    durationMs: 8 * SECOND,
    durationPerRankMs: 0,
    effect: { kind: 'shard', chance: 0.1, chancePerRank: 0.05 },
    summary: 'Les géodes répondent au coup de pioche : chaque coup peut faire tomber un éclat.',
  },
  firedamp: {
    id: 'firedamp',
    label: 'Coup de grisou',
    rarity: 'legendary',
    cooldownMs: 90 * SECOND,
    durationMs: 0,
    durationPerRankMs: 0,
    effect: { kind: 'blast', strike: 25, strikePerRank: 8 },
    summary: 'Une poche de gaz s\'embrase : une explosion énorme secoue toute la galerie.',
  },
};

/** Les recharges ne descendent pas sous 60 % de leur durée, quels que soient les bonus. */
export const MAX_COOLDOWN_REDUCTION = 0.4;

export function spellCooldownMs(spell: SpellDef, cooldownPct: number): number {
  return spell.cooldownMs * (1 - Math.min(cooldownPct, MAX_COOLDOWN_REDUCTION));
}

export function spellDurationMs(spell: SpellDef, rank: number, durationPct: number): number {
  return (spell.durationMs + spell.durationPerRankMs * (rank - 1)) * (1 + durationPct);
}

/** Multiple de la Frappe d'un sort explosif à ce rang, bonus d'explosion compris. */
/**
 * Les explosions (sorts et compétence du familier) profitent de 40 % du bonus de critique du mineur (choix de Théo,
 * 26/10/2026). Avant, elles ignoraient le critique et tombaient sous 1 % des dégâts dès que le critique montait : un
 * coup moyen valait 7 Frappes en fin de partie. Avec cette part, la Dynamite et le Grisou pèsent chacun 10 à 13 % des
 * dégâts, quel que soit le stade de la partie.
 */
export const BLAST_CRIT_SHARE = 0.4;

export function blastCritFactor(critChance: number, critDamage: number): number {
  return 1 + BLAST_CRIT_SHARE * critChance * critDamage;
}

export function blastStrikeMultiplier(spell: SpellDef, rank: number, blastPct: number): number {
  if (spell.effect.kind !== 'blast') {
    return 0;
  }
  return (spell.effect.strike + spell.effect.strikePerRank * (rank - 1)) * (1 + blastPct);
}

export function shardEchoChance(spell: SpellDef, rank: number): number {
  return spell.effect.kind === 'shard' ? spell.effect.chance + spell.effect.chancePerRank * (rank - 1) : 0;
}

/** Nombre d'emplacements de sorts sous l'équipement. */
export const SPELL_SLOTS = 3;

// ─── Arbre ─────────────────────────────────────────────────────────────────

export const BRANCH_IDS = ['force', 'prospecting', 'mastery', 'seals'] as const;
export type BranchId = (typeof BRANCH_IDS)[number];

export const BRANCHES: Readonly<Record<BranchId, { readonly label: string; readonly summary: string }>> = {
  force: { label: 'Force', summary: 'Frapper plus fort et faire sauter la roche.' },
  prospecting: { label: 'Prospection', summary: 'Plus d\'or, plus d\'éclats, même pendant l\'absence.' },
  mastery: { label: 'Maîtrise', summary: 'Des sorts plus fréquents et plus longs.' },
  seals: { label: 'Sceaux', summary: 'Un sceau par phase du Divin corrompu : descendre assez profond pour l\'éveiller.' },
};

interface NodeBase {
  readonly id: string;
  readonly branch: BranchId;
  /** Rangée de 0 à 3 : il faut avoir dépensé ROW_THRESHOLDS[row] points dans la branche pour l'ouvrir. */
  readonly row: number;
}

export interface PassiveNode extends NodeBase {
  readonly kind: 'passive';
  readonly label: string;
  readonly maxRank: number;
  readonly bonus: BonusId;
  readonly perRank: number;
  readonly summary: string;
  /** Points par rang, quand ce n'est pas 1 (les sceaux). */
  readonly rankCost?: number;
}

export interface SpellNode extends NodeBase {
  readonly kind: 'spell';
  readonly spell: SpellId;
}

export type SkillNode = PassiveNode | SpellNode;

/** Points de chaque sceau, du 1er au 5e. Avec l'arbre complet (67 points), les 5 sceaux demandent la zone 32. */
const SEAL_COSTS = [3, 4, 5, 6, 7] as const;
/** Un sceau renforce un peu la Frappe : il n'est pas qu'une taxe. */
const SEAL_STRIKE_PCT = 0.1;

export const SKILL_NODES: readonly SkillNode[] = [
  // Force
  { kind: 'passive', id: 'firmGrip', branch: 'force', row: 0, label: 'Poigne solide', maxRank: 5, bonus: 'strikePct', perRank: 0.03, summary: 'Frappe' },
  { kind: 'spell', id: 'dynamite', branch: 'force', row: 0, spell: 'dynamite' },
  { kind: 'passive', id: 'sharpEye', branch: 'force', row: 1, label: 'Œil vif', maxRank: 5, bonus: 'critChance', perRank: 0.01, summary: 'Critique' },
  { kind: 'passive', id: 'preciseBlows', branch: 'force', row: 2, label: 'Coups précis', maxRank: 5, bonus: 'critDamage', perRank: 0.08, summary: 'Dégâts critiques' },
  { kind: 'spell', id: 'firedamp', branch: 'force', row: 3, spell: 'firedamp' },
  // Prospection
  { kind: 'passive', id: 'goldNose', branch: 'prospecting', row: 0, label: 'Flair de l\'or', maxRank: 5, bonus: 'goldPct', perRank: 0.05, summary: 'Or gagné' },
  { kind: 'spell', id: 'goldenVein', branch: 'prospecting', row: 1, spell: 'goldenVein' },
  { kind: 'passive', id: 'geodeHunter', branch: 'prospecting', row: 1, label: 'Chercheur de géodes', maxRank: 5, bonus: 'shardChance', perRank: 0.002, summary: 'Chance d\'éclat par coup' },
  { kind: 'passive', id: 'bottomlessBag', branch: 'prospecting', row: 2, label: 'Sac sans fond', maxRank: 5, bonus: 'offlineEfficiency', perRank: 0.05, summary: 'Or gagné pendant l\'absence' },
  { kind: 'spell', id: 'geodeEcho', branch: 'prospecting', row: 3, spell: 'geodeEcho' },
  // Maîtrise
  { kind: 'spell', id: 'frenzy', branch: 'mastery', row: 0, spell: 'frenzy' },
  { kind: 'passive', id: 'shortFuse', branch: 'mastery', row: 0, label: 'Mèche courte', maxRank: 5, bonus: 'cooldownPct', perRank: 0.04, summary: 'Recharge des sorts' },
  { kind: 'spell', id: 'geologistEye', branch: 'mastery', row: 1, spell: 'geologistEye' },
  { kind: 'passive', id: 'focus', branch: 'mastery', row: 2, label: 'Concentration', maxRank: 5, bonus: 'durationPct', perRank: 0.1, summary: 'Durée des sorts' },
  // Sceaux (27/10/2026) : chacun ouvre une phase du Divin corrompu. Les points venant de la profondeur atteinte dans la
  // vie, une phase demande d'être descendu assez loin, pas seulement d'avoir forgé
  ...SEAL_COSTS.map(
    (cost, index): PassiveNode => ({
      kind: 'passive',
      id: `seal${index + 1}`,
      branch: 'seals',
      row: index,
      label: `Sceau ${index + 1}`,
      maxRank: 1,
      bonus: 'strikePct',
      perRank: SEAL_STRIKE_PCT,
      summary: `Ouvre la phase ${index + 1} du Divin corrompu, et Frappe`,
      rankCost: cost,
    }),
  ),
  { kind: 'passive', id: 'blastMaster', branch: 'mastery', row: 3, label: 'Maître artificier', maxRank: 3, bonus: 'blastPct', perRank: 0.2, summary: 'Dégâts des explosions' },
];

export function nodeMaxRank(node: SkillNode): number {
  return node.kind === 'passive' ? node.maxRank : SPELL_MAX_RANK;
}

/** Points pour passer du rang `rank` au suivant. */
export function nodeRankCost(node: SkillNode, rank: number): number {
  if (node.kind === 'passive') {
    return node.rankCost ?? 1;
  }
  return rank === 0 ? SPELL_UNLOCK_COST : 1;
}

/** Sceaux appris, à la suite : le sceau N ouvre la phase N du Divin corrompu. */
export function sealsLearned(ranks: Readonly<Partial<Record<string, number>>>): number {
  let count = 0;
  while ((ranks[`seal${count + 1}`] ?? 0) > 0) {
    count++;
  }
  return count;
}
