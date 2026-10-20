// Succès et titres : chaque succès donne un titre, affiché à côté du pseudo dans le classement et la discussion.
// Lot 6 des idées inspirées de Forge Master (demande de Théo, 19/10/2026). Voir docs/game-design/succes-et-titres.md.
// La liste des identifiants est recopiée côté serveur (TitleCatalog) : le serveur n'accepte que ceux-là.

/** Ce qu'un succès mesure, lu dans l'état du jeu. */
export type AchievementMetric =
  | 'zoneReached'
  | 'zonesCleared'
  | 'itemsForged'
  | 'jackpots'
  | 'abyssRecord'
  | 'setPieces'
  | 'divineSet'
  | 'outfits'
  | 'evolutionForm'
  | 'heartStars';

export interface Achievement {
  readonly id: string;
  /** Le titre gagné, tel qu'il s'affiche à côté du pseudo. */
  readonly title: string;
  readonly description: string;
  readonly metric: AchievementMetric;
  readonly target: number;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'premiers-pas', title: 'Galibot', description: 'Atteindre la zone 2', metric: 'zoneReached', target: 2 },
  { id: 'cinq-zones', title: 'Mineur de fond', description: 'Atteindre la zone 5', metric: 'zoneReached', target: 5 },
  { id: 'dix-zones', title: 'Explorateur', description: 'Atteindre la zone 10', metric: 'zoneReached', target: 10 },
  { id: 'quinze-zones', title: 'Sondeur des abîmes', description: 'Atteindre la zone 15', metric: 'zoneReached', target: 15 },
  { id: 'vingt-zones', title: 'Cœur de la terre', description: 'Atteindre la zone 20', metric: 'zoneReached', target: 20 },
  { id: 'gardien-5', title: 'Briseur de gardiens', description: 'Terminer la zone 5', metric: 'zonesCleared', target: 5 },
  { id: 'gardien-10', title: 'Tombeur de colosses', description: 'Terminer la zone 10', metric: 'zonesCleared', target: 10 },
  { id: 'gardien-19', title: 'Fléau des gardiens', description: 'Terminer la zone 19', metric: 'zonesCleared', target: 19 },
  { id: 'forge-100', title: 'Apprenti forgeron', description: 'Forger 100 objets', metric: 'itemsForged', target: 100 },
  { id: 'forge-1000', title: 'Forgeron', description: 'Forger 1 000 objets', metric: 'itemsForged', target: 1000 },
  { id: 'forge-10000', title: 'Maître de forge', description: 'Forger 10 000 objets', metric: 'itemsForged', target: 10000 },
  { id: 'forge-50000', title: 'Enclume vivante', description: 'Forger 50 000 objets', metric: 'itemsForged', target: 50000 },
  { id: 'jackpot-1', title: 'Chanceux', description: 'Obtenir un jackpot à la Forge', metric: 'jackpots', target: 1 },
  { id: 'jackpot-5', title: 'Né sous une bonne étoile', description: 'Obtenir 5 jackpots à la Forge', metric: 'jackpots', target: 5 },
  { id: 'puits-25', title: 'Descendeur', description: 'Atteindre l’étage 25 du Puits sans fond', metric: 'abyssRecord', target: 25 },
  { id: 'puits-50', title: 'Plongeur des ténèbres', description: 'Atteindre l’étage 50 du Puits sans fond', metric: 'abyssRecord', target: 50 },
  { id: 'puits-100', title: 'Sans fond', description: 'Atteindre l’étage 100 du Puits sans fond', metric: 'abyssRecord', target: 100 },
  { id: 'puits-200', title: 'Seigneur du Puits', description: 'Atteindre l’étage 200 du Puits sans fond', metric: 'abyssRecord', target: 200 },
  { id: 'panoplie-3', title: 'Bien assorti', description: 'Porter 3 pièces du même palier', metric: 'setPieces', target: 3 },
  { id: 'panoplie-5', title: 'Tiré à quatre épingles', description: 'Porter les 5 pièces du même palier', metric: 'setPieces', target: 5 },
  { id: 'panoplie-divine', title: 'Divinement paré', description: 'Porter les 5 pièces en Divin', metric: 'divineSet', target: 1 },
  { id: 'tenues-5', title: 'Coquet', description: 'Collectionner 5 tenues', metric: 'outfits', target: 5 },
  { id: 'tenues-10', title: 'Élégant des galeries', description: 'Collectionner 10 tenues', metric: 'outfits', target: 10 },
  { id: 'tenues-20', title: 'Icône de la mine', description: 'Collectionner les 20 tenues', metric: 'outfits', target: 20 },
  { id: 'legende', title: 'Légende', description: 'Devenir Légende de la mine', metric: 'evolutionForm', target: 4 },
  { id: 'coeur-1', title: 'Éveillé', description: 'Éveiller la 1re étoile du Cœur du monde', metric: 'heartStars', target: 1 },
  { id: 'coeur-5', title: 'Cœur du monde', description: 'Éveiller les 5 étoiles du Cœur du monde', metric: 'heartStars', target: 5 },
];

export const ACHIEVEMENT_IDS: ReadonlySet<string> = new Set(ACHIEVEMENTS.map((achievement) => achievement.id));
