import { Component, computed, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { Evolution } from '../../evolution/evolution';
import { EVOLUTION_VISUALS } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { AccountCard } from '../../online/account-card/account-card';
import { LeaderboardPage } from '../../online/leaderboard-page/leaderboard-page';
import { OnlineAccount } from '../../online/online-account';
import { Progression } from '../../progression/progression';
import { PlayerName } from '../../shared/player-name';
import { ACHIEVEMENTS } from '../../balance/achievements';
import { Achievements } from '../../achievements/achievements';
import { Awakening } from '../../equipment/awakening';
import { Rebirth } from '../../rebirth/rebirth';
import { canRebirth } from '../../rebirth/rebirth-rules';

/** Volumes proposés, du plus fort au coupé. */
const VOLUME_OPTIONS = [
  { value: 1, label: 'Fort' },
  { value: 0.5, label: 'Moyen' },
  { value: 0.25, label: 'Faible' },
  { value: 0, label: 'Coupé' },
] as const;

/** Page Profil : le mineur, son évolution, et les paramètres du jeu. */
@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  imports: [AccountCard, LeaderboardPage],
})
export class ProfilePage {
  protected readonly evolution = inject(Evolution);
  protected readonly progression = inject(Progression);
  protected readonly sound = inject(Sound);
  protected readonly playerName = inject(PlayerName);
  protected readonly online = inject(OnlineAccount).enabled;
  protected readonly leaderboardOpen = signal(false);
  private readonly navigation = inject(Navigation);
  protected readonly achievements = inject(Achievements);
  protected readonly achievementCount = ACHIEVEMENTS.length;
  protected readonly rebirth = inject(Rebirth);
  private readonly awakening = inject(Awakening);
  /** La renaissance s'ouvre avec la phase du Divin corrompu de la vie (puis la zone 20 après la phase 5). */
  protected readonly rebirthReady = computed(() => canRebirth(this.progression.zone(), this.rebirth.count(), this.awakening.phase()));

  protected readonly volumes = VOLUME_OPTIONS;
  protected readonly portraitUrl = computed(() => EVOLUTION_VISUALS[this.evolution.form().id].portraitUrl);

  protected openAchievements(): void {
    this.navigation.open('achievements');
  }

  protected openRebirth(): void {
    this.navigation.open('rebirth');
  }

  protected openEvolution(): void {
    this.navigation.open('evolution');
  }

  protected close(): void {
    this.navigation.open('mine');
  }
}
