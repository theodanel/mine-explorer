import { computed, inject, Injectable, signal } from '@angular/core';

import { EVOLUTION_FORMS, evolutionStrikeMultiplier } from '../balance/balance';
import { Forge } from '../forge/forge';
import { MissionCounters } from '../missions/mission-counters';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { GeodeShards } from '../wallet/geode-shards';
import { HeartForge } from '../heart-forge/heart-forge';
import { canEvolve, currentTier, formTitle, EvolutionProgress, isClaimable, nextForm, objectivesFor, unclaimedShards } from './evolution-rules';

const STORAGE_KEY = 'mine-explorer.evolution';
/** Récompenses déjà touchées pour la forme suivante (index des objectifs). */
const CLAIMS_KEY = 'mine-explorer.evolution-claims';

/**
 * Forme actuelle du mineur et passage à la suivante. Façon « Adventure Rank » de Legend of Mushroom :
 * chaque forme se gagne en remplissant des objectifs, sans rien payer, et chaque objectif rapporte des éclats.
 */
@Injectable({ providedIn: 'root' })
export class Evolution {
  private readonly progression = inject(Progression);
  private readonly forge = inject(Forge);
  private readonly counters = inject(MissionCounters).counters;
  private readonly shards = inject(GeodeShards);
  private readonly heartForge = inject(HeartForge);
  private readonly formIndex = signal(loadFormIndex());
  private readonly claimed = signal<readonly number[]>(loadClaims());

  readonly index = this.formIndex.asReadonly();
  readonly form = computed(() => EVOLUTION_FORMS[this.formIndex()]);
  readonly next = computed(() => nextForm(this.formIndex()));
  /** Nom de la forme actuelle, étoiles comprises. */
  readonly title = computed(() => formTitle(this.form()));
  /** Nom de la forme suivante, étoiles comprises (null à la forme ultime). */
  readonly nextTitle = computed(() => {
    const form = this.next();
    return form === null ? null : formTitle(form);
  });
  /** Multiplicateur de Frappe cumulé de toutes les formes atteintes. */
  readonly strikeMultiplier = computed(() => evolutionStrikeMultiplier(this.formIndex()));

  readonly progress = computed<EvolutionProgress>(() => ({
    zone: this.progression.zone(),
    pickaxeLevel: this.forge.level(),
    itemsForged: this.counters().itemsForged,
    rocksBroken: this.counters().rocksBroken,
    // Une zone est terminée quand son gardien est battu : on est alors dans la suivante
    zoneCleared: this.progression.zone() - 1,
  }));

  readonly objectives = computed(() => {
    const form = this.next();
    return form === null ? [] : objectivesFor(form, this.progress(), this.claimed());
  });
  /** L'Astre du Cœur a atteint le stade de l'étoile suivante (toujours vrai hors Cœur du monde). */
  readonly runesSet = computed(() => {
    const next = this.next();
    return next === null || next.id !== 'heart' || this.heartForge.starReady(next.stars);
  });
  readonly ready = computed(() => canEvolve(this.objectives()) && this.runesSet());
  /** Palier en cours de la forme suivante. */
  readonly tier = computed(() => {
    const form = this.next();
    return form === null ? 0 : currentTier(form, this.progress());
  });
  /** Récompenses d'objectifs prêtes à toucher : pastille sur le portrait. */
  readonly claimable = computed(() => this.objectives().filter(isClaimable).length);

  /** Touche la récompense d'un objectif rempli. */
  claim(index: number): boolean {
    const objective = this.objectives()[index];
    if (objective === undefined || !isClaimable(objective)) {
      return false;
    }
    this.shards.add(objective.shards);
    this.saveClaims([...this.claimed(), index]);
    return true;
  }

  /** Promotion : les récompenses oubliées sont données au passage, puis le mineur change de forme. */
  evolve(): boolean {
    if (!this.ready()) {
      return false;
    }
    const forgotten = unclaimedShards(this.objectives());
    if (forgotten > 0) {
      this.shards.add(forgotten);
    }
    this.formIndex.update((index) => index + 1);
    writeStorage(STORAGE_KEY, String(this.formIndex()));
    this.saveClaims([]);
    return true;
  }

  private saveClaims(claims: readonly number[]): void {
    this.claimed.set(claims);
    writeStorage(CLAIMS_KEY, JSON.stringify(claims));
  }
}

function loadFormIndex(): number {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return 0;
  }
  const index = Number(raw);
  // Une sauvegarde au-delà du dernier rang (avant le 17/10/2026, il y en avait 11) garde le rang le plus haut
  if (Number.isSafeInteger(index) && index >= EVOLUTION_FORMS.length) {
    return EVOLUTION_FORMS.length - 1;
  }
  if (!Number.isSafeInteger(index) || index < 0) {
    console.warn(`Forme d'évolution invalide ignorée : "${raw}"`);
    return 0;
  }
  return index;
}

function loadClaims(): readonly number[] {
  const raw = readStorage(CLAIMS_KEY);
  if (raw === null) {
    return [];
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(value) && value.every((index) => Number.isSafeInteger(index) && index >= 0)) {
      return value as number[];
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Récompenses d\'évolution invalides ignorées');
  return [];
}
