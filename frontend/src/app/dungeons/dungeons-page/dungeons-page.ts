import { Component, computed, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { zoneMaterial } from '../../balance/balance';
import { DUNGEON_IDS, DUNGEON_MAX_KEYS, DUNGEON_STRIKES, DUNGEONS, DungeonId, dungeonReward } from '../../balance/dungeons';
import { TIER_LABELS } from '../../equipment/equipment.model';
import { materialIconUrl, pageBackground, rockUrl } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Progression } from '../../progression/progression';
import { compactNumber } from '../../shared/format-number';
import { isRunOver, isRunWon } from '../dungeon-rules';
import { Dungeons } from '../dungeons';

/** Durée de la secousse du rocher à chaque coup. */
const HIT_MS = 160;
const SHARD_ICON = 'assets/ui/geode-shard.webp';

/** Donjons de ressources : la liste des donjons, puis la partie à coups comptés. */
@Component({
  selector: 'app-dungeons-page',
  templateUrl: './dungeons-page.html',
  styleUrl: './dungeons-page.scss',
})
export class DungeonsPage {
  protected readonly dungeons = inject(Dungeons);
  private readonly progression = inject(Progression);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  protected readonly maxKeys = DUNGEON_MAX_KEYS;
  protected readonly strikes = DUNGEON_STRIKES;
  protected readonly hit = signal(false);
  private hitTimer: ReturnType<typeof setTimeout> | null = null;

  /** Minerai que donne la Forge ancestrale : celui de la zone la plus profonde atteinte. */
  private readonly ore = computed(() => zoneMaterial(Math.max(this.progression.progress().zone, 2)));

  protected readonly cards = computed(() =>
    DUNGEON_IDS.map((id) => {
      const best = this.dungeons.best()[id];
      const keys = this.dungeons.keys()[id];
      return {
        id,
        ...DUNGEONS[id],
        scene: pageBackground(`assets/backgrounds/zone${DUNGEONS[id].zone}.webp`),
        keys,
        best,
        next: best + 1,
        nextReward: this.rewardText(id, best + 1),
        sweepReward: best > 0 ? this.rewardText(id, best) : null,
        icon: this.rewardIcon(id),
      };
    }),
  );

  protected readonly view = computed(() => {
    const run = this.dungeons.run();
    if (run === null) {
      return null;
    }
    return {
      ...run,
      label: DUNGEONS[run.dungeon].label,
      rock: rockUrl(DUNGEONS[run.dungeon].zone),
      scene: pageBackground(`assets/backgrounds/zone${DUNGEONS[run.dungeon].zone}.webp`),
      hpText: `${compactNumber(run.hp)} / ${compactNumber(run.maxHp)} PV`,
      hpShare: run.hp / run.maxHp,
      over: isRunOver(run),
      won: isRunWon(run),
      reward: this.rewardText(run.dungeon, run.level),
      icon: this.rewardIcon(run.dungeon),
    };
  });

  protected enter(id: DungeonId): void {
    if (this.dungeons.enter(id)) {
      this.sound.play('upgrade');
    }
  }

  protected sweep(id: DungeonId): void {
    if (this.dungeons.sweep(id)) {
      this.sound.play('artifact');
    }
  }

  protected strike(): void {
    const run = this.dungeons.strike();
    if (run === null) {
      return;
    }
    this.sound.play(isRunWon(run) ? 'rockBreak' : 'strike');
    this.hit.set(true);
    if (this.hitTimer !== null) {
      clearTimeout(this.hitTimer);
    }
    this.hitTimer = setTimeout(() => this.hit.set(false), HIT_MS);
  }

  protected leaveRun(): void {
    this.dungeons.leave();
  }

  protected close(): void {
    this.dungeons.leave();
    this.navigation.open('adventures');
  }

  private rewardText(id: DungeonId, level: number): string {
    const amount = dungeonReward(id, level);
    if (DUNGEONS[id].reward === 'shards') {
      return `${amount} éclats`;
    }
    const ore = this.ore();
    return ore === null ? `${amount} minerais` : `${amount} ${TIER_LABELS[ore]}`;
  }

  private rewardIcon(id: DungeonId): string {
    const ore = this.ore();
    return DUNGEONS[id].reward === 'shards' || ore === null ? SHARD_ICON : materialIconUrl(ore);
  }
}
