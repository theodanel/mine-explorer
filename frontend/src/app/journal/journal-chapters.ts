// Carnet d'aventure (demande de Théo, 27/10/2026) : le vieux carnet d'Orvald, un mineur parti chercher le Cœur du
// monde avant le joueur. Chaque chapitre mêle une page de son journal (le lore) et les objectifs du joueur, griffonnés
// en dessous. Il guide la 1re boucle chapitre par chapitre, puis tient le journal de chaque vie. Fichier pur.

/** Ce que le jeu sait du joueur : tout ce que les objectifs regardent. */
export interface JournalFacts {
  readonly rocksBroken: number;
  readonly itemsForged: number;
  readonly pickaxeLevel: number;
  readonly piecesWorn: number;
  /** Pièces Divin portées de la famille de la vie en cours. */
  readonly divineOfFamily: number;
  readonly zone: number;
  /** 0 Apprenti, 1 Mineur, 2 Contremaître, 3 Maître des profondeurs, 4 Légende de la mine, 5 et plus : étoiles. */
  readonly formIndex: number;
  readonly skillPointsSpent: number;
  readonly companionActive: boolean;
  readonly workshopUpgrades: number;
  readonly campLevels: number;
  readonly abyssRecord: number;
  readonly astreStage: number;
  readonly seals: number;
  readonly phase: number;
  readonly rebirths: number;
}

export interface JournalObjective {
  readonly label: string;
  /** Où en est le joueur, et ce qu'il faut atteindre. */
  readonly progress: (facts: JournalFacts) => readonly [number, number];
}

export interface JournalChapter {
  readonly title: string;
  /** Page du journal d'Orvald. */
  readonly lore: string;
  readonly objectives: readonly JournalObjective[];
  /** Ce que le chapitre ouvre ou annonce, en une ligne. */
  readonly unlocks: string;
  /** Éclats de géode à la fin du chapitre. */
  readonly shards: number;
}

const FORM_MINER = 1;
const FORM_FOREMAN = 2;
const FORM_MASTER = 3;
const FORM_LEGEND = 4;
const FORM_FIRST_STAR = 5;
const SLOTS = 5;
const MAX_PICKAXE = 30;

function atLeast(label: string, read: (facts: JournalFacts) => number, target: number): JournalObjective {
  return { label, progress: (facts) => [Math.min(read(facts), target), target] };
}

