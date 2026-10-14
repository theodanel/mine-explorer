import { Component, computed, inject } from '@angular/core';

import { Abyss } from '../../abyss/abyss';
import { Camp } from '../../camp/camp';
import { Minehunt } from '../../minehunt/minehunt';
import { ADVENTURE_IMAGES, MINEHUNT_IMAGES } from '../../loading/game-assets';
import { Navigation, PageId } from '../../navigation/navigation';

interface Adventure {
  readonly page: PageId;
  readonly icon: string;
  /** Décor de l'aventure, montré en fond de sa carte. */
  readonly scene: string;
  readonly title: string;
  readonly text: string;
  /** Condition encore à remplir, ou null quand l'aventure est ouverte. */
  readonly locked: string | null;
  /** Ce qui attend le joueur (« 3 / 3 essais », « 12 éclats au puits »…), ou null. */
  readonly status: string | null;
}

/** Aventures : les activités à côté de la mine, regroupées dans un seul onglet pour garder la barre du bas lisible. */
@Component({
  selector: 'app-adventures-page',
  templateUrl: './adventures-page.html',
  styleUrl: './adventures-page.scss',
})
export class AdventuresPage {
  private readonly navigation = inject(Navigation);
  private readonly camp = inject(Camp);
  private readonly abyss = inject(Abyss);
  private readonly minehunt = inject(Minehunt);

  protected readonly adventures = computed<readonly Adventure[]>(() => [
    {
      page: 'camp',
      icon: ADVENTURE_IMAGES.campCard,
      scene: `url(${ADVENTURE_IMAGES.campBackground})`,
      title: 'Campement',
      text: 'Fais grandir ton village de mineurs.',
      locked: this.camp.unlocked() ? null : `Zone ${this.camp.unlockZone}`,
      status: this.campStatus(),
    },
    {
      page: 'abyss',
      icon: ADVENTURE_IMAGES.abyssCard,
      scene: `url(${ADVENTURE_IMAGES.abyssBackground})`,
      title: 'Puits sans fond',
      text: 'Descends le plus bas possible en 30 secondes.',
      locked: this.abyss.unlocked() ? null : this.abyss.unlockLabel,
      status: this.abyss.unlocked() ? `${this.abyss.runsLeft()} / ${this.abyss.dailyRuns} essais` : null,
    },
    {
      page: 'minehunt',
      icon: MINEHUNT_IMAGES.card,
      scene: `url(${MINEHUNT_IMAGES.background})`,
      title: 'Chasse au filon',
      text: 'Creuse la paroi, devine où dort le grisou, remonte avec le butin.',
      locked: this.minehunt.unlocked() ? null : this.minehunt.unlockLabel,
      status: this.minehunt.unlocked() ? `${this.minehunt.runsLeft()} / ${this.minehunt.dailyRuns} parties` : null,
    },
  ]);

  protected open(adventure: Adventure): void {
    if (adventure.locked === null) {
      this.navigation.open(adventure.page);
    }
  }

  protected close(): void {
    this.navigation.open('mine');
  }

  private campStatus(): string | null {
    if (!this.camp.unlocked()) {
      return null;
    }
    const stock = this.camp.wellStock();
    if (stock > 0) {
      return `${stock} éclats au puits`;
    }
    const ready = this.camp.ready();
    return ready > 0 ? `${ready} bâtiment${ready > 1 ? 's' : ''} à agrandir` : null;
  }
}
