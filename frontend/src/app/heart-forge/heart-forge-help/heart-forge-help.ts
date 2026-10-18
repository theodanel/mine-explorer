import { Component, output } from '@angular/core';

import { ABYSS_FLOORS_PER_ESSENCES, ECHO_ESSENCES, RUNE_FUSION_COUNT, RUNE_FUSION_FAIL } from '../../balance/heart-forge';

const PERCENT = 100;
const FAIL_TEXT = Object.entries(RUNE_FUSION_FAIL)
  .filter(([, chance]) => chance > 0)
  .map(([rank, chance]) => `${Math.round(chance * PERCENT)} % au rang ${rank}`)
  .join(', ');

/** Étapes de la page d'aide, tirées de l'équilibrage pour rester justes quand les chiffres bougent. */
const STEPS: readonly { readonly title: string; readonly text: string; readonly icon: string }[] = [
  {
    title: 'Récolter dans les Échos',
    text: `Le monde a changé : les zones 1 à ${ECHO_ESSENCES.length} sont devenues leurs Échos, plus durs. Chaque filon d'Écho donne à coup sûr la ressource de la zone. Le Puits sans fond en donne aussi une de chaque sorte tous les ${ABYSS_FLOORS_PER_ESSENCES} étages.`,
    icon: 'assets/ui/forge-du-coeur/eclat-coeur.webp',
  },
  {
    title: 'Verser au Creuset',
    text: "3 ressources donnent une rune de rang 1. Trois identiques donnent la rune de leur élément ; certains mélanges donnent des runes d'alliance. Chaque recette trouvée s'inscrit au livre.",
    icon: 'assets/ui/forge-du-coeur/rune-fire.webp',
  },
  {
    title: 'Fusionner',
    text: `${RUNE_FUSION_COUNT} runes du même type et du même rang en donnent une du rang suivant. À partir du rang 3, une fusion peut rater (${FAIL_TEXT}) : il ne reste alors qu'une rune.`,
    icon: 'assets/ui/forge-du-coeur/rune-ice.webp',
  },
  {
    title: 'Sertir',
    text: "Dans l'anneau, l'emplacement qui attend une rune que tu possèdes brille : touche-le pour l'y sertir. Chaque étoile demande 2 runes serties, en plus de ses missions, et chacune est plus complexe que la précédente.",
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
