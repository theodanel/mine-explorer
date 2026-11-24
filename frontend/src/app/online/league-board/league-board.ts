import { Component, computed, inject, signal } from '@angular/core';

import { titleOf } from '../../achievements/achievement-rules';
import { Sound } from '../../audio/sound';
import { formatDuration } from '../../shared/format-duration';
import { CLOCK } from '../../shared/clock';
import { GeodeShards } from '../../wallet/geode-shards';
import { OnlineAccount } from '../online-account';
import { OnlineApi } from '../online-api';
import { isLeagueView, LEAGUE_LABELS, LeagueView } from './league-model';

/**
 * Ligue de la semaine : le joueur et les autres joueurs de sa ligue, classés par filons gagnés depuis lundi. Les
 * meilleurs montent, les derniers descendent le lundi à 0 h ; la récompense de la semaine passée se récupère ici.
 */
@Component({
  selector: 'app-league-board',
  templateUrl: './league-board.html',
  styleUrl: './league-board.scss',
})
export class LeagueBoard {
  private readonly api = inject(OnlineApi);
  private readonly shards = inject(GeodeShards);
  private readonly sound = inject(Sound);
  private readonly clock = inject(CLOCK);
  protected readonly account = inject(OnlineAccount);
  protected readonly view = signal<LeagueView | null>(null);
  /** none : pas encore de ligue (aucune sauvegarde cloud) ; failed : serveur injoignable. */
  protected readonly state = signal<'loading' | 'ready' | 'none' | 'failed'>('loading');

  protected readonly leagueLabel = computed(() => {
    const view = this.view();
    return view === null ? '' : LEAGUE_LABELS[view.league];
  });
  protected readonly timeLeft = computed(() => {
    const view = this.view();
    return view === null ? '' : formatDuration(Date.parse(view.endsAt) - this.clock());
  });
  protected readonly rows = computed(() => {
    const view = this.view();
    if (view === null) {
      return [];
    }
    const count = view.members.length;
    return view.members.map((row) => ({
      ...row,
      titleLabel: titleOf(row.title ?? null),
      zone: row.rank <= view.promote && row.score > 0 ? 'up' : row.rank > count - view.demote ? 'down' : null,
    }));
  });
  protected readonly reward = computed(() => {
    const pending = this.view()?.pending ?? null;
    if (pending === null) {
      return null;
    }
    const move = pending.to === pending.from ? `tu restes en ${LEAGUE_LABELS[pending.to]}` : `direction ${LEAGUE_LABELS[pending.to]}`;
    return { shards: pending.shards, text: `Semaine finie en ${LEAGUE_LABELS[pending.from]} : ${move}.` };
  });

  constructor() {
    void this.load();
  }

  protected async claim(): Promise<void> {
    const result = await this.api.write('POST', '/api/league/claim');
    const shards = result.ok ? (result.body as { shards?: unknown }).shards : null;
    if (typeof shards === 'number' && Number.isSafeInteger(shards) && shards > 0) {
      this.shards.add(shards);
      this.sound.play('artifact');
    }
    await this.load();
  }

  private async load(): Promise<void> {
    const result = await this.api.get('/api/league');
    if (result.ok && isLeagueView(result.body)) {
      this.view.set(result.body);
      this.state.set('ready');
    } else {
      this.state.set(!result.ok && result.code === 'league-none' ? 'none' : 'failed');
    }
  }
}
