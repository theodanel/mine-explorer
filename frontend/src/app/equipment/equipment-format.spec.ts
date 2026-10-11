import { formatStat, formatStatDelta } from './equipment-format';

describe('format des stats', () => {
  it('affiche les pièces en entier', () => {
    expect(formatStat('strikePower', 3)).toBe('3');
  });

  it('affiche les pourcentages à la française', () => {
    expect(formatStat('critChance', 0.055)).toBe('5,5 %');
  });

  it('signe les écarts', () => {
    expect(formatStatDelta('strikePower', 2)).toBe('+2');
    expect(formatStatDelta('miningSpeed', -0.03)).toBe('−3 %');
  });
});
