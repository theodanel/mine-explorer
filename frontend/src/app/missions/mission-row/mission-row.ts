import { Component, computed, input, output } from '@angular/core';

import { MissionView } from '../missions';
import { RewardFlightDirective } from '../../reward-flight/reward-flight.directive';

const PERCENT = 100;

/** Une mission : libellé, barre d'avancement et bouton de récompense. */
@Component({
  selector: 'app-mission-row',
  imports: [RewardFlightDirective],
  templateUrl: './mission-row.html',
  styleUrl: './mission-row.scss',
})
export class MissionRow {
  readonly view = input.required<MissionView>();
  readonly claim = output();

  protected readonly percent = computed(() => {
    const { progress, mission } = this.view();
    return Math.round((progress / mission.target) * PERCENT);
  });
}
