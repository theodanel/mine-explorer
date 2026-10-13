import { Component, computed, inject } from '@angular/core';

import { Overlays } from '../../shared/overlays';
import { GALLERIES, GalleryId } from '../../balance/galleries';
import { galleryIconUrl } from '../../loading/game-assets';
import { Progression } from '../../progression/progression';
import { Galleries } from '../galleries';

/** Fin de zone : deux galeries au choix pour la suivante, chacune avec son gain et sa contrepartie. */
@Component({
  selector: 'app-gallery-choice',
  templateUrl: './gallery-choice.html',
  styleUrl: './gallery-choice.scss',
})
export class GalleryChoice {
  protected readonly galleries = inject(Galleries);
  protected readonly progression = inject(Progression);
  private readonly overlays = inject(Overlays);
  protected readonly visible = this.overlays.isShown('galleryChoice');

  constructor() {
    this.overlays.register('galleryChoice', this.galleries.choosing);
  }

  protected readonly cards = computed(() =>
    (this.galleries.offer() ?? []).map((id) => {
      const gallery = GALLERIES[id];
      return { id, label: gallery.label, icon: galleryIconUrl(id), gain: gallery.effects[0], cost: gallery.effects[1] };
    }),
  );
  protected readonly neutralIcon = galleryIconUrl('neutral');

  protected choose(id: GalleryId): void {
    this.galleries.choose(id);
  }
}
