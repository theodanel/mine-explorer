import { Component, computed, inject } from '@angular/core';

import { ACHIEVEMENTS } from '../../balance/achievements';
import { Navigation } from '../../navigation/navigation';
import { Achievements } from '../achievements';

/** Succès et titres : la liste, ce qu'il faut faire, et le titre porté (toucher un succès gagné pour le porter). */
@Component({
  selector: 'app-achievements-page',
  templateUrl: './achievements-page.html',
  styleUrl: './achievements-page.scss',
})
export class AchievementsPage {
  protected readonly achievements = inject(Achievements);
  private readonly navigation = inject(Navigation);
  protected readonly total = ACHIEVEMENTS.length;

  protected readonly rows = computed(() => {
    const unlocked = new Set(this.achievements.unlocked());
    const worn = this.achievements.title();
    return ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      unlocked: unlocked.has(achievement.id),
      worn: worn === achievement.id,
    }));
  });

  protected toggle(id: string, unlocked: boolean): void {
    if (unlocked) {
      this.achievements.wear(this.achievements.title() === id ? null : id);
    }
  }

  protected close(): void {
    this.navigation.open('profile');
  }
}
