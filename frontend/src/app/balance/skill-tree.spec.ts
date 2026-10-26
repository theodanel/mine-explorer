import { BLAST_CRIT_SHARE, blastCritFactor } from './skill-tree';

describe('Explosions', () => {
  it('profitent d’une part du bonus de critique du mineur', () => {
    expect(blastCritFactor(0, 5)).toBe(1);
    expect(blastCritFactor(0.5, 2)).toBeCloseTo(1 + BLAST_CRIT_SHARE);
  });
});
