import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { guardianPower } from '../balance/balance';
import { Rebirth } from '../rebirth/rebirth';
import { CLOCK } from '../shared/clock';

import { readStorage, writeStorage } from '../shared/local-storage';
import {
  applyDamage,
  applyFarmDamage,
  BEFORE_GUARDIAN_STAGE,
  canFarm,
  challengeGuardian,
  failGuardian,
  Farm,
  farmHp,
  guardianTimeLeft,
  isGuardian,
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
const BLOCKED_KEY = 'mine-explorer.guardian-blocked';
/** Rafraîchissement du chrono du gardien : assez fin pour un compte à rebours fluide. */
const GUARDIAN_TICK_MS = 100;

/** Ce qu'a fait un coup : le filon cassé, la zone terminée, et les PV réellement minés. */
export interface HitResult {
  readonly rockBroken: boolean;
  readonly clearedZone: number | null;
  /** PV minés par le coup, plafonnés au filon en mode retour (l'or en dépend). */
  readonly mined: number;
  /** Vrai si le coup a été porté dans une zone passée. */
  readonly farming: boolean;
  /** Zone de l'Écho miné, ou null hors Écho. */
  readonly echoZone: number | null;
}

/**
 * Avancée du joueur dans la mine : zone, étape et rocher en cours. Le joueur peut aussi revenir miner dans une
 * zone déjà terminée (`farm`) : sa progression attend, et `zone` reste sa zone la plus profonde.
 */
@Injectable({ providedIn: 'root' })
export class Progression {
  private readonly clock = inject(CLOCK);
  /** Dureté de la vie en cours : les filons gagnent des PV à chaque renaissance. */
  private readonly hardness = computed(() => this.rebirth.effects().hardness);
  private readonly rebirth = inject(Rebirth);
  private readonly state = signal<Progress>(loadProgress(this.rebirth.effects().hardness));
  private readonly farmState = signal<Farm | null>(loadFarm(this.state()));
  /** Gardien raté : le filon d'avant se reforme sans fin jusqu'à ce que le joueur le défie à nouveau. */
  private readonly blockedState = signal(loadBlocked(this.state()));
  /** Début du combat contre le gardien, ou null hors combat. */
  private readonly guardianStartedAt = signal<number | null>(null);
  private readonly now = signal(this.clock());
  private guardianTimer: ReturnType<typeof setInterval> | null = null;

  readonly progress = this.state.asReadonly();
  /** Zone la plus profonde atteinte : c'est elle qui ouvre les menus et fixe les récompenses. */
  readonly zone = computed(() => this.state().zone);
  /** Zone passée où le joueur est revenu miner, ou null. */
  readonly farmZone = computed(() => this.farmState()?.zone ?? null);
  /** Zone affichée et minée en ce moment. */
  readonly playingZone = computed(() => this.farmZone() ?? this.zone());
  /** Le joueur mine un Écho : une zone passée devenue plus dure, qui donne sa ressource à chaque filon. */
  readonly inEcho = computed(() => this.farmState()?.echoHp !== undefined);
  /** PV de chaque filon de l'Écho en cours, ou null. */
  readonly echoHp = computed(() => this.farmState()?.echoHp ?? null);
  readonly label = computed(() => stageLabel(this.state()));
  readonly health = computed(() => {
    const farm = this.farmState();
    return farm === null ? rockHealth(this.state(), this.hardness()) : 1 - farm.damage / farmHp(farm);
  });
  readonly remainingHp = computed(() => {
    const farm = this.farmState();
    return farm === null ? remainingHp(this.state(), this.hardness()) : farmHp(farm) - farm.damage;
  });
  readonly stagesReached = computed(() => stagesReached(this.state()));
  /** Combat en cours contre le gardien de la zone (pas en zone passée). */
  readonly guardianFight = computed(() => this.farmState() === null && this.guardianStartedAt() !== null);
  /** Millisecondes restantes contre le gardien. */
  readonly guardianTimeLeft = computed(() => {
    const startedAt = this.guardianStartedAt();
    return startedAt === null ? 0 : guardianTimeLeft(startedAt, this.now());
  });
  readonly blocked = this.blockedState.asReadonly();
  /** Puissance qui casse le gardien de la zone juste à temps. */
  readonly guardianPower = computed(() => Math.round(guardianPower(this.state().zone) * this.hardness()));

  constructor() {
    // Une partie rechargée devant le gardien repart d'un combat neuf : le chrono ne survit pas à la fermeture
    if (isGuardian(this.state())) {
      this.saveProgress({ ...this.state(), damage: 0 });
      this.startGuardianFight();
    }
    inject(DestroyRef).onDestroy(() => this.stopGuardianTimer());
  }

  hit(damage: number): HitResult {
    const farm = this.farmState();
    if (farm !== null) {
      const result = applyFarmDamage(farm, damage);
      this.saveFarm(result.farm);
      return { rockBroken: result.rockBroken, clearedZone: null, mined: result.mined, farming: true, echoZone: farm.echoHp !== undefined ? farm.zone : null };
    }
    this.checkGuardianTimeout();
    const before = this.state();
    const result = applyDamage(before, damage, this.blockedState(), this.hardness());
    this.saveProgress(result.progress);
    if (isGuardian(result.progress) && !isGuardian(before)) {
      this.startGuardianFight();
    } else if (result.clearedZone !== null) {
      this.endGuardianFight();
    }
    return { rockBroken: result.rockBroken, clearedZone: result.clearedZone, mined: damage, farming: false, echoZone: null };
  }

  /** Défie à nouveau le gardien raté, avec tous ses PV et un chrono neuf. */
  challengeGuardian(): boolean {
    if (!this.blockedState() || this.state().stage !== BEFORE_GUARDIAN_STAGE) {
      return false;
    }
    this.saveBlocked(false);
    this.saveProgress(challengeGuardian(this.state()));
    this.startGuardianFight();
    return true;
  }

  private startGuardianFight(): void {
    this.guardianStartedAt.set(this.clock());
    this.now.set(this.clock());
    this.stopGuardianTimer();
    this.guardianTimer = setInterval(() => {
      this.now.set(this.clock());
      this.checkGuardianTimeout();
    }, GUARDIAN_TICK_MS);
  }

  /** Temps écoulé : le gardien se reforme et le joueur retombe sur le filon d'avant. */
  private checkGuardianTimeout(): void {
    const startedAt = this.guardianStartedAt();
    if (startedAt === null || guardianTimeLeft(startedAt, this.clock()) > 0) {
      return;
    }
    this.endGuardianFight();
    this.saveProgress(failGuardian(this.state()));
    this.saveBlocked(true);
  }

  private endGuardianFight(): void {
    this.guardianStartedAt.set(null);
    this.stopGuardianTimer();
  }

  private stopGuardianTimer(): void {
    if (this.guardianTimer !== null) {
      clearInterval(this.guardianTimer);
      this.guardianTimer = null;
    }
  }

  private saveProgress(progress: Progress): void {
    this.state.set(progress);
    writeStorage(STORAGE_KEY, JSON.stringify(progress));
  }

  private saveBlocked(blocked: boolean): void {
    this.blockedState.set(blocked);
    writeStorage(BLOCKED_KEY, JSON.stringify(blocked));
  }

  /**
   * Revient miner dans une zone déjà terminée, ou dans son Écho quand `echoHp` est donné. Refusé pour la zone en cours
   * ou une zone pas encore atteinte.
   */
  startFarm(zone: number, echoHp?: number): boolean {
    if (!canFarm(this.state(), zone)) {
      return false;
    }
    this.saveFarm(echoHp === undefined ? { zone, damage: 0 } : { zone, damage: 0, echoHp });
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

function loadProgress(hardness: number): Progress {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return START_PROGRESS;
  }
  try {
    const value = migrateProgress(JSON.parse(raw), hardness);
    if (isValidProgress(value, hardness)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde de progression invalide ignorée');
  return START_PROGRESS;
}

/** Le blocage n'a de sens que sur le filon d'avant le gardien : ailleurs, il est ignoré. */
function loadBlocked(progress: Progress): boolean {
  const raw = readStorage(BLOCKED_KEY);
  if (raw === null) {
    return false;
  }
  if (raw !== 'true' && raw !== 'false') {
    console.warn('Sauvegarde du gardien invalide ignorée');
    return false;
  }
  return raw === 'true' && progress.stage === BEFORE_GUARDIAN_STAGE;
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
