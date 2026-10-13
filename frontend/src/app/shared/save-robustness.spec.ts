import { ProviderToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Artifacts } from '../artifacts/artifacts';
import { AUDIO_CONTEXT_FACTORY, Sound } from '../audio/sound';
import { Challenge } from '../challenge/challenge';
import { Companions } from '../companions/companions';
import { Inventory } from '../equipment/inventory';
import { Evolution } from '../evolution/evolution';
import { AutoForge } from '../forge/auto-forge';
import { Forge } from '../forge/forge';
import { Galleries } from '../galleries/galleries';
import { Miner } from '../miner/miner';
import { MissionCounters } from '../missions/mission-counters';
import { mainMission } from '../missions/mission-rules';
import { Missions } from '../missions/missions';
import { OfflineEarnings } from '../offline/offline-earnings';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { Skills } from '../skills/skills';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { Workshop } from '../workshop/workshop';
import { Camp } from '../camp/camp';

/** Toutes les clés de sauvegarde du jeu. Un joueur peut modifier n'importe laquelle dans son navigateur. */
const KEYS = [
  'artifacts',
  'auto-forge',
  'camp',
  'challenge',
  'coins',
  'companions',
  'counters',
  'equipment',
  'evolution',
  'evolution-claims',
  'gallery',
  'geode-shards',
  'last-seen',
  'missions',
  'music-volume',
  'ores',
  'pickaxe',
  'progress',
  'skills',
  'tutorial',
  'volume',
  'workshop',
].map((key) => `mine-explorer.${key}`);

/** Valeurs abîmées ou trafiquées : du texte, du JSON du mauvais type, des nombres hors limites, une tentative de pollution. */
const GARBAGE = [
  '',
  'pas du JSON',
  '{',
  'null',
  'true',
  '[]',
  '{}',
  '"texte"',
  '-1',
  '1e309',
  'NaN',
  '9007199254740993',
  '{"__proto__":{"pollue":true}}',
  '{"zone":1e12,"stage":1,"damage":0}',
  '{"level":-5,"segments":99,"upgradeEndsAt":"bientôt"}',
  '{"owned":{"canary":{"stars":99}},"active":"canary","eggs":["mythique"],"incubating":null,"sinceLegendary":0,"gifted":true,"expeditions":{},"stones":-3}',
  '{"levels":{"tavern":999,"forge":2},"wellCollectedAt":-5}',
  '{"equipped":{"pickaxe":{"id":1,"slot":"pickaxe","tier":"plutonium","level":1,"stats":{}}},"pending":null}',
];

/** Services qui lisent une sauvegarde au démarrage. */
const SERVICES: readonly ProviderToken<unknown>[] = [
  Wallet,
  GeodeShards,
  Ores,
  Progression,
  Forge,
  MissionCounters,
  Missions,
  Inventory,
  Evolution,
  Skills,
  Artifacts,
  Workshop,
  Camp,
  Galleries,
  Companions,
  Challenge,
  AutoForge,
  Sound,
  OfflineEarnings,
  Miner,
];

describe('Sauvegarde abîmée ou trafiquée', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function startWith(value: string): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: AUDIO_CONTEXT_FACTORY, useValue: () => null }] });
    localStorage.clear();
    for (const key of KEYS) {
      localStorage.setItem(key, value);
    }
    for (const service of SERVICES) {
      TestBed.inject(service);
    }
  }

  it.each(GARBAGE)('démarre une partie jouable avec %j dans toutes les clés', (value) => {
    expect(() => startWith(value)).not.toThrow();
    const miner = TestBed.inject(Miner).permanent().stats;
    for (const stat of Object.values(miner)) {
      expect(Number.isFinite(stat)).toBe(true);
    }
    const wallet = TestBed.inject(Wallet).coins();
    expect(Number.isSafeInteger(wallet) && wallet >= 0).toBe(true);
    const zone = TestBed.inject(Progression).zone();
    expect(Number.isSafeInteger(zone) && zone >= 1).toBe(true);
    expect(Number.isFinite(TestBed.inject(Progression).remainingHp())).toBe(true);
    expect(({} as Record<string, unknown>)['pollue']).toBeUndefined();
  });

  it('plafonne l\'or au plus grand entier exact, sans perdre la sauvegarde', () => {
    startWith('{}');
    localStorage.setItem('mine-explorer.coins', String(Number.MAX_SAFE_INTEGER - 1));
    TestBed.resetTestingModule();
    const wallet = TestBed.inject(Wallet);
    wallet.add(10);
    expect(wallet.coins()).toBe(Number.MAX_SAFE_INTEGER);
    TestBed.resetTestingModule();
    expect(TestBed.inject(Wallet).coins()).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('garde les missions d\'une sauvegarde écrite avant l\'ajout d\'un compteur', () => {
    localStorage.clear();
    const oldCounters = { rocksBroken: 5, itemsForged: 20, itemsSold: 10, segmentsPaid: 3 };
    const today = new Date();
    const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    localStorage.setItem('mine-explorer.counters', JSON.stringify(oldCounters));
    localStorage.setItem(
      'mine-explorer.missions',
      JSON.stringify({ mainIndex: 7, mainBaseline: oldCounters, day, dayBaseline: oldCounters, dailyClaimed: [], chestClaimed: false }),
    );
    TestBed.resetTestingModule();
    expect(TestBed.inject(MissionCounters).counters().eventsTouched).toBe(0);
    expect(TestBed.inject(Missions).main().mission.id).toBe(mainMission(7).id);
  });
});
