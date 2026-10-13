import { SPELLS } from '../balance/skill-tree';
import { activeBuffs, isReady } from './spell-rules';

describe('sorts actifs', () => {
  const equipped = [
    { spell: SPELLS.frenzy, rank: 1 },
    { spell: SPELLS.goldenVein, rank: 1 },
    { spell: SPELLS.geodeEcho, rank: 2 },
  ];

  it('n\'ont aucun effet tant qu\'ils ne sont pas lancés', () => {
    expect(activeBuffs(equipped, {}, 1000)).toEqual({ speed: 0, guaranteedCrit: false, goldMultiplier: 1, shardChance: 0 });
  });

  it('cumulent les effets en cours', () => {
    const timers = {
      frenzy: { readyAt: 5000, activeUntil: 2000 },
      goldenVein: { readyAt: 5000, activeUntil: 2000 },
      geodeEcho: { readyAt: 5000, activeUntil: 2000 },
    };
    const buffs = activeBuffs(equipped, timers, 1000);
    expect(buffs).toMatchObject({ speed: 1, guaranteedCrit: false, goldMultiplier: 3 });
    expect(buffs.shardChance).toBeCloseTo(0.15);
  });

  it('s\'arrêtent à la fin de leur durée', () => {
    const timers = { frenzy: { readyAt: 5000, activeUntil: 2000 } };
    expect(activeBuffs(equipped, timers, 2000).speed).toBe(0);
  });

  it('sont prêts une fois la recharge passée', () => {
    const timers = { dynamite: { readyAt: 3000, activeUntil: 0 } };
    expect(isReady(timers, 'dynamite', 2999)).toBe(false);
    expect(isReady(timers, 'dynamite', 3000)).toBe(true);
    expect(isReady({}, 'firedamp', 0)).toBe(true);
  });
});
