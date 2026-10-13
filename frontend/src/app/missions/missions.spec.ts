import { TestBed } from '@angular/core/testing';

import { CLOCK } from '../shared/clock';
import { GeodeShards } from '../wallet/geode-shards';
import { MissionCounters } from './mission-counters';
import { DAILY_CHEST_REWARD, DAILY_MISSIONS } from './mission-rules';
import { Missions } from './missions';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('Missions', () => {
  let now: number;

  function setup(): { missions: Missions; counters: MissionCounters; shards: GeodeShards } {
    localStorage.clear();
    now = new Date(2026, 9, 11, 12).getTime();
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => now }] });
    return {
      missions: TestBed.inject(Missions),
      counters: TestBed.inject(MissionCounters),
      shards: TestBed.inject(GeodeShards),
    };
  }

  it('récompense la mission principale et passe à la suivante', () => {
    const { missions, counters, shards } = setup();
    expect(missions.main().complete).toBe(false);
    counters.record('rocksBroken');
    // La mission principale et la mission du jour « Épuise un filon »
    expect(missions.claimableCount()).toBe(2);

    missions.claimMain();
    expect(shards.amount()).toBe(4);
    expect(missions.main().mission.id).toBe('main-1');
    expect(missions.main().progress).toBe(0);
  });

  it('refuse une récompense non méritée', () => {
    const { missions, shards } = setup();
    missions.claimMain();
    missions.claimDaily(DAILY_MISSIONS[0].id);
    expect(shards.amount()).toBe(0);
  });

  it('donne le coffre quand toutes les missions du jour sont récupérées', () => {
    const { missions, counters, shards } = setup();
    for (const { mission } of missions.daily()) {
      if (mission.metric.kind === 'counter') {
        counters.record(mission.metric.id, mission.target);
      }
      missions.claimDaily(mission.id);
    }
    expect(missions.chestReady()).toBe(true);
    const before = shards.amount();
    missions.claimChest();
    expect(shards.amount()).toBe(before + DAILY_CHEST_REWARD.shards);
    expect(missions.chestReady()).toBe(false);
  });

  it('remet les missions du jour à zéro le lendemain', () => {
    const { missions, counters } = setup();
    counters.record('rocksBroken', 50);
    missions.claimDaily('daily-rocks');
    now += DAY_MS;
    missions.rolloverDay();
    const rocks = missions.daily().find((view) => view.mission.id === 'daily-rocks');
    expect(rocks?.claimed).toBe(false);
    expect(rocks?.progress).toBe(0);
  });
});
