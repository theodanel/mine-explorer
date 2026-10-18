// Prise en main (retours Discord du 18/10/2026, ajustés par Théo) : tout est visible dès le début, grisé et bloqué
// tant que ce n'est pas disponible. Une bulle d'une ligne présente chaque élément du panneau du bas au moment où il
// sert, et chaque onglet du menu du bas à son ouverture. Fichier pur : règles et textes, sans Angular. Voir docs/game-design/devoilement-progressif.md.

export const REVEAL_IDS = [
  'forge',
  'equipment',
  'missions',
  'pickaxe',
  'stats',
  'forgeTools',
  'skills',
  'companions',
  'artifacts',
  'workshop',
  'adventures',
] as const;
export type RevealId = (typeof REVEAL_IDS)[number];

/** Ce que le joueur a fait ou peut faire : tout ce qui décide qu'un élément est présenté. */
export interface RevealFacts {
  readonly itemsForged: number;
  readonly segmentsPaid: number;
  readonly pickaxeLevel: number;
  readonly canForge: boolean;
  readonly canPaySegment: boolean;
  readonly skillsOpen: boolean;
  readonly companionsOpen: boolean;
  readonly artifactsOpen: boolean;
  readonly workshopOpen: boolean;
  readonly adventuresOpen: boolean;
}

/** L'or suffit vite pour un segment de pioche : sa bulle attend que le joueur ait forgé deux fois. */
const ITEMS_FOR_PICKAXE = 2;
/** Les statistiques n'ont de sens qu'avec quelques objets portés à comparer. */
const ITEMS_FOR_STATS = 3;
/** Auto et Filtres servent quand forger devient une routine. */
const ITEMS_FOR_FORGE_TOOLS = 10;

interface RevealRule {
  readonly id: RevealId;
  readonly when: (facts: RevealFacts) => boolean;
  /** Bulle d'une ligne montrée à ce moment-là. */
  readonly hint: string;
}

/** Dans l'ordre où un joueur les rencontre : les bulles qui arrivent ensemble passent dans cet ordre. */
const REVEAL_RULES: readonly RevealRule[] = [
  {
    id: 'forge',
    when: (facts) => facts.canForge || facts.itemsForged > 0,
    hint: 'Des éclats ! Touche l’enclume pour forger ton premier équipement.',
  },
  {
    id: 'equipment',
    when: (facts) => facts.itemsForged > 0,
    hint: 'Ton équipement porté : chaque pièce rend ton mineur plus fort.',
  },
  {
    id: 'missions',
    when: (facts) => facts.itemsForged > 0,
    hint: 'Tes missions : suis-les, elles rapportent des éclats.',
  },
  {
    id: 'pickaxe',
    when: (facts) => facts.segmentsPaid > 0 || facts.pickaxeLevel > 1 || (facts.itemsForged >= ITEMS_FOR_PICKAXE && facts.canPaySegment),
    hint: 'Assez d’or : améliore ta pioche pour forger de meilleurs objets.',
  },
  {
    id: 'stats',
    when: (facts) => facts.itemsForged >= ITEMS_FOR_STATS,
    hint: 'Toutes les forces de ton mineur, en un coup d’œil.',
  },
  {
    id: 'forgeTools',
    when: (facts) => facts.itemsForged >= ITEMS_FOR_FORGE_TOOLS,
    hint: 'Auto forge à ta place ; les filtres vendent ce qui ne te sert pas.',
  },
  {
    id: 'skills',
    when: (facts) => facts.skillsOpen,
    hint: 'Nouveau : les Compétences. Dépense tes points pour renforcer ton mineur.',
  },
  {
    id: 'companions',
    when: (facts) => facts.companionsOpen,
    hint: 'Nouveau : les Compagnons, avec un premier œuf offert.',
  },
  {
    id: 'artifacts',
    when: (facts) => facts.artifactsOpen,
    hint: 'Nouveau : les Artefacts. Ton premier t’attend !',
  },
  {
    id: 'workshop',
    when: (facts) => facts.workshopOpen,
    hint: 'Nouveau : l’Atelier vient d’ouvrir.',
  },
  {
    id: 'adventures',
    when: (facts) => facts.adventuresOpen,
    hint: 'Nouveau : les Aventures et leur Campement.',
  },
];

function ruleOf(id: RevealId): RevealRule {
  return REVEAL_RULES.find((rule) => rule.id === id)!;
}

/** Éléments à présenter maintenant, dans l'ordre de rencontre. */
export function newlyRevealed(facts: RevealFacts, revealed: ReadonlySet<RevealId>): RevealId[] {
  return REVEAL_RULES.filter((rule) => !revealed.has(rule.id) && rule.when(facts)).map((rule) => rule.id);
}

/** La bulle n'a plus lieu d'être quand le joueur a déjà fait ce qu'elle propose (forgé avant de la voir). */
export function hintDone(id: RevealId, facts: RevealFacts): boolean {
  switch (id) {
    case 'forge':
      return facts.itemsForged > 0;
    case 'pickaxe':
      return facts.segmentsPaid > 0;
    default:
      return false;
  }
}

export function revealHint(id: RevealId): string {
  return ruleOf(id).hint;
}

/** Seul un vrai début de partie présente le jeu pas à pas : un joueur qui a déjà avancé voit tout, comme avant. */
export function isNewGame(zone: number, stage: number): boolean {
  return zone === 1 && stage === 1;
}

/** Sauvegarde : la liste des éléments déjà présentés, ou null si elle est abîmée. */
export function parseRevealed(raw: unknown): RevealId[] | null {
  if (!Array.isArray(raw) || !raw.every((id) => (REVEAL_IDS as readonly unknown[]).includes(id))) {
    return null;
  }
  return [...new Set(raw as RevealId[])];
}
