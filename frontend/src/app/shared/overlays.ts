import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';

import { Navigation } from '../navigation/navigation';

/**
 * Fenêtres qui s'ouvrent d'elles-mêmes (le jeu les déclenche, pas un toucher du joueur), de la plus prioritaire
 * à la moins prioritaire. Une seule est montrée à la fois ; les autres attendent leur tour.
 */
export const AUTO_DIALOG_IDS = ['offlineReport', 'patchNotes', 'companionHatched', 'artifactFound', 'galleryChoice', 'itemCompare', 'account'] as const;
export type AutoDialogId = (typeof AUTO_DIALOG_IDS)[number];

/**
 * Celles-ci s'ouvrent aussi sur une autre page que la mine, parce que le joueur vient de les déclencher depuis
 * cette page (l'éclosion se lance depuis l'onglet Compagnons). Les autres attendent le retour à la mine.
 */
const ANY_PAGE: ReadonlySet<AutoDialogId> = new Set<AutoDialogId>(['companionHatched']);

/**
 * Empilement des interfaces. Ordre de profondeur (variables --z-* de styles.scss) : mine, pages du menu,
 * barre de menus, fenêtres, écran de chargement, infobulles.
 * Règles : une fenêtre ouverte par le joueur (évolution, missions, filtres…) passe avant tout ; une fenêtre
 * automatique (objet forgé, artefact, galerie…) n'apparaît que sur la mine, sans autre fenêtre ouverte,
 * et une seule à la fois, par ordre de priorité.
 */
@Injectable({ providedIn: 'root' })
export class Overlays {
  private readonly navigation = inject(Navigation);
  private readonly requests = signal<Partial<Record<AutoDialogId, Signal<boolean>>>>({});
  private readonly userDialogs = signal(0);

  readonly userDialogOpen = computed(() => this.userDialogs() > 0);

  /** La fenêtre automatique montrée en ce moment, ou aucune. */
  readonly shown = computed<AutoDialogId | null>(() => {
    if (this.userDialogOpen()) {
      return null;
    }
    const onMine = this.navigation.page() === 'mine';
    const requests = this.requests();
    return AUTO_DIALOG_IDS.find((id) => requests[id]?.() === true && (onMine || ANY_PAGE.has(id))) ?? null;
  });

  /** Déclare quand une fenêtre automatique voudrait s'ouvrir. */
  register(id: AutoDialogId, wants: Signal<boolean>): void {
    this.requests.update((requests) => ({ ...requests, [id]: wants }));
  }

  isShown(id: AutoDialogId): Signal<boolean> {
    return computed(() => this.shown() === id);
  }

  /** Une fenêtre ouverte par le joueur : les fenêtres automatiques attendent qu'elle se ferme. Renvoie la fermeture. */
  openUserDialog(): () => void {
    let open = true;
    this.userDialogs.update((count) => count + 1);
    return () => {
      if (open) {
        open = false;
        this.userDialogs.update((count) => count - 1);
      }
    };
  }
}

/**
 * À appeler dans le constructeur d'une fenêtre ouverte par le joueur : elle compte comme ouverte
 * tant que le composant existe. Renvoie la fermeture, déjà branchée sur la destruction du composant.
 */
export function holdUserDialog(): () => void {
  const release = inject(Overlays).openUserDialog();
  inject(DestroyRef).onDestroy(release);
  return release;
}
