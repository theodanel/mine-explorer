import { Component, output } from '@angular/core';

import {
  HEART_SHARD_ABYSS_FLOORS,
  HEART_SHARD_FIRST_ZONE,
  HEART_SHARD_ROCK_CHANCE,
  HEART_SHARDS_PER_GUARDIAN,
  RUNE_FORGE_ORES,
  RUNE_FORGE_SHARDS,
  RUNE_FUSION_COUNT,
  RUNE_FUSION_FAIL,
} from '../../balance/heart-forge';

const PERCENT = 100;
const ROCK_ODDS = Math.round(1 / HEART_SHARD_ROCK_CHANCE);
const FAIL_TEXT = Object.entries(RUNE_FUSION_FAIL)
  .filter(([, chance]) => chance > 0)
  .map(([rank, chance]) => `${Math.round(chance * PERCENT)} % au rang ${rank}`)
  .join(', ');

/** Étapes de la page d'aide, tirées de l'équilibrage pour rester justes quand les chiffres bougent. */
const STEPS: readonly { readonly title: string; readonly text: string; readonly icon: string }[] = [
  {
    title: 'Gagner des éclats de cœur',
    text: `À partir de la zone ${HEART_SHARD_FIRST_ZONE} : ${HEART_SHARDS_PER_GUARDIAN} par gardien battu, 1 chance sur ${ROCK_ODDS} par filon épuisé, et 1 tous les ${HEART_SHARD_ABYSS_FLOORS} étages du Puits sans fond.`,
    icon: 'assets/ui/forge-du-coeur/eclat-coeur.webp',
  },
  {
    title: 'Forger une rune',
    text: `${RUNE_FORGE_SHARDS} éclats de cœur et ${RUNE_FORGE_ORES} minerais divins donnent une rune de rang 1, de l'élément de ton choix.`,
    icon: 'assets/ui/forge-du-coeur/rune-fire.webp',
  },
  {
    title: 'Fusionner',
    text: `${RUNE_FUSION_COUNT} runes du même élément et du même rang en donnent une du rang suivant. À partir du rang 3, une fusion peut rater (${FAIL_TEXT}) : il ne reste alors qu'une rune.`,
    icon: 'assets/ui/forge-du-coeur/rune-ice.webp',
  },
  {
    title: 'Sertir',
    text: "Dans l'anneau, l'emplacement qui attend une rune que tu possèdes brille : touche-le pour l'y sertir. Chaque étoile demande 2 runes serties, en plus de ses missions.",
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
