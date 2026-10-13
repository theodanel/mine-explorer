import { Component, computed, inject } from '@angular/core';

import { Overlays } from '../../shared/overlays';
import { Camp } from '../../camp/camp';
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
  private readonly overlays = inject(Overlays);
  private readonly camp = inject(Camp);
  private readonly visible = this.overlays.isShown('offlineReport');

  constructor() {
    this.overlays.register('offlineReport', computed(() => this.earnings.report() !== null));
  }

  protected readonly view = computed(() => {
    const report = this.earnings.report();
    if (report === null || !this.visible()) {
      return null;
    }
    return {
      duration: formatDuration(report.creditedMs),
      capped: report.creditedMs >= this.camp.offlineCapMs(),
      cap: formatDuration(this.camp.offlineCapMs()),
      gold: NUMBER_FORMAT.format(report.gold),
      shards: report.shards,
    };
  });
}
