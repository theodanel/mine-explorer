import { compactNumber } from './format-number';

describe('compactNumber', () => {
  it('raccourcit les grands montants', () => {
    // Le format français sépare le nombre de son unité par une espace insécable
    expect(compactNumber(4_303_846).replace(/\s/g, ' ')).toBe('4,3 M');
    expect(compactNumber(950)).toBe('950');
  });
});
