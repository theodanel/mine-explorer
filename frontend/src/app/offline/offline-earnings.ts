import { DestroyRef, DOCUMENT, inject, Injectable, signal } from '@angular/core';

import { OFFLINE_MIN_MS, OfflineGains, offlineGains } from '../balance/balance';
import { Miner } from '../miner/miner';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';

const STORAGE_KEY = 'mine-explorer.last-seen';
/** Fréquence d'enregistrement de la présence : une fermeture brutale ne perd pas plus que ça. */
const HEARTBEAT_MS = 15_000;

/**
 * Gains pendant l'absence : jeu fermé, ou onglet caché (la scène Pixi s'arrête alors).
 * Plafonnés à 4 h, comme dans Forge Master, pour donner une raison de revenir.
 */
@Injectable({ providedIn: 'root' })
export class OfflineEarnings {
  private readonly clock = inject(CLOCK);
  private readonly miner = inject(Miner);
  private readonly wallet = inject(Wallet);
  private readonly shards = inject(GeodeShards);
  private readonly document = inject(DOCUMENT);

  /** Dernier bilan à montrer au joueur, ou null. */
  readonly report = signal<OfflineGains | null>(null);

  constructor() {
    this.collect();
    const heartbeat = setInterval(() => this.markSeen(), HEARTBEAT_MS);
    const onVisibilityChange = () => (this.document.hidden ? this.markSeen() : this.collect());
    this.document.addEventListener('visibilitychange', onVisibilityChange);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(heartbeat);
      this.document.removeEventListener('visibilitychange', onVisibilityChange);
    });
  }

  dismiss(): void {
    this.report.set(null);
  }

  /** Crédite l'absence depuis la dernière présence enregistrée, puis repart de maintenant. */
  private collect(): void {
    const now = this.clock();
    const lastSeen = Number(readStorage(STORAGE_KEY));
    this.markSeen();
    if (!Number.isFinite(lastSeen) || lastSeen <= 0 || now - lastSeen < OFFLINE_MIN_MS) {
      return;
    }
    // Sans les sorts : ils ne fonctionnent qu'en jeu
    const { stats, offlineEfficiency } = this.miner.permanent();
    const gains = offlineGains(stats, now - lastSeen, offlineEfficiency);
    if (gains.gold > 0) {
      this.wallet.add(gains.gold);
    }
    if (gains.shards > 0) {
      this.shards.add(gains.shards);
    }
    this.report.set(gains);
  }

  private markSeen(): void {
    writeStorage(STORAGE_KEY, String(this.clock()));
  }
}
