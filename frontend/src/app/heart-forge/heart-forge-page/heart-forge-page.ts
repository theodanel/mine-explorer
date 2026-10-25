import { Component, computed, effect, inject, signal, untracked } from '@angular/core';

import { Sound } from '../../audio/sound';
import { ALLIANCE_RUNES, ESSENCE_LABELS, ESSENCES, EssenceId, MAX_RUNE_RANK, RUNE_LABELS, RUNE_TYPES, RuneType, STAR_RUNES } from '../../balance/heart-forge';
import { EVOLUTION_VISUALS } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { readStorage, writeStorage } from '../../shared/local-storage';
import { HeartForge } from '../heart-forge';
import { HeartForgeHelp } from '../heart-forge-help/heart-forge-help';
import { createCost, growCost, knowsRecipe, runeCount, socketOpen, socketRune, socketStar } from '../heart-forge-rules';
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
/** Durée d'affichage d'une rune tout juste créée ou grandie. */
const MESSAGE_MS = 2500;

export function runeIconUrl(type: RuneType): string {
  return `assets/ui/forge-du-coeur/rune-${type}.webp`;
}

export function essenceIconUrl(id: EssenceId): string {
  return `assets/ui/forge-du-coeur/essence-${id}.webp`;
}

export function isAlliance(type: RuneType): boolean {
  return (ALLIANCE_RUNES as readonly string[]).includes(type);
}

/** « 25 Braise vive et 12 Sève de pierre ». */
function describeCost(cost: Partial<Record<EssenceId, number>>): string {
  return ESSENCES.filter((id) => (cost[id] ?? 0) > 0)
    .map((id) => `${cost[id]} ${ESSENCE_LABELS[id]}`)
    .join(' et ');
}

/** Étoile qui demande une alliance, et donc révèle sa recette. */
function revealingStar(type: RuneType): number {
  return STAR_RUNES.findIndex((runes) => runes.some((rune) => rune.type === type)) + 1;
}

/**
 * Forge du Cœur : l'anneau du Cœur du monde (10 emplacements, 2 par étoile), le Creuset où les ressources des Échos
 * créent des runes, et la réserve où on les fait grandir jusqu'au rang 5 (runes qui grandissent, 25/10/2026).
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
  protected readonly message = signal<{ text: string; success: boolean } | null>(null);
  protected readonly helpOpen = signal(readStorage(HELP_SEEN_KEY) === null);

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

  /** Les 5 ressources en réserve. */
  protected readonly essences = computed(() => {
    const stock = this.forge.essences();
    return ESSENCES.map((id) => ({ id, label: ESSENCE_LABELS[id], icon: essenceIconUrl(id), left: stock[id] }));
  });

  /** Runes à créer : les éléments, et les alliances dont une étoile a révélé la recette. */
  protected readonly creations = computed(() => {
    const state = this.forge.snapshot();
    const stars = this.stars();
    return RUNE_TYPES.map((type) => {
      const known = knowsRecipe(state, type, stars);
      return {
        type,
        label: known ? RUNE_LABELS[type] : '???',
        icon: runeIconUrl(type),
        known,
        cost: known ? describeCost(createCost(type)) : `Révélée à l'étoile ${revealingStar(type)}`,
        canCreate: this.forge.canCreate(type, stars),
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
          ...this.growth(rune),
        };
      }),
    })).filter((row) => row.cells.some((cell) => cell.count > 0));
  });

  /** Ce que coûte la croissance d'une rune de la réserve, et où en est la jauge des ressources. */
  private growth(rune: { type: RuneType; rank: number }) {
    const cost = growCost(rune);
    if (cost === null || runeCount(this.forge.snapshot(), rune) === 0) {
      return { canGrow: false, growCost: null, progress: 0 };
    }
    const stock = this.forge.essences();
    const needed = ESSENCES.reduce((total, id) => total + (cost[id] ?? 0), 0);
    const owned = ESSENCES.reduce((total, id) => total + Math.min(stock[id], cost[id] ?? 0), 0);
    return { canGrow: this.forge.canGrow(rune), growCost: describeCost(cost), progress: Math.round((owned / needed) * PERCENT) };
  }

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
        this.message.set({ text: event.kind === 'create' ? `Rune ${label} créée` : `La rune grandit : ${label} !`, success: true });
        this.sound.play(event.kind === 'create' ? 'forgeRare' : 'forgeEpic');
      });
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => this.message.set(null), MESSAGE_MS);
    });
  }

  protected create(type: RuneType): void {
    this.forge.create(type, this.stars());
  }

  protected grow(type: RuneType, rank: number): void {
    this.forge.grow({ type, rank });
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

