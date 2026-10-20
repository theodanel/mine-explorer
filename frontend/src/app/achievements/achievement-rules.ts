// Règles pures des succès : un succès se gagne quand sa mesure atteint son seuil, et reste gagné ensuite (une
// panoplie retirée ne le reprend pas).
import { Achievement, ACHIEVEMENT_IDS, ACHIEVEMENTS, AchievementMetric } from '../balance/achievements';

/** Les mesures du jeu, lues par le service des succès. */
export type AchievementSnapshot = Readonly<Record<AchievementMetric, number>>;

export function isMet(achievement: Achievement, snapshot: AchievementSnapshot): boolean {
  return snapshot[achievement.metric] >= achievement.target;
}

/** Succès nouvellement gagnés, dans l'ordre de la liste. */
export function newlyMet(unlocked: readonly string[], snapshot: AchievementSnapshot): readonly Achievement[] {
  const known = new Set(unlocked);
  return ACHIEVEMENTS.filter((achievement) => !known.has(achievement.id) && isMet(achievement, snapshot));
}

export function titleOf(id: string | null): string | null {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id)?.title ?? null;
}

export function isValidUnlocked(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === 'string');
}

/** Succès connus d'une liste sauvegardée : ceux retirés du jeu (donjons, tenues, 20/10/2026) sont oubliés sans tout perdre. */
export function knownAchievements(ids: readonly string[]): string[] {
  return ids.filter((id) => ACHIEVEMENT_IDS.has(id));
}
