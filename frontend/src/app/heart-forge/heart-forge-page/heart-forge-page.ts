import { Component, computed, effect, inject, signal, untracked } from '@angular/core';

import { Sound } from '../../audio/sound';
import { ASTRE_STAGES } from '../../balance/astre';
import { ESSENCE_LABELS, ESSENCES, EssenceId, RuneType } from '../../balance/heart-forge';
import { Evolution } from '../../evolution/evolution';
import { describeBonuses } from '../../miner/bonus-format';
import { Navigation } from '../../navigation/navigation';
import { readStorage, writeStorage } from '../../shared/local-storage';
import { astreBonuses, astreColor, canRaiseConstellation, nextStageProgress } from '../astre-rules';
import { astreLayout, orbitStars } from '../astre-shape';
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

/** Astre dessiné en SVG (repère de 100 × 100, centre à 50), comme dans la mine : voir astre-shape.ts. */
const CENTER = 50;
const LAYOUT_RADIUS = 34;
const ORBIT_RADIUS = 47;
const STAR_RADIUS = 7;
const CORE_RADIUS = 11;
const ORBIT_STAR_RADIUS = 3;
const STAR_INNER_RATIO = 0.3;

/** Étoile à 4 branches centrée en (x, y), en chemin SVG. */
function sparklePath(x: number, y: number, radius: number): string {
  const inner = radius * STAR_INNER_RATIO;
  const corners = Array.from({ length: 8 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 4;
    const length = index % 2 === 0 ? radius : inner;
    return `${(x + length * Math.cos(angle)).toFixed(2)} ${(y + length * Math.sin(angle)).toFixed(2)}`;
  });
  return `M${corners.join('L')}Z`;
}

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
    const constellation = this.forge.astreConstellation();
    const progress = nextStageProgress(fed, constellation);
    const color = `#${astreColor(fed).toString(16).padStart(6, '0')}`;
    const { points, lines } = astreLayout(stage, LAYOUT_RADIUS);
    return {
      stage,
      constellation,
      name: ASTRE_STAGE_NAMES[stage],
      color,
      // Plus l'Astre grandit, plus il brille : terne au début, éclatant à Supernova
      glow: 0.3 + (0.7 * stage) / ASTRE_STAGES,
      points: points.map((point) => ({
        lit: point.lit,
        x: CENTER + point.x,
        y: CENTER + point.y,
        path: sparklePath(CENTER + point.x, CENTER + point.y, STAR_RADIUS),
      })),
      lines: lines.map(({ from, to }) => ({ x1: CENTER + from.x, y1: CENTER + from.y, x2: CENTER + to.x, y2: CENTER + to.y })),
      core: sparklePath(CENTER, CENTER, CORE_RADIUS),
      orbit: orbitStars(constellation, ORBIT_RADIUS).map((star) => sparklePath(CENTER + star.x, CENTER + star.y, ORBIT_STAR_RADIUS)),
      // Ce qui est donné en avance compte pour la suite, mais la jauge s'arrête au niveau à allumer
      progress: {
        given: Math.min(progress.given, progress.needed),
        needed: progress.needed,
        percent: Math.min(Math.round((progress.given / progress.needed) * PERCENT), PERCENT),
      },
      bonuses: describeBonuses(astreBonuses(fed, constellation)),
    };
  });

  /** Niveau de Constellation suivant (fin de jeu, après Supernova) : ce qu'il demande et si tout est réuni. */
  protected readonly constellation = computed(() => {
    const needs = this.forge.constellationNeeds();
    return needs.supernova ? { ...needs, ready: canRaiseConstellation(needs) } : null;
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
        this.message.set(
          event.constellation > 0 && event.stage === ASTRE_STAGES
            ? `Constellation ${event.constellation} allumée !`
            : `L'Astre atteint le stade ${ASTRE_STAGE_NAMES[event.stage]} !`,
        );
        this.sound.play('forgeLegendary');
      });
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => this.message.set(null), MESSAGE_MS);
    });
  }

  protected feed(id: EssenceId, amount: number): void {
    if (!this.forge.feedAstre(id, amount) && amount > 0) {
      this.sound.play('upgrade');
    }
  }

  protected raiseConstellation(): void {
    this.forge.raiseConstellation();
  }

  protected openGearRunes(): void {
    this.navigation.open('gear-runes');
  }

  protected close(): void {
    this.navigation.open('evolution');
  }
}
