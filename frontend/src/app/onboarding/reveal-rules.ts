// Dévoilement progressif de l'interface (retours Discord du 18/10/2026) : au premier lancement, seuls le mineur,
// son filon et l'or sont à l'écran. Chaque élément apparaît quand le jeu en a besoin, avec une bulle d'une ligne.
// Fichier pur : règles et textes, sans Angular. Voir docs/game-design/devoilement-progressif.md.

export const REVEAL_IDS = ['forge', 'missions', 'equipment', 'pickaxe', 'stats', 'forgeTools', 'footer', 'lottery'] as const;
export type RevealId = (typeof REVEAL_IDS)[number];

/** Ce que le joueur a fait ou peut faire : tout ce qui décide qu'un élément apparaît. */
export interface RevealFacts {
  readonly rocksBroken: number;
  readonly itemsForged: number;
  readonly segmentsPaid: number;
  readonly pickaxeLevel: number;
  readonly canForge: boolean;
  readonly canPaySegment: boolean;
  readonly zone: number;
}

/** L'or suffit vite pour un segment de pioche : elle attend que le joueur ait forgé deux fois. */
const ITEMS_FOR_PICKAXE = 2;
/** Les statistiques n'ont de sens qu'avec quelques objets portés à comparer. */
const ITEMS_FOR_STATS = 3;
/** Auto et Filtres servent quand forger devient une routine. */
const ITEMS_FOR_FORGE_TOOLS = 10;
/** Le menu du bas s'ouvre en quittant la première zone ; la roue du jour, à la suivante. */
const FOOTER_ZONE = 2;
const LOTTERY_ZONE = 3;

interface RevealRule {
  readonly id: RevealId;
  readonly when: (facts: RevealFacts) => boolean;
  /** Bulle d'une ligne montrée à l'apparition. */
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
    // Après le premier objet : la pioche améliore la forge, elle n'a de sens qu'une fois la forge comprise
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
    id: 'footer',
    when: (facts) => facts.zone >= FOOTER_ZONE,
    hint: 'Nouvelle zone : le menu du bas s’ouvre, d’autres onglets suivront.',
  },
  {
    id: 'lottery',
    when: (facts) => facts.zone >= LOTTERY_ZONE,
    hint: 'La roue du jour : un tirage gratuit chaque jour.',
  },
];

/** Éléments à dévoiler maintenant, dans l'ordre de rencontre. */
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
  return REVEAL_RULES.find((rule) => rule.id === id)!.hint;
}

/** Seul un vrai début de partie cache l'interface : un joueur qui a déjà avancé voit tout, comme avant. */
export function isNewGame(zone: number, stage: number): boolean {
  return zone === 1 && stage === 1;
}

/** Sauvegarde : la liste des éléments déjà dévoilés, ou null si elle est abîmée. */
export function parseRevealed(raw: unknown): RevealId[] | null {
  if (!Array.isArray(raw) || !raw.every((id) => (REVEAL_IDS as readonly unknown[]).includes(id))) {
    return null;
  }
  return [...new Set(raw as RevealId[])];
}
