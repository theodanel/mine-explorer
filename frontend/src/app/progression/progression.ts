import { computed, Injectable, signal } from '@angular/core';

import { readStorage, writeStorage } from '../shared/local-storage';
import {
  applyDamage,
  applyFarmDamage,
  canFarm,
  Farm,
  farmRockHp,
  isValidFarm,
  isValidProgress,
  migrateProgress,
  Progress,
  remainingHp,
  rockHealth,
  stageLabel,
  stagesReached,
  START_PROGRESS,
} from './progression-rules';

const STORAGE_KEY = 'mine-explorer.progress';
const FARM_KEY = 'mine-explorer.farm';

/** Ce qu'a fait un coup : le filon cassé, la zone terminée, et les PV réellement minés. */
export interface HitResult {
  readonly rockBroken: boolean;
  readonly clearedZone: number | null;
  /** PV minés par le coup, plafonnés au filon en mode retour (l'or en dépend). */
  readonly mined: number;
  /** Vrai si le coup a été porté dans une zone passée. */
  readonly farming: boolean;
}

/**
 * Avancée du joueur dans la mine : zone, étape et rocher en cours. Le joueur peut aussi revenir miner dans une
 * zone déjà terminée (`farm`) : sa progression attend, et `zone` reste sa zone la plus profonde.
 */
@Injectable({ providedIn: 'root' })
export class Progression {
  private readonly state = signal<Progress>(loadProgress());
  private readonly farmState = signal<Farm | null>(loadFarm(this.state()));

  readonly progress = this.state.asReadonly();
  /** Zone la plus profonde atteinte : c'est elle qui ouvre les menus et fixe les récompenses. */
  readonly zone = computed(() => this.state().zone);
  /** Zone passée où le joueur est revenu miner, ou null. */
  readonly farmZone = computed(() => this.farmState()?.zone ?? null);
  /** Zone affichée et minée en ce moment. */
  readonly playingZone = computed(() => this.farmZone() ?? this.zone());
  readonly label = computed(() => stageLabel(this.state()));
  readonly health = computed(() => {
    const farm = this.farmState();
    return farm === null ? rockHealth(this.state()) : 1 - farm.damage / farmRockHp(farm.zone);
  });
  readonly remainingHp = computed(() => {
    const farm = this.farmState();
    return farm === null ? remainingHp(this.state()) : farmRockHp(farm.zone) - farm.damage;
  });
  readonly stagesReached = computed(() => stagesReached(this.state()));

  hit(damage: number): HitResult {
    const farm = this.farmState();
    if (farm !== null) {
      const result = applyFarmDamage(farm, damage);
      this.saveFarm(result.farm);
      return { rockBroken: result.rockBroken, clearedZone: null, mined: result.mined, farming: true };
    }
    const result = applyDamage(this.state(), damage);
    this.state.set(result.progress);
    writeStorage(STORAGE_KEY, JSON.stringify(result.progress));
    return { rockBroken: result.rockBroken, clearedZone: result.clearedZone, mined: damage, farming: false };
  }

  /** Revient miner dans une zone déjà terminée. Refusé pour la zone en cours ou une zone pas encore atteinte. */
  startFarm(zone: number): boolean {
    if (!canFarm(this.state(), zone)) {
      return false;
    }
    this.saveFarm({ zone, damage: 0 });
    return true;
  }

  /** Reprend la progression là où elle en était. */
  stopFarm(): void {
    this.saveFarm(null);
  }

  private saveFarm(farm: Farm | null): void {
    this.farmState.set(farm);
    writeStorage(FARM_KEY, JSON.stringify(farm));
  }
}

function loadProgress(): Progress {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return START_PROGRESS;
  }
  try {
    const value = migrateProgress(JSON.parse(raw));
    if (isValidProgress(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde de progression invalide ignorée');
  return START_PROGRESS;
}

function loadFarm(progress: Progress): Farm | null {
  const raw = readStorage(FARM_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (value === null || isValidFarm(value, progress)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde du retour en zone passée invalide ignorée');
  return null;
}
