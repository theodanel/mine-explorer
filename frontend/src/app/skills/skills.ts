import { computed, inject, Injectable, signal } from '@angular/core';

import { MAX_PICKAXE_LEVEL, segmentCost } from '../balance/balance';
import { RESPEC_SEGMENTS, SkillNode, SPELL_IDS, SPELL_SLOTS, SpellId } from '../balance/skill-tree';
import { Forge } from '../forge/forge';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { Wallet } from '../wallet/wallet';
import { isValidRanks, learn, learnCheck, LearnCheck, passiveBonuses, pointsEarned, pointsSpent, SkillRanks, spellRank } from './skill-rules';

const STORAGE_KEY = 'mine-explorer.skills';

interface SkillsState {
  readonly ranks: SkillRanks;
  /** Sort de chaque emplacement, de gauche à droite ; null = emplacement vide. */
  readonly equipped: readonly (SpellId | null)[];
  /** Lancement automatique des sorts prêts. */
  readonly auto: boolean;
}

const EMPTY_STATE: SkillsState = { ranks: {}, equipped: Array.from({ length: SPELL_SLOTS }, () => null), auto: false };

/** Arbre de compétences : points gagnés par zone, rangs appris, sorts équipés. */
@Injectable({ providedIn: 'root' })
export class Skills {
  private readonly progression = inject(Progression);
  private readonly wallet = inject(Wallet);
  private readonly forge = inject(Forge);
  private readonly state = signal<SkillsState>(loadState());

  readonly ranks = computed(() => this.state().ranks);
  readonly equipped = computed(() => this.state().equipped);
  readonly auto = computed(() => this.state().auto);
  readonly earned = computed(() => pointsEarned(this.progression.zone()));
  readonly spent = computed(() => pointsSpent(this.ranks()));
  readonly available = computed(() => Math.max(this.earned() - this.spent(), 0));
  readonly bonuses = computed(() => passiveBonuses(this.ranks()));
  /** Prix d'une réinitialisation : un segment de pioche du niveau actuel (le dernier payable au niveau maximum). */
  readonly respecCost = computed(
    () => (segmentCost(Math.min(this.forge.level(), MAX_PICKAXE_LEVEL - 1)) ?? 0) * RESPEC_SEGMENTS,
  );

  check(node: SkillNode): LearnCheck {
    return learnCheck(node, this.ranks(), this.available());
  }

  rank(node: SkillNode): number {
    return this.ranks()[node.id] ?? 0;
  }

  spellRank(spell: SpellId): number {
    return spellRank(this.ranks(), spell);
  }

  /** Apprend un rang. Un sort appris pour la première fois prend le premier emplacement libre. */
  learn(node: SkillNode): boolean {
    if (this.check(node) !== 'ok') {
      return false;
    }
    const firstRank = this.rank(node) === 0;
    let equipped = this.equipped();
    if (node.kind === 'spell' && firstRank) {
      const freeSlot = equipped.indexOf(null);
      if (freeSlot >= 0) {
        equipped = equipped.map((spell, index) => (index === freeSlot ? node.spell : spell));
      }
    }
    this.save({ ...this.state(), ranks: learn(this.ranks(), node), equipped });
    return true;
  }

  /** Place un sort appris dans un emplacement ; s'il était déjà ailleurs, les deux emplacements s'échangent. */
  equip(spell: SpellId, slot: number): void {
    if (this.spellRank(spell) === 0 || slot < 0 || slot >= SPELL_SLOTS) {
      return;
    }
    const current = this.equipped();
    const previousSlot = current.indexOf(spell);
    const next = current.map((candidate, index) => {
      if (index === slot) {
        return spell;
      }
      return index === previousSlot ? current[slot] : candidate;
    });
    this.save({ ...this.state(), equipped: next });
  }

  unequip(slot: number): void {
    this.save({ ...this.state(), equipped: this.equipped().map((spell, index) => (index === slot ? null : spell)) });
  }

  setAuto(auto: boolean): void {
    this.save({ ...this.state(), auto });
  }

  /** Rembourse tous les points contre de l'or. */
  respec(): boolean {
    if (this.spent() === 0 || !this.wallet.spend(this.respecCost())) {
      return false;
    }
    this.save({ ...EMPTY_STATE, auto: this.auto() });
    return true;
  }

  private save(next: SkillsState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadState(): SkillsState {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_STATE;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde des compétences invalide ignorée');
  return EMPTY_STATE;
}

function isValidState(value: unknown): value is SkillsState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { ranks, equipped, auto } = value as Record<string, unknown>;
  return (
    isValidRanks(ranks) &&
    typeof auto === 'boolean' &&
    Array.isArray(equipped) &&
    equipped.length === SPELL_SLOTS &&
    equipped.every((spell) => spell === null || ((SPELL_IDS as readonly unknown[]).includes(spell) && spellRank(ranks, spell as SpellId) > 0))
  );
}
