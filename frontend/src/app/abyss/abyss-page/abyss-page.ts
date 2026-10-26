import { Component, computed, effect, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { ABYSS_RUN_MS, CRYSTAL_LIFETIME_MS, RECORD_STEP, TRAP_FUSE_MS } from '../../balance/abyss';
import { SpellId } from '../../balance/skill-tree';
import { Evolution } from '../../evolution/evolution';
import { ADVENTURE_IMAGES, EVENT_IMAGES, EVOLUTION_VISUALS, rockUrl, spellIconUrl } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Progression } from '../../progression/progression';
import { Abyss } from '../abyss';
import { comboMultiplier, GameEvent } from '../abyss-game';
import { MinerSprite } from '../miner-sprite/miner-sprite';
import { compactNumber } from '../../shared/format-number';

const PERCENT = 100;
const SECONDS = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const MULTIPLIER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
/** Durée d'affichage d'un chiffre de dégâts ou d'un gain qui s'envole. */
const POP_MS = 700;
/** Le décor du puits remonte un peu à chaque étage : la descente se voit. */
const SCROLL_PER_FLOOR = 6;

interface Pop {
  readonly id: number;
  readonly text: string;
  readonly kind: 'hit' | 'crit' | 'weak' | 'shard' | 'time' | 'boom';
  /** Décalage horizontal, pour que les chiffres ne s'empilent pas. */
  readonly x: number;
}

/**
 * Puits sans fond, en mini-jeu : le mineur frappe seul, le joueur tape le rocher pour frapper plus fort et plus vite,
 * vise le point faible des rochers à cristal, casse les pièges avant l'explosion et attrape le temps qui tombe.
 */
@Component({
  selector: 'app-abyss-page',
  imports: [MinerSprite],
  templateUrl: './abyss-page.html',
  styleUrl: './abyss-page.scss',
})
export class AbyssPage {
  protected readonly abyss = inject(Abyss);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  private readonly evolution = inject(Evolution);
  private readonly progression = inject(Progression);

  protected readonly images = { ...ADVENTURE_IMAGES, chest: EVENT_IMAGES.chestOpen, timeCrystal: EVENT_IMAGES.crystal };
  protected readonly recordStep = RECORD_STEP;
  protected readonly scene = `url(${ADVENTURE_IMAGES.abyssBackground})`;
  /** Image du rocher de l'étage : le piège et le gardien ont la leur, les autres reprennent le rocher de la zone. */
  protected readonly rock = computed(() => {
    switch (this.floor()?.kind) {
      case 'trap':
        return ADVENTURE_IMAGES.trapRock;
      case 'guardian':
        return ADVENTURE_IMAGES.guardianRock;
      default:
        return rockUrl(this.progression.zone());
    }
  });
  protected readonly minerAtlas = computed(() => {
    const body = EVOLUTION_VISUALS[this.evolution.form().id].body;
    return body.kind === 'animated' ? body.strike.atlasUrl : null;
  });

  protected readonly floor = computed(() => this.abyss.game()?.floor ?? null);
  protected readonly hpPercent = computed(() => {
    const floor = this.floor();
    return floor === null ? 0 : Math.round((floor.hp / floor.maxHp) * PERCENT);
  });
  /** La barre de temps peut dépasser 100 % avec les cristaux : elle est plafonnée à l'affichage. */
  protected readonly timePercent = computed(() => Math.min(((this.abyss.game()?.timeLeftMs ?? 0) / ABYSS_RUN_MS) * PERCENT, PERCENT));
  protected readonly timeLeft = computed(() => SECONDS.format(Math.ceil((this.abyss.game()?.timeLeftMs ?? 0) / 1000)));
  protected readonly fusePercent = computed(() => ((this.floor()?.fuseMs ?? 0) / TRAP_FUSE_MS) * PERCENT);
  protected readonly combo = computed(() => {
    const game = this.abyss.game();
    if (game === null || game.combo < 2 || game.elapsedMs - game.lastTapMs > 600) {
      return null;
    }
    return `×${MULTIPLIER.format(comboMultiplier(game.combo))}`;
  });
  protected readonly crystalDrop = computed(() => {
    const crystal = this.abyss.game()?.crystal ?? null;
    return crystal === null ? null : { left: crystal.x * PERCENT, fall: (crystal.ageMs / CRYSTAL_LIFETIME_MS) * PERCENT };
  });
  protected readonly sceneOffset = computed(() => `center ${-(this.abyss.game()?.floorsCleared ?? 0) * SCROLL_PER_FLOOR}%`);
  protected readonly pops = signal<readonly Pop[]>([]);
  protected readonly shake = signal(false);
  private popId = 0;

  constructor() {
    // Chaque événement du jeu devient un son et un petit effet à l'écran
    effect(() => {
      for (const event of this.abyss.game()?.events ?? []) {
        this.react(event);
      }
    });
  }

  protected start(): void {
    if (this.abyss.start()) {
      this.sound.play('blast');
    }
  }

  protected tapRock(event: Event): void {
    event.stopPropagation();
    this.abyss.tap('rock');
  }

  protected tapWeak(event: Event): void {
    event.stopPropagation();
    this.abyss.tap('weak');
  }

  protected tapCrystal(event: Event): void {
    event.stopPropagation();
    this.abyss.tap('crystal');
  }

  protected cast(spell: SpellId): void {
    this.abyss.cast(spell);
  }

  protected spellIcon(spell: SpellId): string {
    return spellIconUrl(spell);
  }

  protected back(): void {
    this.navigation.open('adventures');
  }

  private react(event: GameEvent): void {
    switch (event.kind) {
      case 'hit':
        this.sound.play(event.critical || event.weak ? 'crit' : 'strike');
        this.pop(compactNumber(event.damage), event.weak ? 'weak' : event.critical ? 'crit' : 'hit');
        break;
      case 'floorCleared':
        this.sound.play(event.floor % 10 === 0 ? 'blast' : 'rockBreak');
        this.pop(`+${event.shards}`, 'shard');
        break;
      case 'trapExploded':
        this.sound.play('blast');
        this.pop('BOUM −3 s', 'boom');
        this.shake.set(true);
        setTimeout(() => this.shake.set(false), 400);
        break;
      case 'timeBonus':
        this.sound.play('shard');
        this.pop('+2 s', 'time');
        break;
      case 'spell':
        this.sound.play('upgrade');
        break;
    }
  }

  private pop(text: string, kind: Pop['kind']): void {
    const id = ++this.popId;
    const x = Math.round(Math.random() * 40 - 20);
    this.pops.update((pops) => [...pops.slice(-12), { id, text, kind, x }]);
    setTimeout(() => this.pops.update((pops) => pops.filter((pop) => pop.id !== id)), POP_MS);
  }
}
