import { Component, inject, output, signal } from '@angular/core';

import { OnlineApi } from '../online-api';
import { isLeaderboard, Leaderboard, LeaderboardType } from '../online-rules';

interface Tab {
  readonly type: LeaderboardType;
  readonly label: string;
}

const TABS: readonly Tab[] = [
  { type: 'depth', label: 'Profondeur' },
  { type: 'abyss', label: 'Puits sans fond' },
];

const STAGES_PER_ZONE = 15;

/**
 * Classements entre joueurs : profondeur atteinte dans la mine, record du Puits sans fond. Ouvert depuis la page
 * Profil et chargé avec elle : rien de plus au démarrage du jeu.
 */
@Component({
  selector: 'app-leaderboard-page',
  templateUrl: './leaderboard-page.html',
  styleUrl: './leaderboard-page.scss',
})
export class LeaderboardPage {
  private readonly api = inject(OnlineApi);
  /** Retour au profil, qui affiche ce classement à la place de son contenu. */
  readonly closed = output();

  protected readonly tabs = TABS;
  protected readonly type = signal<LeaderboardType>('depth');
  protected readonly board = signal<Leaderboard | null>(null);
  protected readonly failed = signal(false);

  constructor() {
    void this.load('depth');
  }

  protected async load(type: LeaderboardType): Promise<void> {
    this.type.set(type);
    this.board.set(null);
    this.failed.set(false);
    const result = await this.api.get(`/api/leaderboard/${type}`);
    if (result.ok && isLeaderboard(result.body)) {
      this.board.set(result.body);
    } else {
      this.failed.set(true);
    }
  }

  /** Valeur lisible : « 5-12 » pour la profondeur (même écriture que dans la mine), « 34 étages » pour le Puits. */
  protected format(value: number): string {
    if (this.type() === 'abyss') {
      return `${value} étage${value > 1 ? 's' : ''}`;
    }
    const zone = Math.floor((value - 1) / STAGES_PER_ZONE) + 1;
    const stage = ((value - 1) % STAGES_PER_ZONE) + 1;
    return `${zone}-${stage}`;
  }

  protected close(): void {
    this.closed.emit();
  }
}
