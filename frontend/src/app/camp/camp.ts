import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { BUILDING_IDS, BuildingId, CAMP_UNLOCK_ZONE, campMaterial } from '../balance/camp';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import {
  BuildingCost,
  buildingCost,
  buildingLevel,
  CampState,
  collectedAt,
  EMPTY_CAMP,
  isMaxLevel,
  isValidCampState,
  offlineCapMs,
  tavernBonus,
  wellShardsPerHour,
  wellStock,
} from './camp-rules';

const STORAGE_KEY = 'mine-explorer.camp';
/** Le stock du puits affiché se met à jour à ce rythme : un éclat met au moins 20 minutes à venir. */
const WELL_REFRESH_MS = 30_000;

/** Ce qui empêche de construire ou d'agrandir un bâtiment, ou 'ok'. */
export type BuildCheck = 'ok' | 'locked' | 'max' | 'gold' | 'ores';

/** Campement : Taverne, Entrepôt et Puits, payés en or et en minerai de la dernière zone terminée. */
@Injectable({ providedIn: 'root' })
export class Camp {
  private readonly clock = inject(CLOCK);
  private readonly wallet = inject(Wallet);
  private readonly ores = inject(Ores);
  private readonly shards = inject(GeodeShards);
  private readonly progression = inject(Progression);
  private readonly state = signal<CampState>(loadCamp());
  private readonly now = signal(this.clock());

  readonly levels = computed(() => this.state().levels);
  readonly unlocked = computed(() => this.progression.zone() >= CAMP_UNLOCK_ZONE);
  readonly unlockZone = CAMP_UNLOCK_ZONE;
  readonly material = computed(() => campMaterial(this.progression.zone()));
  readonly spendableOres = computed(() => this.ores.stock()[this.material()]);
  readonly tavernBonus = computed(() => tavernBonus(this.levels()));
  readonly offlineCapMs = computed(() => offlineCapMs(this.levels()));
  readonly wellRate = computed(() => wellShardsPerHour(this.levels()));
  readonly wellStock = computed(() => wellStock(this.state(), this.now()));
  /** Pastille du menu : éclats prêts au puits, ou bâtiments qu'on peut agrandir tout de suite. */
  readonly ready = computed(() => (this.wellStock() > 0 ? 1 : 0) + BUILDING_IDS.filter((id) => this.check(id) === 'ok').length);

  constructor() {
    const timer = setInterval(() => this.now.set(this.clock()), WELL_REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  level(building: BuildingId): number {
    return buildingLevel(this.levels(), building);
  }

  cost(building: BuildingId): BuildingCost {
    const cost = buildingCost(this.level(building), this.progression.zone());
    return { ...cost, gold: Math.round(cost.gold * this.progression.goldPriceScale()) };
  }

  check(building: BuildingId): BuildCheck {
    if (!this.unlocked()) {
      return 'locked';
    }
    if (isMaxLevel(this.levels(), building)) {
      return 'max';
    }
    const cost = this.cost(building);
    if (this.wallet.coins() < cost.gold) {
      return 'gold';
    }
    return (cost.ores[this.material()] ?? 0) > this.spendableOres() ? 'ores' : 'ok';
  }

  /** Paie or et minerai, puis agrandit le bâtiment. Le puits commence à produire dès sa construction. */
  build(building: BuildingId): boolean {
    if (this.check(building) !== 'ok') {
      return false;
    }
    const cost = this.cost(building);
    this.ores.spend(cost.ores);
    this.wallet.spend(cost.gold);
    const current = this.state();
    const startsWell = building === 'well' && current.wellCollectedAt === null;
    this.save({
      levels: { ...current.levels, [building]: this.level(building) + 1 },
      wellCollectedAt: startsWell ? this.clock() : current.wellCollectedAt,
    });
    return true;
  }

  /** Récolte les éclats du puits ; renvoie le nombre récolté. */
  collectWell(): number {
    const now = this.clock();
    this.now.set(now);
    const stock = wellStock(this.state(), now);
    if (stock === 0) {
      return 0;
    }
    this.shards.add(stock);
    this.save({ ...this.state(), wellCollectedAt: collectedAt(this.state(), now, stock) });
    return stock;
  }

  private save(next: CampState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadCamp(): CampState {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_CAMP;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidCampState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde du Campement invalide ignorée');
  return EMPTY_CAMP;
}
