// Équilibrage du Défi de la mine : la page d'événement qui donne les œufs de compagnon.
// Fichier pur, simulé par tools/simulate.mts. Voir docs/game-design/refonte-compagnons-evolution.md.
import type { Rarity } from './skill-tree';

/** Un défi dure 3 jours (heure du joueur), puis recommence avec le compteur à zéro. */
export const CHALLENGE_DAYS = 3;

/** Points gagnés en jouant : « casser le plus de cailloux », mais aussi forger et toucher les événements. */
export const CHALLENGE_POINTS = { rocksBroken: 5, itemsForged: 1, eventsTouched: 3 } as const;

export type ChallengeReward =
  | { readonly kind: 'egg'; readonly minRarity: Rarity }
  | { readonly kind: 'stones'; readonly amount: number }
  | { readonly kind: 'shards'; readonly amount: number };

export interface ChallengeMilestone {
  readonly points: number;
  readonly reward: ChallengeReward;
}

/**
 * Paliers d'un défi. Simulé : le joueur régulier (1 h par jour) atteint 6 à 7 paliers, soit 2 œufs par défi,
 * l'assidu les 8 (3 œufs dont un rare au moins). Un palier atteint et pas récupéré à la fin du défi
 * est donné automatiquement : rien n'est perdu.
 */
export const CHALLENGE_MILESTONES: readonly ChallengeMilestone[] = [
  { points: 30, reward: { kind: 'egg', minRarity: 'common' } },
  { points: 80, reward: { kind: 'stones', amount: 3 } },
  { points: 150, reward: { kind: 'shards', amount: 20 } },
  { points: 250, reward: { kind: 'stones', amount: 5 } },
  { points: 380, reward: { kind: 'shards', amount: 40 } },
  { points: 550, reward: { kind: 'egg', minRarity: 'common' } },
  { points: 750, reward: { kind: 'stones', amount: 8 } },
  { points: 1000, reward: { kind: 'egg', minRarity: 'rare' } },
];
