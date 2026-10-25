import { Component, output } from '@angular/core';

import {
  ABYSS_FLOORS_PER_ESSENCES,
  ALLIANCE_EXTRA_ESSENCES,
  ECHO_ESSENCES,
  RUNE_CREATE_ESSENCES,
  RUNE_GROW_ESSENCES,
} from '../../balance/heart-forge';

const GROW_TEXT = Object.entries(RUNE_GROW_ESSENCES)
  .map(([rank, amount]) => `${amount} pour le rang ${rank}`)
  .join(', ');

/** Étapes de la page d'aide, tirées de l'équilibrage pour rester justes quand les chiffres bougent. */
const STEPS: readonly { readonly title: string; readonly text: string; readonly icon: string }[] = [
  {
    title: 'Récolter dans les Échos',
    text: `Le monde a changé : les zones 1 à ${ECHO_ESSENCES.length} sont devenues leurs Échos, plus durs. Chaque filon d'Écho donne à coup sûr la ressource de la zone. Le Puits sans fond en donne aussi une de chaque sorte tous les ${ABYSS_FLOORS_PER_ESSENCES} étages.`,
    icon: 'assets/ui/forge-du-coeur/essence-ember.webp',
  },
  {
    title: 'Créer une rune',
    text: `${RUNE_CREATE_ESSENCES} ressources de son élément créent une rune de rang 1. Une rune d'alliance mêle plusieurs ressources et en coûte ${ALLIANCE_EXTRA_ESSENCES} de plus ; chaque étoile révèle la recette des alliances qu'elle demande.`,
    icon: 'assets/ui/forge-du-coeur/rune-fire.webp',
  },
  {
    title: 'Faire grandir',
    text: `Nourris une rune avec ses ressources, comme une jauge, pour la faire passer au rang suivant (${GROW_TEXT}). Pas de hasard : seule la quantité compte.`,
    icon: 'assets/ui/forge-du-coeur/rune-ice.webp',
  },
  {
    title: 'Sertir',
    text: "Dans l'anneau, l'emplacement qui attend une rune que tu possèdes brille : touche-le pour l'y sertir. Chaque étoile demande 2 runes serties, en plus de ses missions ; ses emplacements ne s'ouvrent qu'une fois l'étoile précédente obtenue, et chacune est plus complexe que la précédente.",
    icon: 'assets/ui/forge-du-coeur/rune-light.webp',
  },
];

/** Page d'aide de la Forge du Cœur, ouverte par le petit « i ». */
@Component({
  selector: 'app-heart-forge-help',
  templateUrl: './heart-forge-help.html',
  styleUrl: './heart-forge-help.scss',
})
export class HeartForgeHelp {
  readonly closed = output();
  protected readonly steps = STEPS;
}
