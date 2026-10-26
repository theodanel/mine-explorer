import { compactNumber } from './format-number';

describe('compactNumber', () => {
  it('raccourcit les grands montants', () => {
    // Le format français sépare le nombre de son unité par une espace insécable
    expect(compactNumber(4_303_846).replace(/\s/g, ' ')).toBe('4,3 M');
    expect(compactNumber(950)).toBe('950');
    // Les chiffres de fin de jeu restent courts : notation scientifique au-delà de 1 000 Bn
    expect(compactNumber(3.24e16)).toBe('3,24E16');
  });
});
