import { Component, inject, output } from '@angular/core';

import { holdUserDialog } from '../../shared/overlays';
import { MissionRow } from '../mission-row/mission-row';
import { Missions } from '../missions';
import { RewardFlightDirective } from '../../reward-flight/reward-flight.directive';

/** Fenêtre des missions : celles du jour, puis le coffre du jour. L'objectif principal est dans le Carnet d'aventure. */
@Component({
  selector: 'app-missions-dialog',
  imports: [MissionRow, RewardFlightDirective],
  templateUrl: './missions-dialog.html',
  styleUrl: './missions-dialog.scss',
})
export class MissionsDialog {
  protected readonly missions = inject(Missions);
  readonly closed = output();

  constructor() {
    // Ouverte par le joueur : les fenêtres automatiques attendent sa fermeture
    holdUserDialog();
  }
}
