import { Component, computed, inject } from '@angular/core';

import { Artifacts } from '../../artifacts/artifacts';
import { COMPANIONS_UNLOCK_ZONE } from '../../balance/companions';
import { Camp } from '../../camp/camp';
import { Companions } from '../../companions/companions';
import { MENU_ICONS } from '../../loading/game-assets';
import { Tooltip } from '../../shared/tooltip/tooltip';
import { Skills } from '../../skills/skills';
import { Workshop } from '../../workshop/workshop';
import { Navigation, PageId } from '../navigation';
import { Challenge } from '../../challenge/challenge';

interface Tab {
  readonly label: string;
  /** Icône peinte, ou null tant qu'elle n'est pas livrée (le libellé suffit). */
  readonly icon: string | null;
  readonly page: PageId;
  /** Condition encore à remplir pour ouvrir ce menu (« Zone 3 »…), ou null s'il est ouvert. Le menu est alors grisé. */
  readonly locked: string | null;
  readonly badge: number;
  /** Seulement pour un menu verrouillé : ce qu'il faut faire pour l'ouvrir. */
  readonly tooltip: string | null;
}

/** Pages ouvertes depuis une autre page du menu : leur onglet reste allumé (le Campement est dans les Aventures). */
const PARENT_TAB: Readonly<Partial<Record<PageId, PageId>>> = {
  camp: 'adventures',
  abyss: 'adventures',
  minehunt: 'adventures',
  merchant: 'adventures',
  'forge-express': 'adventures',
  torchlight: 'adventures',
  challenge: 'companions',
};

/**
 * Barre de menus tout en bas du jeu, avec une icône peinte par menu. Pas d'onglet « Mine » : on revient à la mine
 * en touchant l'onglet allumé, ou avec la croix de la page.
 */
@Component({
  selector: 'app-footer-menu',
  imports: [Tooltip],
  templateUrl: './footer-menu.html',
  styleUrl: './footer-menu.scss',
})
export class FooterMenu {
  protected readonly navigation = inject(Navigation);
  private readonly skills = inject(Skills);
  private readonly artifacts = inject(Artifacts);
  private readonly workshop = inject(Workshop);
  private readonly companions = inject(Companions);
  private readonly challenge = inject(Challenge);
  private readonly camp = inject(Camp);

  protected readonly tabs = computed<readonly Tab[]>(() => [
    {
      label: 'Compétences',
      icon: MENU_ICONS.skills,
      page: 'skills',
      locked: null,
      badge: this.skills.available(),
      tooltip: null,
    },
    {
      label: 'Artefacts',
      icon: MENU_ICONS.artifacts,
      page: 'artifacts',
      locked: null,
      badge: this.artifacts.unseen(),
      tooltip: null,
    },
    {
      label: 'Compagnons',
      icon: MENU_ICONS.companions,
      page: 'companions',
      locked: this.companions.unlocked() ? null : `Zone ${COMPANIONS_UNLOCK_ZONE}`,
      // Un palier du Défi à récupérer compte aussi : c'est de là que viennent la plupart des œufs
      badge: this.companions.unlocked() ? this.companions.ready() + this.challenge.claimable().length : 0,
      tooltip: this.companions.unlocked()
        ? null
        : `Compagnons : s'ouvre à la zone ${COMPANIONS_UNLOCK_ZONE}, avec un premier œuf offert.`,
    },
    {
      label: 'Atelier',
      icon: MENU_ICONS.workshop,
      page: 'workshop',
      locked: this.workshop.unlocked() ? null : this.workshop.unlockLabel,
      badge: this.workshop.unlocked() ? this.workshop.affordable() : 0,
      tooltip: this.workshop.unlocked()
        ? null
        : `Atelier : s'ouvre quand ton mineur devient ${this.workshop.unlockLabel}.`,
    },
    {
      label: 'Aventures',
      icon: MENU_ICONS.adventures,
      page: 'adventures',
      locked: this.camp.unlocked() ? null : `Zone ${this.camp.unlockZone}`,
      badge: this.camp.unlocked() ? this.camp.ready() : 0,
      tooltip: this.camp.unlocked() ? null : `Aventures : le Campement s'ouvre à la zone ${this.camp.unlockZone}.`,
    },
  ]);

  /** Onglet allumé : celui de la page ouverte, ou de la page dont elle dépend. */
  protected readonly currentTab = computed(() => {
    const page = this.navigation.page();
    return PARENT_TAB[page] ?? page;
  });

  protected open(tab: Tab): void {
    if (tab.locked !== null) {
      return;
    }
    // Toucher l'onglet déjà allumé ramène à la mine
    this.navigation.open(this.currentTab() === tab.page ? 'mine' : tab.page);
  }
}
