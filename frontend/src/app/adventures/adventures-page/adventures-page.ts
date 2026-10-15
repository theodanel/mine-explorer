import { Component, computed, inject } from '@angular/core';

import { Abyss } from '../../abyss/abyss';
import { Camp } from '../../camp/camp';
import { ForgeExpress } from '../../forge-express/forge-express';
import { Torchlight } from '../../torchlight/torchlight';
import { Merchant } from '../../merchant/merchant';
import { Minehunt } from '../../minehunt/minehunt';
import { ADVENTURE_IMAGES, FORGE_EXPRESS_IMAGES, MERCHANT_IMAGES, MINEHUNT_IMAGES, TORCHLIGHT_IMAGES } from '../../loading/game-assets';
import { Navigation, PageId } from '../../navigation/navigation';

interface Adventure {
  readonly page: PageId;
  readonly icon: string;
  /** Décor de l'aventure, montré en fond de sa carte. */
  readonly scene: string;
  readonly title: string;
  readonly text: string;
  /** Ce qui manque pour y entrer (« Débloqué : Zone 3 », « Revient dans 4 jours »), ou null si elle est ouverte. */
  readonly locked: string | null;
  /** Ce qui attend le joueur (« 3 / 3 essais », « 12 éclats au puits »…), ou null. */
  readonly status: string | null;
  /** Silhouette noire et nom caché : le marchand qui approche. */
  readonly mystery?: boolean;
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
  private readonly merchant = inject(Merchant);
  private readonly forgeExpress = inject(ForgeExpress);
  private readonly torchlight = inject(Torchlight);

  protected readonly adventures = computed<readonly Adventure[]>(() => [
    {
      page: 'camp',
      icon: ADVENTURE_IMAGES.campCard,
      scene: `url(${ADVENTURE_IMAGES.campBackground})`,
      title: 'Campement',
      text: 'Fais grandir ton village de mineurs.',
      locked: this.camp.unlocked() ? null : `Débloqué : Zone ${this.camp.unlockZone}`,
      status: this.campStatus(),
    },
    {
      page: 'abyss',
      icon: ADVENTURE_IMAGES.abyssCard,
      scene: `url(${ADVENTURE_IMAGES.abyssBackground})`,
      title: 'Puits sans fond',
      text: 'Descends le plus bas possible en 30 secondes.',
      locked: this.abyss.unlocked() ? null : `Débloqué : ${this.abyss.unlockLabel}`,
      status: this.abyss.unlocked() ? `${this.abyss.runsLeft()} / ${this.abyss.dailyRuns} essais` : null,
    },
    {
      page: 'minehunt',
      icon: MINEHUNT_IMAGES.card,
      scene: `url(${MINEHUNT_IMAGES.background})`,
      title: 'Chasse au filon',
      text: "Casse les rochers un à un et encaisse avant l'éboulement.",
      locked: this.minehunt.unlocked() ? null : `Débloqué : ${this.minehunt.unlockLabel}`,
      status: this.minehunt.unlocked() ? `${this.minehunt.runsLeft()} / ${this.minehunt.dailyRuns} parties` : null,
    },
    {
      page: 'forge-express',
      icon: FORGE_EXPRESS_IMAGES.card,
      scene: `url(${FORGE_EXPRESS_IMAGES.background})`,
      title: 'Forge express',
      text: 'Frappe en rythme à l’enclume pour forger un objet d’exception.',
      locked: this.forgeExpress.unlocked() ? null : `Débloqué : ${this.forgeExpress.unlockLabel}`,
      status: this.forgeExpress.unlocked() ? `${this.forgeExpress.runsLeft()} / ${this.forgeExpress.dailyRuns} parties` : null,
    },
    {
      page: 'torchlight',
      icon: TORCHLIGHT_IMAGES.card,
      scene: `url(${TORCHLIGHT_IMAGES.background})`,
      title: 'Expédition aux flambeaux',
      text: 'Explore la grotte noire à la torche et trouve le trésor en 30 pas.',
      locked: this.torchlight.unlocked() ? null : `Débloqué : ${this.torchlight.unlockLabel}`,
      status: this.torchlight.unlocked() ? `${this.torchlight.runsLeft()} / ${this.torchlight.dailyRuns} expéditions` : null,
    },
    this.merchantCard(),
  ]);

  /** Le marchand : absent, une silhouette la veille de son arrivée, puis son étal pendant 5 jours. */
  private merchantCard(): Adventure {
    const phase = this.merchant.phase();
    const base = { page: 'merchant' as const, icon: MERCHANT_IMAGES.merchant, scene: `url(${MERCHANT_IMAGES.stall})` };
    if (!this.merchant.unlocked()) {
      return { ...base, title: 'Marchand nain', text: 'Un marchand qui passe quelques jours par mois.', locked: `Débloqué : ${this.merchant.unlockLabel}`, status: null };
    }
    if (phase.kind === 'here') {
      return {
        ...base,
        title: 'Marchand nain',
        text: 'Marchande, bluffe, repars avec des trésors.',
        locked: null,
        status: phase.lastDay ? 'Dernier jour !' : `Encore ${6 - phase.day} jours`,
      };
    }
    if (phase.kind === 'coming' && phase.daysLeft === 1) {
      return { ...base, title: '???', text: 'Une silhouette approche…', locked: 'Arrive demain', status: null, mystery: true };
    }
    const days = this.merchant.daysUntil();
    return { ...base, title: 'Marchand nain', text: 'Il est sur les routes.', locked: `Revient dans ${days} jours`, status: null };
  }

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