/** Chapitres de la 1re boucle, du premier coup de pioche à la première renaissance. */
export const FIRST_LOOP: readonly JournalChapter[] = [
  {
    title: 'Le premier coup de pioche',
    lore:
      'Jour un. La galerie sent la poussière et le fer. Le vieux contremaître m’a donné une pioche émoussée et un ' +
      'conseil : « Frappe, forge, recommence. La roche finit toujours par parler. »',
    objectives: [atLeast('Casser 5 filons', (f) => f.rocksBroken, 5), atLeast('Forger un objet', (f) => f.itemsForged, 1)],
    unlocks: 'La pioche s’améliore avec l’or : meilleure pioche, meilleurs objets.',
    shards: 20,
  },
  {
    title: 'Une pioche digne de ce nom',
    lore:
      'Ma pioche chante enfin. Chaque niveau gagné, la forge me rend du meilleur métal. J’ai cousu une poche de plus ' +
      'à mon sac, pour les éclats qui brillent entre deux coups.',
    objectives: [atLeast('Pioche niveau 3', (f) => f.pickaxeLevel, 3), atLeast('Porter 3 pièces', (f) => f.piecesWorn, 3)],
    unlocks: 'Missions et statistiques : de quoi suivre tes progrès.',
    shards: 30,
  },
  {
    title: 'Le gardien de la zone 1',
    lore:
      'Au fond de la première galerie, un rocher refuse de céder. Il bouge, il respire. Les anciens l’appellent le ' +
      'gardien. Trente secondes, pas une de plus, avant qu’il ne se referme.',
    objectives: [atLeast('Battre le gardien et entrer en zone 2', (f) => f.zone, 2)],
    unlocks: 'Compétences et Compagnons : un œuf t’attend.',
    shards: 40,
  },
  {
    title: 'Ce que cache la roche',
    lore:
      'L’œuf trouvé près du gardien a éclos. La petite bête me suit partout. Le soir, je note ce que mes bras ont ' +
      'appris : chaque geste juste se grave dans la mémoire du corps.',
    objectives: [
      atLeast('Apprendre une compétence', (f) => f.skillPointsSpent, 1),
      { label: 'Avoir un compagnon avec toi', progress: (f) => [f.companionActive ? 1 : 0, 1] },
      atLeast('Atteindre la zone 3', (f) => f.zone, 3),
    ],
    unlocks: 'Artefacts : des reliques enfouies, plus vieilles que la mine.',
    shards: 50,
  },
  {
    title: 'Devenir Mineur',
    lore:
      'On ne m’appelle plus l’apprenti. Le forgeron m’a montré son atelier : on peut renforcer une pièce, encore et ' +
      'encore, si l’on rapporte le bon minerai.',
    objectives: [atLeast('Évoluer en Mineur', (f) => f.formIndex, FORM_MINER)],
    unlocks: 'Atelier : renforce tes pièces avec de l’or et du minerai.',
    shards: 60,
  },
  {
    title: 'Un camp sous terre',
    lore:
      'J’ai monté un camp dans une cavité sèche. Une taverne de fortune, un entrepôt, un puits qui recrache des éclats. ' +
      'Ici, je peux enfin dormir sans entendre la roche gronder.',
    objectives: [
      atLeast('Renforcer une pièce à l’Atelier', (f) => f.workshopUpgrades, 1),
      atLeast('Atteindre la zone 5', (f) => f.zone, 5),
    ],
    unlocks: 'Campement : tes bâtiments travaillent même quand tu es absent.',
    shards: 70,
  },
  {
    title: 'Le Contremaître',
    lore:
      'Les autres mineurs me suivent maintenant. Ils m’ont parlé d’un puits sans fond, d’un nain qui vend de drôles ' +
      'd’objets, et d’un jeu où l’on mise sa récolte. Je n’ai pas su dire non.',
    objectives: [
      atLeast('Construire un bâtiment', (f) => f.campLevels, 1),
      atLeast('Évoluer en Contremaître', (f) => f.formIndex, FORM_FOREMAN),
    ],
    unlocks: 'Aventures : Puits sans fond, Quitte ou double, marchand nain.',
    shards: 80,
  },
  {
    title: 'Maître des profondeurs',
    lore:
      'Le Puits ne finit jamais. Plus je descends, plus les murs ressemblent à des écailles. J’ai appris à forger vite, ' +
      'au rythme du marteau, avant que le métal ne refroidisse.',
    objectives: [
      atLeast('Descendre 25 étages du Puits', (f) => f.abyssRecord, 25),
      atLeast('Atteindre la zone 10', (f) => f.zone, 10),
      atLeast('Évoluer en Maître des profondeurs', (f) => f.formIndex, FORM_MASTER),
    ],
    unlocks: 'Forge express : bats le fer en rythme pour une meilleure pièce.',
    shards: 90,
  },
  {
    title: 'Légende de la mine',
    lore:
      'Ce matin, les galeries que j’avais vidées résonnaient à nouveau. Des échos. La roche y pleure des braises, du ' +
      'givre, de la sève. J’en ai rapporté au forgeron. Il a pâli et m’a montré une étoile gravée dans son enclume.',
    objectives: [atLeast('Évoluer en Légende de la mine', (f) => f.formIndex, FORM_LEGEND)],
    unlocks: 'Échos, Forge du Cœur et Astre : nourris l’Astre de ce que pleure la roche.',
    shards: 100,
  },
  {
    title: 'Le Cœur du monde',
    lore:
      'L’Astre s’est allumé. Une étoile, puis le silence. Je crois qu’il y a quelque chose tout en bas, quelque chose ' +
      'qui bat. Le forgeron dit que le Divin peut s’éveiller, s’il en a assez entendu.',
    objectives: [
      atLeast('Astre du Cœur au stade 1', (f) => f.astreStage, 1),
      atLeast('Obtenir la 1re étoile', (f) => f.formIndex, FORM_FIRST_STAR),
    ],
    unlocks: 'Éveil des pièces Divin, et châsses d’éclats d’Astre sur l’équipement.',
    shards: 120,
  },
  {
    title: 'La panoplie Divin',
    lore:
      'Cinq pièces de Divin, de la tête aux pieds. Elles sont chaudes au toucher, comme si quelque chose dormait dedans. ' +
      'Je garde toutes celles que je forge en trop : elles semblent s’appeler entre elles.',
    objectives: [
      atLeast('Pioche niveau 30', (f) => f.pickaxeLevel, MAX_PICKAXE),
      atLeast('Porter 5 pièces Divin', (f) => f.divineOfFamily, SLOTS),
    ],
    unlocks: 'Chaque Divin vendu devient un doublon : ils paieront l’Éveil.',
    shards: 140,
  },
  {
    title: 'Le Divin corrompu',
    lore:
      'J’ai éveillé le Divin. Il a noirci, une lave sourde court sous le métal. Ma force a doublé, et mes nuits sont ' +
      'pleines de feu. Un sceau est apparu sur ma main. Le Cœur m’appelle, et je crois que je vais répondre.',
    objectives: [
      atLeast('Apprendre le sceau 1 (Compétences, branche Sceaux)', (f) => f.seals, 1),
      atLeast('Éveiller les 5 pièces en phase 1', (f) => f.phase, 1),
    ],
    unlocks: 'Renaissance : recommence plus fort, ou descends encore pour plus de Braises.',
    shards: 160,
  },
  {
    title: 'Renaître',
    lore:
      'Si quelqu’un lit ces lignes, c’est que j’ai sauté. Le Cœur ne tue pas : il renvoie au début, plus fort, avec ' +
      'ce qu’on a appris. Les pages qui suivent ont été arrachées. Je les ai cachées plus bas, une par vie.',
    objectives: [atLeast('Faire ta première renaissance', (f) => f.rebirths, 1)],
    unlocks: 'Le carnet devient ton journal de vie : une page par phase.',
    shards: 200,
  },
];

