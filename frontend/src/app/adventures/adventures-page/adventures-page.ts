import { Component, computed, inject } from '@angular/core';

import { Abyss } from '../../abyss/abyss';
import { Camp } from '../../camp/camp';
import { Navigation, PageId } from '../../navigation/navigation';

interface Adventure {
  readonly page: PageId;
  readonly title: string;
  readonly text: string;
  /** Condition encore à remplir, ou null quand l'aventure est ouverte. */
  readonly locked: string | null;
  readonly badge: number;
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

  protected readonly adventures = computed<readonly Adventure[]>(() => [
    {
      page: 'camp',
      title: 'Campement',
      text: 'Fais grandir ton camp : meilleurs gains hors ligne, absence plus longue, éclats passifs.',
      locked: this.camp.unlocked() ? null : `Zone ${this.camp.unlockZone}`,
      badge: this.camp.unlocked() ? this.camp.ready() : 0,
    },
    {
      page: 'abyss',
      title: 'Puits sans fond',
      text: `30 secondes pour descendre le plus bas possible : c'est là que ton build compte. ${this.abyss.dailyRuns} essais par jour.`,
      locked: this.abyss.unlocked() ? null : this.abyss.unlockLabel,
      badge: this.abyss.unlocked() ? this.abyss.runsLeft() : 0,
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
}
