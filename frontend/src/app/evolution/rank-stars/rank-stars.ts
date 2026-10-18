import { Component, computed, input } from '@angular/core';

import { EVOLUTION_FORMS } from '../../balance/balance';

/** Nombre d'étoiles de rang qu'une forme peut avoir : celles de la Légende du Cœur du monde. */
const STAR_SLOTS = Math.max(...EVOLUTION_FORMS.map((form) => form.stars));

/** Rangée d'étoiles de rang, pleines puis vides ; sa taille suit la police du texte autour. */
@Component({
  selector: 'app-rank-stars',
  templateUrl: './rank-stars.html',
  styleUrl: './rank-stars.scss',
})
export class RankStars {
  readonly count = input.required<number>();

  protected readonly slots = computed(() =>
    Array.from({ length: STAR_SLOTS }, (_, index) => index < this.count()),
  );
  protected readonly label = computed(
    () => `${this.count()} étoile${this.count() > 1 ? 's' : ''} sur ${STAR_SLOTS}`,
  );
}
