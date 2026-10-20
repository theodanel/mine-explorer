/** Une mise en production, telle que les joueurs la découvrent au premier lancement qui suit. */
export interface Release {
  /** Identifiant unique et croissant : la date de mise en production (AAAA-MM-JJ), suffixée si deux le même jour. */
  readonly id: string;
  readonly title: string;
  readonly fixes: readonly string[];
}

/**
 * Notes des mises en production, de la plus récente à la plus ancienne. Ajouter une entrée en tête à chaque
 * PR staging vers main qui change quelque chose de visible pour les joueurs.
 */
export const RELEASES: readonly Release[] = [
  {
    id: '2026-10-20',
    title: 'Corrections du 20 octobre',
    fixes: [
      'Difficulté des filons des zones Écho réduite',
      'Correctif : dans les zones Écho, les ressources tombent désormais correctement',
      'Correctif : la vérification de la sauvegarde Google est moins stricte',
      'Classements mis à jour en direct',
    ],
  },
];
