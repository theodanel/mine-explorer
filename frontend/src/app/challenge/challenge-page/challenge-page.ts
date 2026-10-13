import { Component, computed, inject } from '@angular/core';

import { Sound } from '../../audio/sound';
import { CHALLENGE_MILESTONES, CHALLENGE_POINTS, ChallengeReward } from '../../balance/challenge';
import { RARITY_LABELS } from '../../balance/skill-tree';
import { eggIconUrl } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { formatDuration } from '../../shared/format-duration';
import { Challenge } from '../challenge';

const SHARD_ICON = 'assets/ui/geode-shard.png';

/** Texte et icône d'une récompense de palier. Les pierres d'éveil attendent leur icône (planche 10). */
function describeReward(reward: ChallengeReward): { readonly label: string; readonly icon: string | null } {
  switch (reward.kind) {
    case 'egg':
      return {
        label: reward.minRarity === 'common' ? 'Œuf' : `Œuf ${RARITY_LABELS[reward.minRarity].toLowerCase()} ou mieux`,
        icon: eggIconUrl(reward.minRarity),
      };
    case 'stones':
      return { label: `${reward.amount} pierres d'éveil`, icon: null };
    case 'shards':
      return { label: `${reward.amount} éclats`, icon: SHARD_ICON };
  }
}

/** Page du Défi de la mine : points marqués, temps restant et paliers à récupérer. */
@Component({
  selector: 'app-challenge-page',
  templateUrl: './challenge-page.html',
  styleUrl: './challenge-page.scss',
})
export class ChallengePage {
  protected readonly challenge = inject(Challenge);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);

  protected readonly rules = [
    { label: 'Filon épuisé', points: CHALLENGE_POINTS.rocksBroken },
    { label: 'Objet forgé', points: CHALLENGE_POINTS.itemsForged },
    { label: 'Événement de mine touché', points: CHALLENGE_POINTS.eventsTouched },
  ];
  protected readonly timeLeft = computed(() => formatDuration(this.challenge.timeLeftMs()));
  protected readonly maxPoints = CHALLENGE_MILESTONES[CHALLENGE_MILESTONES.length - 1].points;
  protected readonly progressPercent = computed(() => Math.min(Math.round((this.challenge.points() / this.maxPoints) * 100), 100));

  protected readonly milestones = computed(() => {
    const points = this.challenge.points();
    const claimed = this.challenge.claimed();
    return CHALLENGE_MILESTONES.map((milestone, index) => ({
      index,
      points: milestone.points,
      ...describeReward(milestone.reward),
      reached: points >= milestone.points,
      claimed: claimed.includes(index),
    }));
  });

  protected claim(index: number): void {
    if (this.challenge.claim(index) !== null) {
      this.sound.play('artifact');
    }
  }

  protected back(): void {
    this.navigation.open('companions');
  }
}
