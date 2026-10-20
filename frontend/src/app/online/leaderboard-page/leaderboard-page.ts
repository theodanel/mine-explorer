import { Component, computed, DestroyRef, inject, InjectionToken, output, signal } from '@angular/core';

import { Abyss } from '../../abyss/abyss';
import { Progression } from '../../progression/progression';
import { OnlineAccount } from '../online-account';
import { OnlineApi } from '../online-api';
import { ONLINE_CONFIG } from '../online-config';
import { isLeaderboard, Leaderboard, LeaderboardType } from '../online-rules';
import { titleOf } from '../../achievements/achievement-rules';

interface Tab {
  readonly type: LeaderboardType;
  readonly label: string;
}

const TABS: readonly Tab[] = [
  { type: 'depth', label: 'Profondeur' },
  { type: 'abyss', label: 'Puits sans fond' },
];

/**
 * Flux du serveur qui annonce les classements changés, injecté pour que les tests s'en passent. Null sans
 * EventSource (tests, très vieux navigateurs) : la page se contente alors du chargement à l'ouverture.
 */
export const LEADERBOARD_EVENTS = new InjectionToken<((url: string) => EventSource) | null>(
  'LEADERBOARD_EVENTS',
  {
    providedIn: 'root',
    factory: () => (typeof EventSource === 'undefined' ? null : (url: string) => new EventSource(url)),
  },
);
/** Nom de l'événement envoyé par le serveur (LeaderboardEvents.CHANGED_EVENT). */
const CHANGED_EVENT = 'changed';

const STAGES_PER_ZONE = 15;
/** Les trois premiers reçoivent une médaille : or, argent, bronze. */
const PODIUM = 3;

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
  private readonly account = inject(OnlineAccount);
  private readonly progression = inject(Progression);
  private readonly abyss = inject(Abyss);
  /** Retour au profil, qui affiche ce classement à la place de son contenu. */
  readonly closed = output();

  protected readonly tabs = TABS;
  protected readonly podium = PODIUM;
  protected readonly type = signal<LeaderboardType>('depth');
  protected readonly board = signal<Leaderboard | null>(null);
  protected readonly failed = signal(false);

  /**
   * Progression de l'appareil plus haute que celle classée : le serveur la valide petit à petit depuis la première
   * connexion (anti-triche, voir PlausibilityRules.ranked). On l'annonce pour que le joueur ne croie pas à un bug.
   */
  protected readonly pending = computed(() => {
    const board = this.board();
    if (board === null || !this.account.signedIn()) {
      return null;
    }
    const local = this.type() === 'depth' ? this.localDepth() : this.abyss.record();
    const ranked = board.me?.value ?? 0;
    return local > ranked ? this.format(local) : null;
  });

  constructor() {
    void this.load('depth');
    this.listenToChanges();
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

  /**
   * Classements en direct : le serveur dit lequel vient de changer, la page le relit sans s'effacer. Le navigateur
   * rouvre seul le flux après une coupure.
   */
  private listenToChanges(): void {
    const open = inject(LEADERBOARD_EVENTS);
    if (open === null) {
      return;
    }
    const source = open(`${inject(ONLINE_CONFIG).apiUrl}/api/leaderboard/events`);
    source.addEventListener(CHANGED_EVENT, (event: MessageEvent<string>) => {
      if (event.data === this.type()) {
        void this.refresh(this.type());
      }
    });
    inject(DestroyRef).onDestroy(() => source.close());
  }

  /** Relecture silencieuse : en cas d'échec, le classement affiché reste, le prochain changement le relira. */
  private async refresh(type: LeaderboardType): Promise<void> {
    const result = await this.api.get(`/api/leaderboard/${type}`);
    // L'onglet a pu changer pendant l'appel : on n'affiche pas un classement qui n'est plus celui demandé
    if (this.type() === type && result.ok && isLeaderboard(result.body)) {
      this.board.set(result.body);
    }
  }

  protected titleLabel(id: string | null | undefined): string | null {
    return titleOf(id ?? null);
  }

  /** Valeur lisible : « Zone 5 · filon 12 » pour la profondeur (comme le bandeau de la mine), « 34 étages » pour le Puits. */
  protected format(value: number): string {
    if (this.type() === 'abyss') {
      return `${value} étage${value > 1 ? 's' : ''}`;
    }
    const zone = Math.floor((value - 1) / STAGES_PER_ZONE) + 1;
    const stage = ((value - 1) % STAGES_PER_ZONE) + 1;
    return `Zone ${zone} · filon ${stage}`;
  }

  private localDepth(): number {
    const { zone, stage } = this.progression.progress();
    return (zone - 1) * STAGES_PER_ZONE + stage;
  }

  protected close(): void {
    this.closed.emit();
  }
}
