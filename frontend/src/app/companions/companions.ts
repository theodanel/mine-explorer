import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';

import { CHEST_EGG_CHANCE, COMPANION_IDS, CompanionId, COMPANIONS_UNLOCK_ZONE, feedCost } from '../balance/companions';
import { Rarity } from '../balance/skill-tree';
import { workshopMaterial } from '../balance/workshop';
import { Evolution } from '../evolution/evolution';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { reservedOres } from '../workshop/workshop-rules';
import {
  activeCompanionBonuses,
  addEgg,
  canFeed,
  canHatch,
  canSend,
  collectExpedition,
  CompanionState,
  EMPTY_COMPANIONS,
  ExpeditionLoot,
  feed,
  hatch,
  Hatching,
  isValidCompanionState,
  rollEggRarity,
  sendOnExpedition,
  setActive,
} from './companion-rules';

const STORAGE_KEY = 'mine-explorer.companions';
/** Les minuteurs d'éclosion et d'expédition s'affichent à la seconde. */
const TICK_MS = 1000;

/**
 * Compagnons : œufs trouvés en jouant, éclosion par minuteur (qui continue jeu fermé), un compagnon qui accompagne
 * le mineur et donne son bonus, les autres en expédition. L'onglet s'ouvre à la zone 3 avec un œuf commun offert.
 */
@Injectable({ providedIn: 'root' })
export class Companions {
  private readonly progression = inject(Progression);
  private readonly evolution = inject(Evolution);
  private readonly ores = inject(Ores);
  private readonly shards = inject(GeodeShards);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM);
  private readonly state = signal<CompanionState>(loadState());
  private readonly nowState = signal(this.clock());
  private readonly lastHatching = signal<Hatching | null>(null);

  readonly now = this.nowState.asReadonly();
  readonly owned = computed(() => this.state().owned);
  readonly active = computed(() => this.state().active);
  readonly eggs = computed(() => this.state().eggs);
  readonly incubating = computed(() => this.state().incubating);
  readonly expeditions = computed(() => this.state().expeditions);
  readonly sinceLegendary = computed(() => this.state().sinceLegendary);
  readonly unlocked = computed(() => this.progression.zone() >= COMPANIONS_UNLOCK_ZONE);
  readonly bonuses = computed(() => activeCompanionBonuses(this.state()));
  readonly hatchReady = computed(() => canHatch(this.state(), this.now()));
  /** Compagnon tout juste éclos, pour la fenêtre de découverte. */
  readonly hatching = this.lastHatching.asReadonly();
  /** Ce qui attend le joueur dans l'onglet : un œuf prêt, des compagnons rentrés d'expédition. */
  readonly ready = computed(
    () =>
      (this.hatchReady() ? 1 : 0) +
      Object.values(this.expeditions()).filter((expedition) => expedition !== undefined && expedition.endsAt <= this.now()).length,
  );
  /** Minerai pour nourrir : celui de la dernière zone terminée, comme à l'Atelier. */
  readonly feedMaterial = computed(() => workshopMaterial(this.progression.zone()));
  readonly spendableOres = computed(() => {
    const tier = this.feedMaterial();
    return Math.max(this.ores.stock()[tier] - reservedOres(this.evolution.index(), tier), 0);
  });

  constructor() {
    const timer = setInterval(() => this.nowState.set(this.clock()), TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    // Premier œuf offert dès l'ouverture de l'onglet
    effect(() => {
      if (this.unlocked() && !this.state().gifted) {
        this.save({ ...addEgg(this.state(), 'common', this.clock()), gifted: true });
      }
    });
  }

  /** Un œuf trouvé (fin de zone). Rien avant l'ouverture de l'onglet. */
  findEgg(): Rarity | null {
    if (!this.unlocked()) {
      return null;
    }
    const rarity = rollEggRarity(this.random, this.state().sinceLegendary);
    this.save(addEgg(this.state(), rarity, this.clock()));
    return rarity;
  }

  /** Petite chance d'œuf dans un coffre (coffre enseveli, coffre des missions du jour). */
  rollChestEgg(): Rarity | null {
    return this.random() < CHEST_EGG_CHANCE ? this.findEgg() : null;
  }

  hatch(): Hatching | null {
    const result = hatch(this.state(), this.random, this.clock());
    if (result === null) {
      return null;
    }
    this.save(result.state);
    if (result.hatching.shards > 0) {
      this.shards.add(result.hatching.shards);
    }
    this.lastHatching.set(result.hatching);
    return result.hatching;
  }

  dismissHatching(): void {
    this.lastHatching.set(null);
  }

  setActive(id: CompanionId): void {
    this.save(setActive(this.state(), id));
  }

  feedCost(id: CompanionId): number {
    return feedCost(this.state().owned[id]?.level ?? 1);
  }

  canFeed(id: CompanionId): boolean {
    return canFeed(this.state(), id) && this.spendableOres() >= this.feedCost(id);
  }

  feed(id: CompanionId): boolean {
    if (!this.canFeed(id)) {
      return false;
    }
    this.ores.spend({ [this.feedMaterial()]: this.feedCost(id) });
    this.save(feed(this.state(), id));
    return true;
  }

  canSend(id: CompanionId, hours: number): boolean {
    return canSend(this.state(), id, hours);
  }

  send(id: CompanionId, hours: number): void {
    this.save(sendOnExpedition(this.state(), id, hours, this.clock()));
  }

  collect(id: CompanionId): ExpeditionLoot | null {
    const result = collectExpedition(this.state(), id, this.clock());
    if (result === null) {
      return null;
    }
    this.save(result.state);
    if (result.loot.shards > 0) {
      this.shards.add(result.loot.shards);
    }
    if (result.loot.ores > 0) {
      this.ores.add(this.feedMaterial(), result.loot.ores);
    }
    return result.loot;
  }

  /** Nombre de compagnons différents trouvés. */
  readonly foundCount = computed(() => COMPANION_IDS.filter((id) => this.owned()[id] !== undefined).length);

  private save(next: CompanionState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadState(): CompanionState {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_COMPANIONS;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidCompanionState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde des compagnons invalide ignorée');
  return EMPTY_COMPANIONS;
}
