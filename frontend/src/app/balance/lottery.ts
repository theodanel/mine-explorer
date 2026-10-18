// Équilibrage de la loterie du jour : un tirage gratuit par jour, six lots qui changent chaque jour.
// Fichier pur. Voir docs/game-design/loterie-du-jour.md.
import type { Rarity } from './skill-tree';

/**
 * Les six cases de la loterie et leur chance d'être tirées : deux communes, deux rares, une épique, une
 * légendaire. Seul le contenu des cases change d'un jour à l'autre ; les chances restent fixes et affichées.
 */
export const LOTTERY_SLOTS: readonly { readonly rarity: Rarity; readonly chance: number }[] = [
  { rarity: 'common', chance: 0.35 },
  { rarity: 'common', chance: 0.25 },
  { rarity: 'rare', chance: 0.18 },
  { rarity: 'rare', chance: 0.12 },
  { rarity: 'epic', chance: 0.08 },
  { rarity: 'legendary', chance: 0.02 },
];

/**
 * Modèle d'un lot. L'or se compte en filons de la zone du joueur (ce que rapporte un filon épuisé) pour rester
 * utile du début à la fin ; les éclats, pierres d'éveil et œufs sont des quantités fixes.
 */
export type PrizeTemplate =
  | { readonly kind: 'gold'; readonly stages: number }
  | { readonly kind: 'shards'; readonly amount: number }
  | { readonly kind: 'stones'; readonly amount: number }
  | { readonly kind: 'egg'; readonly minRarity: Rarity };

/**
 * Lots possibles par rareté. Repères : les missions du jour donnent une vingtaine d'éclats, le Défi environ
 * 2 œufs en 3 jours. Le lot commun vaut un petit coup de pouce, le légendaire un très bon jour.
 */
export const LOTTERY_CATALOGUE: Readonly<Record<Rarity, readonly PrizeTemplate[]>> = {
  common: [
    { kind: 'gold', stages: 3 },
    { kind: 'shards', amount: 8 },
    { kind: 'stones', amount: 2 },
  ],
  rare: [
    { kind: 'gold', stages: 8 },
    { kind: 'shards', amount: 20 },
    { kind: 'stones', amount: 5 },
    { kind: 'egg', minRarity: 'common' },
  ],
  epic: [
    { kind: 'gold', stages: 20 },
    { kind: 'shards', amount: 50 },
    { kind: 'stones', amount: 12 },
    { kind: 'egg', minRarity: 'rare' },
  ],
  legendary: [
    { kind: 'gold', stages: 50 },
    { kind: 'shards', amount: 120 },
    { kind: 'egg', minRarity: 'epic' },
  ],
};
