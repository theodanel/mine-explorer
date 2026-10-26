import { Component, computed, effect, inject, signal, untracked } from '@angular/core';

import { Sound } from '../../audio/sound';
import { ASTRE_STAGES } from '../../balance/astre';
import { ESSENCE_LABELS, ESSENCES, EssenceId, RuneType } from '../../balance/heart-forge';
import { Evolution } from '../../evolution/evolution';
import { describeBonuses } from '../../miner/bonus-format';
import { Navigation } from '../../navigation/navigation';
import { readStorage, writeStorage } from '../../shared/local-storage';
import { astreBonuses, astreColor, nextStageProgress } from '../astre-rules';
import { HeartForge } from '../heart-forge';
import { HeartForgeHelp } from '../heart-forge-help/heart-forge-help';

const PERCENT = 100;
/** L'aide s'ouvre d'elle-même à la première visite de la Forge ; ce drapeau s'en souvient. */
const HELP_SEEN_KEY = 'mine-explorer.forge-du-coeur-aide';
/** Durée d'affichage d'un stade tout juste atteint. */
const MESSAGE_MS = 2500;
/** Ressources données d'un coup par le bouton « +10 ». */
const FEED_STEP = 10;
export const ASTRE_STAGE_NAMES = ['Endormi', 'Étincelle', 'Éclat', 'Flamme', 'Soleil', 'Supernova'] as const;

export function runeIconUrl(type: RuneType): string {
  return `assets/ui/forge-du-coeur/rune-${type}.webp`;
}

export function essenceIconUrl(id: EssenceId): string {
  return `assets/ui/forge-du-coeur/essence-${id}.webp`;
}

/** Pointes de l'Astre dessiné : 5, une par stade, sur un cercle (angles en degrés, la première en haut). */
const POINT_ANGLES = Array.from({ length: ASTRE_STAGES }, (_, index) => -90 + (index * 360) / ASTRE_STAGES);
const POINT_RADIUS = 40;

/**
 * Forge du Cœur : l'Astre du Cœur, nourri des ressources des Échos (ses 5 stades sont les 5 étoiles de la Légende du
 * Cœur du monde), et l'accès aux runes d'équipement. Le Creuset et l'anneau de runes ont été remplacés le 26/10/2026.
 */
@Component({
  selector: 'app-heart-forge-page',
  imports: [HeartForgeHelp],
  templateUrl: './heart-forge-page.html',
  styleUrl: './heart-forge-page.scss',
})
export class HeartForgePage {
  protected readonly forge = inject(HeartForge);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  private readonly evolution = inject(Evolution);
  protected readonly message = signal<string | null>(null);
  protected readonly helpOpen = signal(readStorage(HELP_SEEN_KEY) === null);
  protected readonly feedStep = FEED_STEP;

  protected readonly astre = computed(() => {
    const fed = this.forge.astre();
    const stage = this.forge.astreStage();
    const progress = nextStageProgress(fed);
    const color = `#${astreColor(fed).toString(16).padStart(6, '0')}`;
    return {
      stage,
      name: ASTRE_STAGE_NAMES[stage],
      color,
      // Plus l'Astre grandit, plus il brille : terne au début, éclatant au stade 5
      glow: 0.25 + (0.75 * stage) / ASTRE_STAGES,
      points: POINT_ANGLES.map((angle, index) => ({
        x: 50 + POINT_RADIUS * Math.cos((angle * Math.PI) / 180),
        y: 50 + POINT_RADIUS * Math.sin((angle * Math.PI) / 180),
        lit: index < stage,
      })),
      progress: progress === null ? null : { ...progress, percent: Math.round((progress.given / progress.needed) * PERCENT) },
      bonuses: describeBonuses(astreBonuses(fed)),
    };
  });

  /** Ce que demande l'étoile suivante, côté Astre. */
  protected readonly nextStar = computed(() => {
    const next = this.evolution.next();
    if (next === null || next.id !== 'heart') {
      return null;
    }
    return { star: next.stars, name: ASTRE_STAGE_NAMES[next.stars], ready: this.forge.astreStage() >= next.stars };
  });

  protected readonly essences = computed(() => {
    const stock = this.forge.essences();
    return ESSENCES.map((id) => ({ id, label: ESSENCE_LABELS[id], icon: essenceIconUrl(id), left: stock[id] }));
  });

  constructor() {
    writeStorage(HELP_SEEN_KEY, '1');
    // Un stade atteint : un petit message, puis il s'efface
    let timer: ReturnType<typeof setTimeout> | null = null;
    effect(() => {
      const event = this.forge.event();
      if (event === null) {
        return;
      }
      untracked(() => {
        this.message.set(`L'Astre atteint le stade ${ASTRE_STAGE_NAMES[event.stage]} !`);
        this.sound.play('forgeLegendary');
      });
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => this.message.set(null), MESSAGE_MS);
    });
  }

  protected feed(id: EssenceId, amount: number): void {
    if (this.forge.feedAstre(id, amount) === null && amount > 0) {
      this.sound.play('upgrade');
    }
  }

  protected openGearRunes(): void {
    this.navigation.open('gear-runes');
  }

  protected close(): void {
    this.navigation.open('evolution');
  }
}
