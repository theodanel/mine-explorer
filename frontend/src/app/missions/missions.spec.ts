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

  it('récompense une mission du jour une seule fois', () => {
    const { missions, counters, shards } = setup();
    counters.record('rocksBroken');
    expect(missions.claimableCount()).toBe(1);
    missions.claimDaily(DAILY_MISSIONS[0].id);
    expect(shards.amount()).toBe(DAILY_MISSIONS[0].reward.shards);
    expect(missions.dailyDone()).toBe(1);
    missions.claimDaily(DAILY_MISSIONS[0].id);
    expect(shards.amount()).toBe(DAILY_MISSIONS[0].reward.shards);
  });

  it('refuse une récompense non méritée', () => {
    const { missions, shards } = setup();
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
