import { BASE_STATS } from '../balance/balance';
import { powerGain } from './power-gain';

describe('Gain de Puissance affiché sur le mineur', () => {
  it('ne montre rien quand la Puissance ne monte pas', () => {
    expect(powerGain(BASE_STATS, BASE_STATS)).toBeNull();
    expect(powerGain({ ...BASE_STATS, strikePower: BASE_STATS.strikePower + 5 }, BASE_STATS)).toBeNull();
  });

  it('donne la Puissance avant et après, et la stat qui a monté', () => {
    const gain = powerGain(BASE_STATS, { ...BASE_STATS, strikePower: BASE_STATS.strikePower + 3 });
    expect(gain).not.toBeNull();
    expect(gain!.to).toBeGreaterThan(gain!.from);
    expect(gain!.lines).toEqual([`Frappe ${BASE_STATS.strikePower} → ${BASE_STATS.strikePower + 3}`]);
  });

  it('cite au plus deux stats, la plus forte hausse d’abord', () => {
    const gain = powerGain(BASE_STATS, {
      ...BASE_STATS,
      strikePower: BASE_STATS.strikePower * 2,
      critChance: BASE_STATS.critChance + 0.05,
      critDamage: BASE_STATS.critDamage * 1.01,
    });
    expect(gain!.lines).toHaveLength(2);
    expect(gain!.lines[0].startsWith('Frappe') || gain!.lines[0].startsWith('Critique')).toBe(true);
  });
});
