import { Component, computed, effect, inject, signal, untracked } from '@angular/core';

import { Sound } from '../../audio/sound';
import {
  ALLIANCE_RECIPES,
  ALLIANCE_RUNES,
  ESSENCE_ELEMENTS,
  ESSENCE_LABELS,
  ESSENCES,
  EssenceId,
  MAX_RUNE_RANK,
  RUNE_FUSION_COUNT,
  RUNE_LABELS,
  RUNE_TYPES,
  RuneType,
} from '../../balance/heart-forge';
import { EVOLUTION_VISUALS } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { readStorage, writeStorage } from '../../shared/local-storage';
import { HeartForge } from '../heart-forge';
import { HeartForgeHelp } from '../heart-forge-help/heart-forge-help';
import { brewCost, fusionFailChance, recipeResult, revealedRecipes, runeCount, socketOpen, socketRune, socketStar } from '../heart-forge-rules';
import { Evolution } from '../../evolution/evolution';

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
/** L'aide s'ouvre d'elle-même à la première visite de la Forge ; ce drapeau s'en souvient. */
const HELP_SEEN_KEY = 'mine-explorer.forge-du-coeur-aide';
/** Durée d'affichage du résultat du Creuset ou d'une fusion. */
const MESSAGE_MS = 2500;
const CRUCIBLE_SLOTS = 3;

export function runeIconUrl(type: RuneType): string {
  return `assets/ui/forge-du-coeur/rune-${type}.webp`;
}

export function essenceIconUrl(id: EssenceId): string {
  return `assets/ui/forge-du-coeur/essence-${id}.webp`;
}

export function isAlliance(type: RuneType): boolean {
  return (ALLIANCE_RUNES as readonly string[]).includes(type);
}

