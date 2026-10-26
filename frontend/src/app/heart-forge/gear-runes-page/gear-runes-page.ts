import { Component, computed, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { AWAKENING_SOCKET_LEVELS } from '../../balance/awakening';
import { GEAR_SOCKETS_MAX } from '../../balance/gear-runes';
import { ESSENCE_LABELS, ESSENCES, EssenceId, RUNE_ELEMENTS, RUNE_LABELS, RuneType } from '../../balance/heart-forge';
import { BONUS_IDS, BonusId, NO_BONUSES } from '../../balance/skill-tree';
import { SLOT_IDS, SLOTS, SlotId } from '../../equipment/equipment.model';
import { describeBonus, describeBonuses } from '../../miner/bonus-format';
import { Navigation } from '../../navigation/navigation';
import { GearRunes } from '../gear-runes';
import { resonantType, runeEffects } from '../gear-runes-rules';
import { HeartForge } from '../heart-forge';
import { createCost, growCost, Rune } from '../heart-forge-rules';
import { runeIconUrl } from '../heart-forge-page/heart-forge-page';

/** Châsse choisie, dont on affiche les runes à sertir. */
interface Selection {
  readonly slot: SlotId;
  readonly socket: number;
}

/** Coût en ressources, en toutes lettres : « 25 Braise vive ». */
function describeCost(cost: Partial<Record<EssenceId, number>>): string {
  return ESSENCES.filter((id) => (cost[id] ?? 0) > 0)
    .map((id) => `${cost[id]} ${ESSENCE_LABELS[id]}`)
    .join(' et ');
}

function runeLabel(rune: Rune): string {
  return `${RUNE_LABELS[rune.type]} rang ${rune.rank}`;
}

/** Effets d'une rune réunis par bonus, pour une ligne lisible (« +18 % de Frappe »). */
function effectLines(effects: readonly { bonus: BonusId; value: number }[]): string[] {
  const totals: Record<BonusId, number> = { ...NO_BONUSES };
  for (const { bonus, value } of effects) {
    totals[bonus] += value;
  }
  return BONUS_IDS.filter((id) => totals[id] !== 0).map((id) => describeBonus(id, totals[id]));
}

/**
 * Runes d'équipement : chaque emplacement a des châsses (une par étoile du Cœur du monde, deux de plus par l'Éveil).
 * Toucher une châsse vide y crée la rune d'un élément ; toucher une rune la fait grandir avec ses ressources
 * (26/10/2026 : plus de réserve de runes). Retirer rend ce qu'elle a coûté.
 */
@Component({
  selector: 'app-gear-runes-page',
  templateUrl: './gear-runes-page.html',
  styleUrl: './gear-runes-page.scss',
})
export class GearRunesPage {
  protected readonly gearRunes = inject(GearRunes);
  private readonly forge = inject(HeartForge);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);

  protected readonly selection = signal<Selection | null>(null);
  protected readonly totals = computed(() => describeBonuses(this.gearRunes.bonuses()));
  /** Prochaine étoile qui ouvre une châsse, ou null quand les trois sont ouvertes. */
  protected readonly nextSocketStar = computed(() => {
    const open = this.gearRunes.socketCount();
    return open < GEAR_SOCKETS_MAX ? open + 1 : null;
  });

  protected readonly slots = computed(() => {
    const gear = this.gearRunes.gear();
    const openSockets = this.gearRunes.openSockets();
    const selected = this.selection();
    return SLOT_IDS.map((slot) => {
      const open = openSockets[slot];
      const runes = gear[slot];
      const resonant = resonantType(runes.slice(0, open));
      const resonance = resonant !== null;
      const effects = runes
        .slice(0, open)
        .flatMap((rune) => (rune === null ? [] : runeEffects(rune, slot, rune.type === resonant)));
      return {
        slot,
        label: SLOTS[slot].label,
        icon: SLOTS[slot].iconUrl,
        resonance,
        lines: effectLines(effects),
        sockets: runes.map((rune, socket) => ({
          socket,
          open: socket < open,
          // Une rune restée dans une châsse refermée (pièce qui n'est plus Divin) peut encore être retirée
          reachable: socket < open || rune !== null,
          lockLabel: socket < GEAR_SOCKETS_MAX ? `★${socket + 1}` : `Éveil ${AWAKENING_SOCKET_LEVELS[socket - GEAR_SOCKETS_MAX]}`,
          lockHint:
            socket < GEAR_SOCKETS_MAX
              ? `Châsse fermée jusqu'à l'étoile ${socket + 1}`
              : `Châsse fermée jusqu'à l'Éveil ${AWAKENING_SOCKET_LEVELS[socket - GEAR_SOCKETS_MAX]} d'une pièce Divin`,
          rune,
          icon: rune === null ? null : runeIconUrl(rune.type),
          selected: selected?.slot === slot && selected.socket === socket,
          label: rune === null ? 'Châsse vide' : runeLabel(rune),
        })),
      };
    });
  });

  /** Éléments qu'on peut créer dans la châsse choisie (vide), avec leur coût et ce qu'ils y donneraient. */
  protected readonly choices = computed(() => {
    const selection = this.selection();
    if (selection === null || this.gearRunes.gear()[selection.slot][selection.socket] !== null) {
      return [];
    }
    this.forge.essences();
    return RUNE_ELEMENTS.map((type) => {
      const rune = { type, rank: 1 };
      return {
        type,
        icon: runeIconUrl(type),
        label: RUNE_LABELS[type],
        cost: describeCost(createCost(type)),
        affordable: this.gearRunes.canCreate(selection.slot, selection.socket, type),
        lines: effectLines(runeEffects(rune, selection.slot, false)),
      };
    });
  });

  /** Croissance de la rune de la châsse choisie : son coût et ce qu'elle donnera au rang suivant. */
  protected readonly growth = computed(() => {
    const selection = this.selection();
    const rune = selection === null ? null : this.gearRunes.gear()[selection.slot][selection.socket];
    if (selection === null || rune === null) {
      return null;
    }
    this.forge.essences();
    const cost = growCost(rune);
    return {
      cost: cost === null ? null : describeCost(cost),
      affordable: this.gearRunes.canGrow(selection.slot, selection.socket),
      next: cost === null ? [] : effectLines(runeEffects({ type: rune.type, rank: rune.rank + 1 }, selection.slot, false)),
    };
  });

  /** Icône de la rune de la châsse choisie, ou chaîne vide si elle est vide. */
  protected readonly selectedIcon = computed(() => {
    const selection = this.selection();
    const rune = selection === null ? null : this.gearRunes.gear()[selection.slot][selection.socket];
    return rune === null ? '' : runeIconUrl(rune.type);
  });

  protected readonly selectedLabel = computed(() => {
    const selection = this.selection();
    return selection === null ? '' : `${SLOTS[selection.slot].label}, châsse ${selection.socket + 1}`;
  });

  protected select(slot: SlotId, socket: number, reachable: boolean): void {
    if (!reachable) {
      return;
    }
    const current = this.selection();
    this.selection.set(current?.slot === slot && current.socket === socket ? null : { slot, socket });
  }

  protected createRune(type: RuneType): void {
    const selection = this.selection();
    if (selection !== null && this.gearRunes.create(selection.slot, selection.socket, type)) {
      this.sound.play('upgrade');
    }
  }

  protected growRune(): void {
    const selection = this.selection();
    if (selection !== null && this.gearRunes.grow(selection.slot, selection.socket)) {
      this.sound.play('upgrade');
    }
  }

  protected removeRune(): void {
    const selection = this.selection();
    if (selection !== null) {
      this.gearRunes.remove(selection.slot, selection.socket);
      this.selection.set(null);
    }
  }

  protected close(): void {
    this.navigation.open('heart-forge');
  }
}
