import { computed, inject, Injectable, signal } from '@angular/core';

import { Abyss } from '../abyss/abyss';
import { sealsLearned } from '../balance/skill-tree';
import { lifeFamily } from '../balance/rebirth';
import { Camp } from '../camp/camp';
import { Companions } from '../companions/companions';
import { Awakening } from '../equipment/awakening';
import { SLOT_IDS } from '../equipment/equipment.model';
import { Inventory } from '../equipment/inventory';
import { Evolution } from '../evolution/evolution';
import { Forge } from '../forge/forge';
import { HeartForge } from '../heart-forge/heart-forge';
import { MissionCounters } from '../missions/mission-counters';
import { Progression } from '../progression/progression';
import { Rebirth } from '../rebirth/rebirth';
import { readStorage, writeStorage } from '../shared/local-storage';
import { pointsSpent } from '../skills/skill-rules';
import { Skills } from '../skills/skills';
import { GeodeShards } from '../wallet/geode-shards';
import { chapterAt, chapterDone, chaptersAlreadyDone, FIRST_LOOP, JournalChapter, JournalFacts, objectiveDone } from './journal-chapters';

const STORAGE_KEY = 'mine-explorer.carnet';

interface JournalState {
  /** Chapitres de la 1re boucle terminés et scellés. */
  readonly sealed: number;
  /** Renaissances dont la page de vie est scellée (-1 : aucune). */
  readonly lifeSealed: number;
}

/**
 * Le Carnet d'aventure : chapitre en cours, objectifs cochés au fil du jeu, et sceau posé quand le joueur le termine.
 * Ce service lit l'état des autres systèmes et ne leur sert pas : aucun ne dépend de lui.
 */
@Injectable({ providedIn: 'root' })
export class Journal {
  private readonly progression = inject(Progression);
  private readonly counters = inject(MissionCounters);
  private readonly forge = inject(Forge);
  private readonly inventory = inject(Inventory);
  private readonly evolution = inject(Evolution);
  private readonly skills = inject(Skills);
  private readonly companions = inject(Companions);
  private readonly camp = inject(Camp);
  private readonly abyss = inject(Abyss);
  private readonly heartForge = inject(HeartForge);
  private readonly awakening = inject(Awakening);
  private readonly rebirth = inject(Rebirth);
  private readonly shards = inject(GeodeShards);

  readonly facts = computed<JournalFacts>(() => {
    const equipped = this.inventory.equipped();
    const family = lifeFamily(this.rebirth.count());
    const ranks = this.skills.ranks();
    const counters = this.counters.counters();
    return {
      rocksBroken: counters.rocksBroken,
      itemsForged: counters.itemsForged,
      pickaxeLevel: this.forge.level(),
      piecesWorn: SLOT_IDS.filter((slot) => equipped[slot] !== undefined).length,
      divineOfFamily: SLOT_IDS.filter((slot) => equipped[slot]?.tier === 'divine' && (equipped[slot]?.family ?? 0) === family).length,
      zone: this.progression.zone(),
      formIndex: this.evolution.index(),
      skillPointsSpent: pointsSpent(ranks),
      companionActive: this.companions.active() !== null,
      workshopUpgrades: counters.workshopUpgrades,
      campLevels: Object.values(this.camp.levels()).reduce((sum, level) => sum + (level ?? 0), 0),
      abyssRecord: this.abyss.record(),
      astreStage: this.heartForge.astreStage(),
      seals: sealsLearned(ranks),
      phase: this.awakening.phase(),
      rebirths: this.rebirth.count(),
    };
  });

  private readonly state = signal<JournalState>(this.loadState());

  /** Numéro du chapitre en cours (0 pour le premier), pages de vie comprises. */
  readonly index = computed(() => {
    const { sealed } = this.state();
    return sealed < FIRST_LOOP.length ? sealed : FIRST_LOOP.length + this.rebirth.count() - 1;
  });

  /** Chapitre en cours, ou null quand la page de cette vie est déjà scellée (il faut renaître). */
  readonly chapter = computed<JournalChapter | null>(() => {
    const { sealed, lifeSealed } = this.state();
    if (sealed >= FIRST_LOOP.length && lifeSealed >= this.rebirth.count()) {
      return null;
    }
    return chapterAt(sealed, this.rebirth.count());
  });

  readonly objectives = computed(() => {
    const chapter = this.chapter();
    const facts = this.facts();
    return (chapter?.objectives ?? []).map((objective) => {
      const [current, target] = objective.progress(facts);
      return { label: objective.label, current, target, done: objectiveDone(objective, facts) };
    });
  });

  /** Le chapitre en cours est rempli : il attend son sceau. */
  readonly ready = computed(() => {
    const chapter = this.chapter();
    return chapter !== null && chapterDone(chapter, this.facts());
  });

  /** Carnet ouvert par le joueur (icône), en plus de l'ouverture automatique quand un chapitre est rempli. */
  readonly openedByPlayer = signal(false);
  /** Chapitre dont l'ouverture automatique a déjà eu lieu : le carnet ne s'ouvre seul qu'une fois par chapitre. */
  private readonly autoShownFor = signal<number | null>(null);
  /** Le carnet voudrait s'ouvrir de lui-même : un chapitre vient d'être rempli. */
  readonly wantsToOpen = computed(() => this.ready() && this.autoShownFor() !== this.index());

  /** Le carnet s'est ouvert seul pour ce chapitre : il ne recommencera pas. */
  markAutoShown(): void {
    this.autoShownFor.set(this.index());
  }

  /** Chapitres déjà lus, pour relire le journal d'Orvald. */
  readonly readChapters = computed(() => FIRST_LOOP.slice(0, this.state().sealed));

  /** Pose le sceau : la récompense tombe et le chapitre suivant s'ouvre. */
  seal(): boolean {
    const chapter = this.chapter();
    if (chapter === null || !chapterDone(chapter, this.facts())) {
      return false;
    }
    this.shards.add(chapter.shards);
    const { sealed } = this.state();
    this.save(sealed < FIRST_LOOP.length ? { ...this.state(), sealed: sealed + 1 } : { ...this.state(), lifeSealed: this.rebirth.count() });
    return true;
  }

  private loadState(): JournalState {
    const raw = readStorage(STORAGE_KEY);
    if (raw !== null) {
      try {
        const value = JSON.parse(raw) as Partial<JournalState>;
        if (Number.isSafeInteger(value.sealed) && Number.isSafeInteger(value.lifeSealed)) {
          return { sealed: value.sealed as number, lifeSealed: value.lifeSealed as number };
        }
      } catch {
        // Sauvegarde illisible : on refait le point sur la partie, comme à la découverte du carnet
        console.warn('Carnet d’aventure illisible : chapitres recalculés depuis la partie');
      }
    }
    // Partie déjà avancée qui découvre le carnet : les chapitres remplis se cochent d'office, sans récompense
    const state = { sealed: chaptersAlreadyDone(this.facts()), lifeSealed: -1 };
    writeStorage(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  private save(next: JournalState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}
