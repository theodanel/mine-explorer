// Étapes du tutoriel du premier lancement. Fichier pur : textes et règles, sans Angular.

/** Comment le joueur passe à l'étape suivante. */
export type StepAdvance =
  /** Un toucher n'importe où suffit : l'étape explique, elle ne demande rien. */
  | 'tap'
  /** Le joueur doit toucher l'élément ciblé, qui fait son action normale (la forge forge vraiment). */
  | 'target';

/** Condition de jeu à attendre, écran libre, avant de montrer l'étape. */
export type StepWait = 'none' | 'canForge' | 'noPendingItem';

export interface TutorialStep {
  /** Valeur de l'attribut data-tuto de l'élément ciblé. */
  readonly target: string;
  readonly title: string;
  readonly text: string;
  readonly advance: StepAdvance;
  readonly waitFor: StepWait;
}

/**
 * Quatre étapes, une phrase chacune : juste de quoi comprendre la boucle du jeu, sans lasser.
 * La forge attend que le joueur ait ses premiers éclats ; la pioche attend que l'objet forgé soit rangé.
 */
export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    target: 'rock',
    title: 'Ton filon',
    text: 'Ton mineur creuse tout seul. Chaque filon épuisé rapporte de l’or et des éclats de géode.',
    advance: 'tap',
    waitFor: 'none',
  },
  {
    target: 'forge',
    title: 'La forge',
    text: 'Tu as des éclats : touche la forge pour fabriquer ton premier équipement.',
    advance: 'target',
    waitFor: 'canForge',
  },
  {
    target: 'pickaxe',
    title: 'La pioche',
    text: 'Dépense ton or ici : une meilleure pioche forge de meilleurs objets.',
    advance: 'tap',
    waitFor: 'noPendingItem',
  },
  {
    target: 'missions',
    title: 'Les missions',
    text: 'Suis les missions pour gagner des éclats. Le menu du bas s’ouvre au fil de ta progression. Bonne mine !',
    advance: 'tap',
    waitFor: 'none',
  },
];

/** Étape suivante, ou null quand le tutoriel est fini. */
export function nextStep(index: number): number | null {
  return index + 1 < TUTORIAL_STEPS.length ? index + 1 : null;
}

/** Seul un vrai début de partie déclenche le tutoriel : un joueur qui a déjà avancé ne le voit jamais. */
export function isNewGame(zone: number, stage: number): boolean {
  return zone === 1 && stage === 1;
}
