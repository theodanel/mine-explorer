import { Component, computed, inject } from '@angular/core';

import { Artifacts } from '../../artifacts/artifacts';
import { Camp } from '../../camp/camp';
import { Companions } from '../../companions/companions';
import { MENU_ICONS } from '../../loading/game-assets';
import { RevealDirective } from '../../onboarding/reveal.directive';
import { RevealId } from '../../onboarding/reveal-rules';
import { Skills } from '../../skills/skills';
import { Workshop } from '../../workshop/workshop';
import { Navigation, PageId } from '../navigation';
import { Challenge } from '../../challenge/challenge';

interface Tab {
  readonly label: string;
  /** Icône peinte, ou null tant qu'elle n'est pas livrée (le libellé suffit). */
  readonly icon: string | null;
  readonly page: PageId;
  /** Élément de la prise en main : l'onglet apparaît, avec sa bulle, à l'ouverture du menu. */
  readonly reveal: RevealId;
  readonly open: boolean;
  readonly badge: number;
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
  imports: [RevealDirective],
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

  /** Seulement les menus ouverts (choix de Théo, 18/10/2026) : un onglet verrouillé n'apprend rien au joueur. */
  protected readonly tabs = computed<readonly Tab[]>(() =>
    [
      {
        label: 'Compétences',
        icon: MENU_ICONS.skills,
        page: 'skills' as const,
        reveal: 'skills' as const,
        open: this.skills.unlocked(),
        badge: this.skills.available(),
      },
      {
        label: 'Artefacts',
        icon: MENU_ICONS.artifacts,
        page: 'artifacts' as const,
        reveal: 'artifacts' as const,
        open: this.artifacts.unlocked(),
        badge: this.artifacts.unseen(),
      },
      {
        label: 'Compagnons',
        icon: MENU_ICONS.companions,
        page: 'companions' as const,
        reveal: 'companions' as const,
        open: this.companions.unlocked(),
        // Un palier du Défi à récupérer compte aussi : c'est de là que viennent la plupart des œufs
        badge: this.companions.ready() + this.challenge.claimable().length,
      },
      {
        label: 'Atelier',
        icon: MENU_ICONS.workshop,
        page: 'workshop' as const,
        reveal: 'workshop' as const,
        open: this.workshop.unlocked(),
        badge: this.workshop.affordable(),
      },
      {
        label: 'Aventures',
        icon: MENU_ICONS.adventures,
        page: 'adventures' as const,
        reveal: 'adventures' as const,
        open: this.camp.unlocked(),
        badge: this.camp.ready(),
      },
    ].filter((tab) => tab.open),
  );

  /** Onglet allumé : celui de la page ouverte, ou de la page dont elle dépend. */
  protected readonly currentTab = computed(() => {
    const page = this.navigation.page();
    return PARENT_TAB[page] ?? page;
  });

  protected open(tab: Tab): void {
    // Toucher l'onglet déjà allumé ramène à la mine
    this.navigation.open(this.currentTab() === tab.page ? 'mine' : tab.page);
  }
}
