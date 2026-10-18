import { computed, inject, Injectable } from '@angular/core';

import { EVOLUTION_FORMS, hitsPerSecond, powerOf } from '../balance/balance';
import { ECHO_ESSENCES, ECHO_SECONDS_PER_ROCK, ESSENCE_LABELS } from '../balance/heart-forge';
import { Evolution } from '../evolution/evolution';
import { Miner } from '../miner/miner';
import { Progression } from '../progression/progression';

const LEGEND_INDEX = EVOLUTION_FORMS.findIndex((form) => form.id === 'legend');

/** PV d'un filon d'Écho : environ 2 minutes de coups à la Puissance donnée. */
export function echoRockHp(power: number, hitsEachSecond: number): number {
  return Math.max(1, Math.round(power * hitsEachSecond * ECHO_SECONDS_PER_ROCK));
}

/**
 * Le monde change à la Légende de la mine : les zones 1 à 11 deviennent leurs Échos, plus dures (le monde suit la
 * Puissance du joueur) et qui donnent chacune sa ressource à chaque filon. Y retourner passe par ici.
 */
@Injectable({ providedIn: 'root' })
export class Echoes {
  private readonly progression = inject(Progression);
  private readonly evolution = inject(Evolution);
  private readonly miner = inject(Miner);

  /** Les Échos sont ouverts : le mineur est Légende de la mine ou plus. */
  readonly open = computed(() => this.evolution.index() >= LEGEND_INDEX);

  /** Cette zone passée est un Écho. */
  isEcho(zone: number): boolean {
    return this.open() && zone >= 1 && zone <= ECHO_ESSENCES.length;
  }

  /** Nom de la ressource que donne l'Écho de cette zone. */
  essenceLabel(zone: number): string {
    return ESSENCE_LABELS[ECHO_ESSENCES[zone - 1]];
  }

  /** Retourne dans une zone passée : son Écho dès la Légende, sinon la zone telle qu'elle était. */
  enter(zone: number): boolean {
    if (!this.isEcho(zone)) {
      return this.progression.startFarm(zone);
    }
    const { stats } = this.miner.permanent();
    return this.progression.startFarm(zone, echoRockHp(powerOf(stats), hitsPerSecond(stats)));
  }
}
