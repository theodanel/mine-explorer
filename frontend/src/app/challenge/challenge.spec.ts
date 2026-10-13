import { TestBed } from '@angular/core/testing';

import { CHALLENGE_MILESTONES } from '../balance/challenge';
import { Companions } from '../companions/companions';
import { MissionCounters } from '../missions/mission-counters';
import { CLOCK } from '../shared/clock';
import { RANDOM } from '../shared/random';
import { Challenge } from './challenge';
import { challengeEndsAt } from './challenge-rules';

describe('Challenge', () => {
  let now = 0;

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup(): { challenge: Challenge; counters: MissionCounters; companions: Companions } {
    localStorage.clear();
    now = new Date(2026, 9, 13, 12).getTime();
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 3, stage: 1, damage: 0 }));
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: () => now },
        { provide: RANDOM, useValue: () => 0 },
      ],
    });
    const companions = TestBed.inject(Companions);
    TestBed.tick();
    return { challenge: TestBed.inject(Challenge), counters: TestBed.inject(MissionCounters), companions };
  }

  const eggCount = (companions: Companions): number => companions.eggs().length + (companions.incubating() ? 1 : 0);

  it('donne un œuf au premier palier, une seule fois', () => {
    const { challenge, counters, companions } = setup();
    const before = eggCount(companions);
    counters.record('itemsForged', CHALLENGE_MILESTONES[0].points);
    expect(challenge.claimable()).toEqual([0]);
    expect(challenge.claim(0)?.kind).toBe('egg');
    expect(eggCount(companions)).toBe(before + 1);
    expect(challenge.claim(0)).toBeNull();
  });

  it('donne les paliers oubliés au défi suivant, puis repart de zéro', () => {
    const { challenge, counters, companions } = setup();
    counters.record('itemsForged', CHALLENGE_MILESTONES[1].points);
    const eggsBefore = eggCount(companions);
    now = challengeEndsAt(now);
    vi.advanceTimersByTime(1000);
    expect(eggCount(companions)).toBe(eggsBefore + 1);
    expect(companions.stones()).toBeGreaterThan(0);
    expect(challenge.points()).toBe(0);
    expect(challenge.claimed()).toEqual([]);
  });
});
