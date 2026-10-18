import { Component, computed, input } from '@angular/core';

import { EVOLUTION_FORMS } from '../../balance/balance';
import { EVOLUTION_VISUALS } from '../../loading/game-assets';

/** Zone que demande chaque étoile du Cœur du monde (12, 14, 16, 18, 20), lue dans ses missions. */
export const HEART_STAR_ZONES: readonly number[] = EVOLUTION_FORMS.filter((form) => form.id === 'heart').map((form) =>
  Math.max(...form.objectives.filter((objective) => objective.metric === 'zone').map((objective) => objective.target)),
);

/**
 * Carte de la dernière transformation, à la place de la carte de rang dès la Légende : le portrait du Cœur du monde
 * dans un anneau de lave et ses 5 étoiles, chacune avec sa zone. `revealing` joue l'animation de transformation.
 */
@Component({
  selector: 'app-heart-card',
  templateUrl: './heart-card.html',
  styleUrl: './heart-card.scss',
})
export class HeartCard {
  /** Étoiles déjà éveillées (0 tant que le mineur n'est que Légende de la mine). */
  readonly stars = input.required<number>();
  /** Les missions de l'étoile suivante sont toutes remplies. */
  readonly ready = input(false);
  readonly revealing = input(false);

  protected readonly portraitUrl = EVOLUTION_VISUALS.heart.portraitUrl;
  protected readonly legendPortraitUrl = EVOLUTION_VISUALS.legend.portraitUrl;
  protected readonly slots = computed(() =>
    HEART_STAR_ZONES.map((zone, index) => ({
      zone,
      lit: index < this.stars(),
      next: index === this.stars(),
    })),
  );
  protected readonly label = computed(() => `${this.stars()} étoile${this.stars() > 1 ? 's' : ''} sur ${HEART_STAR_ZONES.length}`);
}
