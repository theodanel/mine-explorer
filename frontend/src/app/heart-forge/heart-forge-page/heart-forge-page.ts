import { Component, computed, effect, inject, signal, untracked } from '@angular/core';

import { Sound } from '../../audio/sound';
import {
  MAX_RUNE_RANK,
  RUNE_ELEMENTS,
  RUNE_FORGE_ORES,
  RUNE_FORGE_SHARDS,
  RUNE_FUSION_COUNT,
  RUNE_FORGE_ORE,
  RUNE_LABELS,
  RuneElement,
} from '../../balance/heart-forge';
import { EVOLUTION_VISUALS, materialIconUrl } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Ores } from '../../ores/ores';
import { HeartForge } from '../heart-forge';
import { fusionFailChance, runeCount, socketRune } from '../heart-forge-rules';

const PERCENT = 100;
/**
 * L'anneau dessiné a 12 emplacements, un tous les 30° : ceux du haut et du bas portent une gemme de lave fixe, les 10
 * autres attendent les runes, 2 par étoile en tournant dans le sens des aiguilles d'une montre.
 */
const RING_STEP = 30;
const GEM_ANGLES = [0, 180];
const RUNE_SOCKET_ANGLES = Array.from({ length: 360 / RING_STEP }, (_, index) => index * RING_STEP).filter(
  (angle) => !GEM_ANGLES.includes(angle),
);
/** Durée d'affichage du résultat d'une fusion. */
const FUSION_MESSAGE_MS = 2500;

export function runeIconUrl(element: RuneElement): string {
  return `assets/ui/forge-du-coeur/rune-${element}.webp`;
}

/**
 * Forge du Cœur : l'anneau du Cœur du monde et ses 10 emplacements (2 par étoile), la forge des runes de rang 1 et
 * la fusion de 3 runes en une du rang suivant.
 */
@Component({
  selector: 'app-heart-forge-page',
  templateUrl: './heart-forge-page.html',
  styleUrl: './heart-forge-page.scss',
})
export class HeartForgePage {
  protected readonly forge = inject(HeartForge);
  private readonly ores = inject(Ores);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  protected readonly portraitUrl = EVOLUTION_VISUALS.heart.portraitUrl;
  protected readonly gemAngles = GEM_ANGLES;
  protected readonly ranks = Array.from({ length: MAX_RUNE_RANK }, (_, index) => index + 1);
  protected readonly forgeShards = RUNE_FORGE_SHARDS;
  protected readonly forgeOres = RUNE_FORGE_ORES;
  protected readonly fusionCount = RUNE_FUSION_COUNT;
  protected readonly message = signal<{ text: string; success: boolean } | null>(null);

  protected readonly sockets = computed(() => {
    const state = { shards: this.forge.shards(), runes: this.forge.runes(), sockets: this.forge.sockets() };
    return state.sockets.map((filled, index) => {
      const rune = socketRune(index);
      return {
        index,
        star: Math.floor(index / 2) + 1,
        filled,
        rune,
        icon: runeIconUrl(rune.element),
        label: `${RUNE_LABELS[rune.element]} rang ${rune.rank}`,
        ready: !filled && runeCount(state, rune) > 0,
        angle: RUNE_SOCKET_ANGLES[index],
      };
    });
  });

  protected readonly rows = computed(() => {
    const state = { shards: this.forge.shards(), runes: this.forge.runes(), sockets: this.forge.sockets() };
    const stock = this.ores.stock();
    return RUNE_ELEMENTS.map((element) => ({
      element,
      label: RUNE_LABELS[element],
      icon: runeIconUrl(element),
      ore: { icon: materialIconUrl(RUNE_FORGE_ORE), stock: stock[RUNE_FORGE_ORE] },
      canForge: this.forge.canForge(),
      cells: this.ranks.map((rank) => {
        const rune = { element, rank };
        return {
          rank,
          count: runeCount(state, rune),
          canFuse: this.forge.canFuse(rune),
          failPercent: Math.round(fusionFailChance(rank + 1) * PERCENT),
        };
      }),
    }));
  });

  constructor() {
    // Résultat de la dernière fusion : un petit message, puis il s'efface
    let timer: ReturnType<typeof setTimeout> | null = null;
    effect(() => {
      const result = this.forge.lastFusion();
      if (result === null) {
        return;
      }
      const label = `${RUNE_LABELS[result.rune.element]} rang ${result.rune.rank}`;
      untracked(() => {
        this.message.set(
          result.success ? { text: `Fusion réussie : rune ${label} !`, success: true } : { text: 'La fusion a raté : il ne reste qu’une rune.', success: false },
        );
        this.sound.play(result.success ? 'forgeEpic' : 'rockBreak');
      });
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => this.message.set(null), FUSION_MESSAGE_MS);
    });
  }

  protected forgeRune(element: RuneElement): void {
    if (this.forge.forge(element)) {
      this.sound.play('forgeRare');
    }
  }

  protected fuse(element: RuneElement, rank: number): void {
    this.forge.fuse({ element, rank });
  }

  protected setRune(index: number): void {
    if (this.forge.socket(index)) {
      this.sound.play('upgrade');
    }
  }

  protected close(): void {
    this.navigation.open('evolution');
  }
}
