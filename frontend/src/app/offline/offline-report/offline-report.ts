import { Component, computed, inject } from '@angular/core';

import { OFFLINE_CAP_MS } from '../../balance/balance';
import { formatDuration } from '../../shared/format-duration';
import { OfflineEarnings } from '../offline-earnings';

const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR');

/** Bilan affiché au retour du joueur : combien de temps compté, et ce que le mineur a rapporté. */
@Component({
  selector: 'app-offline-report',
  templateUrl: './offline-report.html',
  styleUrl: './offline-report.scss',
})
export class OfflineReport {
  protected readonly earnings = inject(OfflineEarnings);

  protected readonly view = computed(() => {
    const report = this.earnings.report();
    if (report === null) {
      return null;
    }
    return {
      duration: formatDuration(report.creditedMs),
      capped: report.creditedMs >= OFFLINE_CAP_MS,
      cap: formatDuration(OFFLINE_CAP_MS),
      gold: NUMBER_FORMAT.format(report.gold),
    };
  });
}
