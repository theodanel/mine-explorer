import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';

import { Sound } from '../../audio/sound';
import { EVOLUTION_FORMS } from '../../balance/balance';
import { EVOLUTION_VISUALS } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Evolution } from '../evolution';
import { formTitle, isClaimable } from '../evolution-rules';
import { RewardFlightDirective } from '../../reward-flight/reward-flight.directive';
import { RankStars } from '../rank-stars/rank-stars';
import { HeartCard } from '../heart-card/heart-card';
import { HeartForgeHelp } from '../../heart-forge/heart-forge-help/heart-forge-help';
import { readStorage, writeStorage } from '../../shared/local-storage';

const NUMBER = new Intl.NumberFormat('fr-FR');
const PERCENT = 100;
/** Dès la Légende, l'écran présente la dernière transformation : le Cœur du monde et ses 5 étoiles. */
const LEGEND_INDEX = EVOLUTION_FORMS.findIndex((form) => form.id === 'legend');
/** La transformation de l'écran ne se joue qu'une fois : ce drapeau s'en souvient. */
const HEART_REVEALED_KEY = 'mine-explorer.coeur-revele';
/** Durée de l'animation de transformation (doit couvrir la dernière étoile de heart-card.scss). */
const REVEAL_MS = 2800;

/**
 * Page d'évolution façon « Adventure Rank » : la forme actuelle et la suivante, trois paliers de missions
 * à remplir l'un après l'autre, chaque mission rapportant des éclats, puis la promotion.
 */
@Component({
  selector: 'app-evolution-page',
  imports: [RewardFlightDirective, RankStars, HeartCard, HeartForgeHelp],
  templateUrl: './evolution-page.html',
  styleUrl: './evolution-page.scss',
})
export class EvolutionPage {
  protected readonly evolution = inject(Evolution);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  /** Palier affiché ; null = le palier en cours. */
  private readonly chosenTier = signal<number | null>(null);

  /** Légende ou au-delà : l'écran se transforme pour le Cœur du monde. */
  protected readonly heartMode = computed(() => this.evolution.index() >= LEGEND_INDEX);
  protected readonly revealing = signal(false);
  protected readonly helpOpen = signal(false);
  protected readonly runesText = computed(() =>
    this.evolution.runesSet() ? "✓ Runes de l'étoile serties" : 'Sertis les 2 runes de cette étoile à la Forge du Cœur',
  );

  constructor() {
    // Première fois en Légende devant cet écran (en l'ouvrant, ou juste après la promotion) : l'interface se transforme
    let timer: ReturnType<typeof setTimeout> | null = null;
    effect(() => {
      if (!this.heartMode() || readStorage(HEART_REVEALED_KEY) !== null) {
        return;
      }
      writeStorage(HEART_REVEALED_KEY, '1');
      this.revealing.set(true);
      untracked(() => this.sound.play('upgrade'));
      timer = setTimeout(() => this.revealing.set(false), REVEAL_MS);
    });
    inject(DestroyRef).onDestroy(() => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    });
  }

  protected readonly current = computed(() => {
    const form = this.evolution.form();
    return { label: form.label, stars: form.stars, title: formTitle(form), portraitUrl: EVOLUTION_VISUALS[form.id].portraitUrl };
  });

  protected readonly next = computed(() => {
    const form = this.evolution.next();
    if (form === null) {
      return null;
    }
    const rank = EVOLUTION_FORMS.indexOf(form);
    return {
      label: form.label,
      stars: form.stars,
      title: formTitle(form),
      portraitUrl: EVOLUTION_VISUALS[form.id].portraitUrl,
      bonus: Math.round(form.strikeBonus * PERCENT),
      rank,
      ranks: EVOLUTION_FORMS.length - 1,
    };
  });

  protected readonly shownTier = computed(() => this.chosenTier() ?? this.evolution.tier());

  /** Les trois paliers, avec leur avancée, pour la frise du haut. */
  protected readonly tiers = computed(() => {
    const objectives = this.evolution.objectives();
    const numbers = [...new Set(objectives.map((objective) => objective.tier))];
    return numbers.map((tier) => {
      const missions = objectives.filter((objective) => objective.tier === tier);
      return {
        tier,
        done: missions.every((mission) => mission.done),
        unlocked: missions.some((mission) => mission.unlocked),
        current: tier === this.evolution.tier() && !this.evolution.ready(),
        shown: tier === this.shownTier(),
        claimable: missions.filter(isClaimable).length,
        doneCount: missions.filter((mission) => mission.done).length,
        total: missions.length,
      };
    });
  });

  protected readonly missions = computed(() =>
    this.evolution
      .objectives()
      .filter((objective) => objective.tier === this.shownTier())
      .map((objective) => ({
        ...objective,
        claimable: isClaimable(objective),
        haveLabel: NUMBER.format(objective.have),
        needLabel: NUMBER.format(objective.need),
        percent: Math.round((objective.have / objective.need) * PERCENT),
      })),
  );

  protected readonly shownLocked = computed(() => this.tiers().find((tier) => tier.shown)?.unlocked === false);

  protected showTier(tier: number): void {
    this.chosenTier.set(tier);
  }

  protected claim(index: number): void {
    if (this.evolution.claim(index)) {
      this.sound.play('shard');
    }
  }

  protected promote(): void {
    if (this.evolution.evolve()) {
      this.chosenTier.set(null);
      this.sound.play('upgrade');
    }
  }

  protected openGearRunes(): void {
    this.navigation.open('gear-runes');
  }

  protected openForge(): void {
    this.navigation.open('heart-forge');
  }

  protected close(): void {
    this.navigation.open('mine');
  }
}