const LIFE_PAGES = [
  'La page était coincée sous un filon de la zone 1. L’écriture tremble : « La deuxième fois, le métal a changé de ' +
    'couleur. Même le Bois sortait de la forge veiné de lave. »',
  '« Troisième vie. Je reconnais les galeries, mais elles sont plus dures, plus profondes. Le sceau sur ma main s’est ' +
    'élargi. Je n’ai plus peur. »',
  '« Quatrième vie. J’entends le Cœur battre même à la surface. Les pièces corrompues murmurent mon nom. Encore une, ' +
    'et je saurai. »',
  '« Dernière phase. Si je réussis, je ne renaîtrai plus pour le Cœur, mais pour moi. Je laisserai ce carnet au ' +
    'prochain. À toi, peut-être. »',
];

const PHASES = 5;

/** Page de la vie en cours, après la 1re boucle : la phase de cette vie, ou la suite sans fin après la phase 5. */
export function lifeChapter(rebirths: number): JournalChapter {
  const phase = rebirths + 1;
  if (phase > PHASES) {
    return {
      title: `Vie ${phase} : au-delà des phases`,
      lore:
        'La dernière page n’est pas d’Orvald. C’est ton écriture. « Le Cœur bat toujours. Chaque vie me rend plus fort, ' +
        'chaque vie descend plus bas. Je ne cherche plus la fin. Je cherche le fond. »',
      objectives: [atLeast('Atteindre la zone 20 pour renaître', (f) => f.zone, 20)],
      unlocks: 'Constellation de l’Astre, pièces ✦ et Offrande au Cœur.',
      shards: 200,
    };
  }
  return {
    title: `Vie ${phase} : la phase ${phase}`,
    lore: LIFE_PAGES[Math.min(rebirths - 1, LIFE_PAGES.length - 1)],
    objectives: [
      atLeast('Pioche niveau 30', (f) => f.pickaxeLevel, MAX_PICKAXE),
      atLeast(`Porter 5 pièces Divin corrompu ${phase - 1}`, (f) => f.divineOfFamily, SLOTS),
      atLeast(`Apprendre le sceau ${phase}`, (f) => f.seals, phase),
      atLeast(`Éveiller les 5 pièces en phase ${phase}`, (f) => f.phase, phase),
    ],
    unlocks: 'Renaissance : la famille suivante du Divin corrompu t’attend.',
    shards: 200,
  };
}

/** Le chapitre `index` du carnet : la 1re boucle, puis une page par vie. */
export function chapterAt(index: number, rebirths: number): JournalChapter {
  return index < FIRST_LOOP.length ? FIRST_LOOP[index] : lifeChapter(rebirths);
}

export function objectiveDone(objective: JournalObjective, facts: JournalFacts): boolean {
  const [current, target] = objective.progress(facts);
  return current >= target;
}

export function chapterDone(chapter: JournalChapter, facts: JournalFacts): boolean {
  return chapter.objectives.every((objective) => objectiveDone(objective, facts));
}

/**
 * Chapitres déjà faits par une partie avancée qui découvre le carnet : ils se cochent d'office, sans récompense.
 * On s'arrête au premier chapitre pas encore rempli.
 */
export function chaptersAlreadyDone(facts: JournalFacts): number {
  let index = 0;
  while (index < FIRST_LOOP.length && chapterDone(FIRST_LOOP[index], facts)) {
    index++;
  }
  return index;
}
