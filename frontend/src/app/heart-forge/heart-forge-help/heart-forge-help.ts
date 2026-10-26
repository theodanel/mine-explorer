import { Component, output } from '@angular/core';

import { ABYSS_FLOORS_PER_ESSENCES, ECHO_ESSENCES } from '../../balance/heart-forge';

/** Étapes de la page d'aide, tirées de l'équilibrage pour rester justes quand les chiffres bougent. */
const STEPS: readonly { readonly title: string; readonly text: string; readonly icon: string }[] = [
  {
    title: 'Récolter dans les Échos',
    text: `Le monde a changé : les zones 1 à ${ECHO_ESSENCES.length} sont devenues leurs Échos, plus durs. Chaque filon d'Écho donne à coup sûr la ressource de la zone. Le Puits sans fond en donne aussi une de chaque sorte tous les ${ABYSS_FLOORS_PER_ESSENCES} étages.`,
    icon: 'assets/ui/forge-du-coeur/essence-ember.webp',
  },
  {
    title: "Nourrir l'Astre du Cœur",
    text: "Le cercle à 5 pointes qui flotte derrière ton mineur grandit quand tu lui donnes tes ressources. Chacune le teinte et le renforce dans son domaine : Braise pour la Frappe, Givre pour le critique, Brume pour les dégâts critiques, Sève pour la vitesse, Aurore pour l'or.",
    icon: 'assets/ui/forge-du-coeur/rune-fire.webp',
  },
  {
    title: 'Éveiller les étoiles',
    text: "Ses 5 stades (Étincelle, Éclat, Flamme, Soleil, Supernova) sont les 5 étoiles du Cœur du monde : chaque étoile demande que l'Astre ait atteint son stade, en plus de ses missions. Il frappe le filon avec toi, ramasse des ressources en plus dans les Échos, et fait pleuvoir des étoiles sur le gardien.",
    icon: 'assets/ui/forge-du-coeur/rune-light.webp',
  },
  {
    title: "Runes d'équipement",
    text: "Chaque étoile ouvre une châsse sur tes pièces : crée-y la rune d'un élément avec 3 de ses ressources, puis fais-la grandir jusqu'au rang 5. La retirer rend ce qu'elle a coûté.",
    icon: 'assets/ui/forge-du-coeur/rune-ice.webp',
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
