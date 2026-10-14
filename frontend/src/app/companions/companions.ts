import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';

import { COMPANION_IDS, CompanionId, COMPANIONS_UNLOCK_ZONE, zoneClearGivesEgg } from '../balance/companions';
import { Rarity } from '../balance/skill-tree';
import { Progression } from '../progression/progression';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import {
  activeCompanionBonuses,
  addEgg,
  canHatch,
  canSend,
  collectExpedition,
  CompanionState,
  EMPTY_COMPANIONS,
  ExpeditionLoot,
  hatch,
  Hatching,
  isValidCompanionState,
  migrateCompanionState,
  nextStarCost,
  raiseStar,
  rollEggRarity,
  sendOnExpedition,
  setActive,
} from './companion-rules';

const STORAGE_KEY = 'mine-explorer.companions';
/** Dernière zone terminée dont l'œuf a été donné. Absente des sauvegardes d'avant les œufs de zone. */
const ZONE_EGGS_KEY = 'mine-explorer.zone-eggs';
/** Les minuteurs d'éclosion et d'expédition s'affichent à la seconde. */
const TICK_MS = 1000;

/**
 * Compagnons : œufs gagnés au Défi de la mine, éclosion par minuteur (qui continue jeu fermé), un compagnon
 * qui accompagne le mineur et donne son bonus, les autres en expédition. Les pierres d'éveil font monter les étoiles.
 * L'onglet s'ouvre à la zone 3 avec un œuf commun offert.
 */
@Injectable({ providedIn: 'root' })
export class Companions {
  private readonly progression = inject(Progression);
  private readonly shards = inject(GeodeShards);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM);
  private readonly state = signal<CompanionState>(loadState());
  private readonly nowState = signal(this.clock());
  private readonly lastHatching = signal<Hatching | null>(null);
  private zoneEggsUpTo = loadZoneEggs();

  readonly now = this.nowState.asReadonly();
  readonly owned = computed(() => this.state().owned);
  readonly active = computed(() => this.state().active);
  readonly eggs = computed(() => this.state().eggs);
  readonly incubating = computed(() => this.state().incubating);
  readonly expeditions = computed(() => this.state().expeditions);
  readonly sinceLegendary = computed(() => this.state().sinceLegendary);
  /** Pierres d'éveil en stock. */
  readonly stones = computed(() => this.state().stones);
  readonly unlocked = computed(() => this.progression.zone() >= COMPANIONS_UNLOCK_ZONE);
  readonly bonuses = computed(() => activeCompanionBonuses(this.state()));
  readonly hatchReady = computed(() => canHatch(this.state(), this.now()));
  /** Compagnon tout juste éclos, pour la fenêtre de découverte. */
  readonly hatching = this.lastHatching.asReadonly();
  /** Nombre de compagnons différents trouvés. */
  readonly foundCount = computed(() => COMPANION_IDS.filter((id) => this.owned()[id] !== undefined).length);
  /** Ce qui attend le joueur dans l'onglet : un œuf prêt, des compagnons rentrés, une étoile payable. */
  readonly ready = computed(
    () =>
      (this.hatchReady() ? 1 : 0) +
      Object.values(this.expeditions()).filter((expedition) => expedition !== undefined && expedition.endsAt <= this.now()).length +
      COMPANION_IDS.filter((id) => this.canRaiseStar(id)).length,
  );

  constructor() {
    const timer = setInterval(() => this.nowState.set(this.clock()), TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    // Premier œuf offert dès l'ouverture de l'onglet
    effect(() => {
      if (this.unlocked() && !this.state().gifted) {
        this.save({ ...addEgg(this.state(), 'common', this.clock()), gifted: true });
      }
    });
    // Rattrapage : un joueur déjà loin reçoit les œufs des zones terminées avant leur arrivée
    this.grantZoneEggs(this.progression.zone() - 1);
  }

  /** Un œuf commun par zone terminée (à partir de la zone 3), chacune une seule fois, même rejouée. */
  grantZoneEggs(lastClearedZone: number): void {
    const alreadyPaid = this.zoneEggsUpTo ?? 0;
    if (lastClearedZone <= alreadyPaid) {
      return;
    }
    for (let zone = alreadyPaid + 1; zone <= lastClearedZone; zone++) {
      if (zoneClearGivesEgg(zone)) {
        this.addEgg();
      }
    }
    this.zoneEggsUpTo = lastClearedZone;
    writeStorage(ZONE_EGGS_KEY, String(lastClearedZone));
  }

  /** Un œuf gagné (Défi de la mine), jamais sous la rareté donnée. */
  addEgg(minRarity: Rarity = 'common'): Rarity {
    const rarity = rollEggRarity(this.random, this.state().sinceLegendary, minRarity);
    this.save(addEgg(this.state(), rarity, this.clock()));
    return rarity;
  }

  addStones(amount: number): void {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new RangeError(`Quantité de pierres d'éveil invalide : ${amount}`);
    }
    this.save({ ...this.state(), stones: this.state().stones + amount });
  }

  hatch(): Hatching | null {
    const result = hatch(this.state(), this.random, this.clock());
    if (result === null) {
      return null;
    }
    this.save(result.state);
    this.lastHatching.set(result.hatching);
    return result.hatching;
  }

  dismissHatching(): void {
    this.lastHatching.set(null);
  }

  setActive(id: CompanionId): void {
    this.save(setActive(this.state(), id));
  }

  /** Pierres pour l'étoile suivante, ou null au maximum. */
  starCost(id: CompanionId): number | null {
    return nextStarCost(this.state(), id);
  }

  canRaiseStar(id: CompanionId): boolean {
    const cost = this.starCost(id);
    return cost !== null && this.stones() >= cost;
  }

  raiseStar(id: CompanionId): boolean {
    if (!this.canRaiseStar(id)) {
      return false;
    }
    this.save(raiseStar(this.state(), id));
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
    return result.loot;
  }

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
    const value = migrateCompanionState(JSON.parse(raw));
    if (isValidCompanionState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde des compagnons invalide ignorée');
  return EMPTY_COMPANIONS;
}

function loadZoneEggs(): number | null {
  const raw = readStorage(ZONE_EGGS_KEY);
  if (raw === null) {
    return null;
  }
  const zone = Number(raw);
  if (Number.isSafeInteger(zone) && zone >= 0) {
    return zone;
  }
  console.warn('Sauvegarde des œufs de zone invalide ignorée');
  return null;
}