/**
 * Forge du Cœur : l'anneau du Cœur du monde (10 emplacements, 2 par étoile), le Creuset où l'on verse 3 ressources
 * des Échos pour faire une rune, le livre des recettes trouvées, et la réserve de runes à fusionner.
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
  /** Étoiles déjà obtenues : elles ouvrent l'anneau et révèlent les recettes. */
  private readonly evolution = inject(Evolution);
  private readonly stars = computed(() => this.evolution.form().stars);
  protected readonly portraitUrl = EVOLUTION_VISUALS.heart.portraitUrl;
  protected readonly gemAngles = GEM_ANGLES;
  protected readonly ranks = Array.from({ length: MAX_RUNE_RANK }, (_, index) => index + 1);
  protected readonly fusionCount = RUNE_FUSION_COUNT;
  protected readonly message = signal<{ text: string; success: boolean } | null>(null);
  protected readonly helpOpen = signal(readStorage(HELP_SEEN_KEY) === null);
  /** Ressources posées dans le Creuset, dans l'ordre. */
  protected readonly mix = signal<readonly EssenceId[]>([]);

  protected readonly sockets = computed(() => {
    const state = this.forge.snapshot();
    const stars = this.stars();
    return state.sockets.map((filled, index) => {
      const rune = socketRune(index);
      const open = socketOpen(index, stars);
      return {
        index,
        star: socketStar(index),
        filled,
        open,
        rune,
        icon: runeIconUrl(rune.type),
        label: `${RUNE_LABELS[rune.type]} rang ${rune.rank}`,
        owned: runeCount(state, rune),
        ready: open && !filled && runeCount(state, rune) > 0,
        angle: RUNE_SOCKET_ANGLES[index],
      };
    });
  });

  /**
   * Prochaine étoile à éveiller et ses deux runes, nommées en clair : sur l'anneau, une rune d'alliance (Éclipse) se
   * confondait avec un élément (Ombre), signalé par un joueur le 25/10/2026.
   */
  protected readonly nextStar = computed(() => {
    const sockets = this.sockets();
    const open = sockets.find((socket) => !socket.filled && socket.open);
    if (open === undefined) {
      return null;
    }
    return { star: open.star, runes: sockets.filter((socket) => socket.star === open.star) };
  });

  /** Les 5 ressources, avec leur réserve moins ce qui est déjà posé dans le Creuset. */
  protected readonly essences = computed(() => {
    const stock = this.forge.essences();
    const mix = this.mix();
    return ESSENCES.map((id) => ({
      id,
      label: ESSENCE_LABELS[id],
      icon: essenceIconUrl(id),
      left: stock[id] - mix.filter((other) => other === id).length,
    }));
  });

  protected readonly slots = computed(() => {
    const mix = this.mix();
    return Array.from({ length: CRUCIBLE_SLOTS }, (_, index) => {
      const essence = mix[index] ?? null;
      return { index, essence, icon: essence === null ? null : essenceIconUrl(essence) };
    });
  });

  /** Ce que donnera le mélange : connu si la recette a déjà été trouvée, sinon « ? ». */
  protected readonly preview = computed(() => {
    const mix = this.mix();
    if (mix.length < CRUCIBLE_SLOTS) {
      return null;
    }
    const full = mix as [EssenceId, EssenceId, EssenceId];
    const result = recipeResult(full);
    if (!this.knownRecipes().includes(result)) {
      return 'Rune inconnue';
    }
    const extra = brewCost(full).length - full.length;
    return extra > 0 ? `Rune ${RUNE_LABELS[result]} (+${extra} ressources d'alliance)` : `Rune ${RUNE_LABELS[result]}`;
  });

  /** Recettes connues : trouvées au Creuset, ou révélées par les étoiles. */
  private readonly knownRecipes = computed(() => [...this.forge.recipes(), ...revealedRecipes(this.stars())]);

  /** Livre de recettes : chaque rune avec sa recette si elle a été trouvée ou révélée par une étoile. */
  protected readonly book = computed(() => {
    const known = this.knownRecipes();
    return RUNE_TYPES.map((type) => {
      const recipe = isAlliance(type)
        ? ALLIANCE_RECIPES[type as keyof typeof ALLIANCE_RECIPES]
        : (() => {
            const essence = ESSENCES.find((id) => ESSENCE_ELEMENTS[id] === type) ?? ESSENCES[0];
            return [essence, essence, essence] as const;
          })();
      return {
        type,
        label: RUNE_LABELS[type],
        icon: runeIconUrl(type),
        known: known.includes(type),
        // Une alliance coûte en plus les deux premières ressources de sa recette
        recipe:
          recipe.map((id) => ESSENCE_LABELS[id]).join(' + ') +
          (isAlliance(type) ? ` (+ ${recipe.slice(0, 2).map((id) => ESSENCE_LABELS[id]).join(' + ')})` : ''),
      };
    });
  });

  protected readonly rows = computed(() => {
    const state = this.forge.snapshot();
    return RUNE_TYPES.map((type) => ({
      type,
      label: RUNE_LABELS[type],
      icon: runeIconUrl(type),
      cells: this.ranks.map((rank) => {
        const rune = { type, rank };
        return {
          rank,
          count: runeCount(state, rune),
          canFuse: this.forge.canFuse(rune),
          failPercent: Math.round(fusionFailChance(rank + 1) * PERCENT),
        };
      }),
    })).filter((row) => row.cells.some((cell) => cell.count > 0) || this.forge.recipes().includes(row.type));
  });

  constructor() {
    writeStorage(HELP_SEEN_KEY, '1');
    // Résultat du Creuset ou d'une fusion : un petit message, puis il s'efface
    let timer: ReturnType<typeof setTimeout> | null = null;
    effect(() => {
      const event = this.forge.event();
      if (event === null) {
        return;
      }
      const label = `${RUNE_LABELS[event.rune.type]} rang ${event.rune.rank}`;
      untracked(() => {
        if (event.kind === 'brew') {
          this.message.set({ text: event.discovery ? `Nouvelle recette : rune ${label} !` : `Rune ${label}`, success: true });
          this.sound.play(event.discovery ? 'forgeLegendary' : 'forgeRare');
        } else {
          this.message.set(
            event.success ? { text: `Fusion réussie : rune ${label} !`, success: true } : { text: "La fusion a raté : il ne reste qu'une rune.", success: false },
          );
          this.sound.play(event.success ? 'forgeEpic' : 'rockBreak');
        }
      });
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => this.message.set(null), MESSAGE_MS);
    });
  }

  protected addEssence(id: EssenceId, left: number): void {
    if (left > 0 && this.mix().length < CRUCIBLE_SLOTS) {
      this.mix.update((mix) => [...mix, id]);
    }
  }

  protected removeEssence(index: number): void {
    this.mix.update((mix) => mix.filter((_, position) => position !== index));
  }

  protected pour(): void {
    const mix = this.mix();
    if (mix.length === CRUCIBLE_SLOTS && this.forge.brew(mix as [EssenceId, EssenceId, EssenceId]) !== null) {
      this.mix.set([]);
    }
  }

  protected fuse(type: RuneType, rank: number): void {
    this.forge.fuse({ type, rank });
  }

  /** Sertit la rune attendue ; sinon, dit laquelle il faut et combien le joueur en a. */
  protected setRune(index: number): void {
    const socket = this.sockets()[index];
    if (socket === undefined || socket.filled) {
      return;
    }
    if (!socket.open) {
      this.message.set({ text: `Cet emplacement s'ouvre une fois l'étoile ${socket.star - 1} obtenue.`, success: false });
      return;
    }
    if (this.forge.socket(index, this.stars())) {
      this.sound.play('upgrade');
      return;
    }
    this.message.set({ text: `Cet emplacement attend : ${socket.label} (tu en as ${socket.owned}).`, success: false });
  }

  protected openGearRunes(): void {
    this.navigation.open('gear-runes');
  }

  protected close(): void {
    this.navigation.open('evolution');
  }
}
