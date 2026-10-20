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
    id: '2026-10-21',
    title: 'Corrections du 21 octobre',
    fixes: [
      'Zones d’Écho : chaque filon se casse désormais en 2 minutes environ, au lieu de plusieurs heures.',
      'Zones d’Écho : les essences pour les runes tombent bien, et « +1 essence » s’affiche à chaque gain.',
      'Sauvegarde Google : la vérification était trop stricte et refusait des parties honnêtes, elle est corrigée.',
      'Classements : ils se mettent à jour en direct, sans recharger la page.',
    ],
  },
];
