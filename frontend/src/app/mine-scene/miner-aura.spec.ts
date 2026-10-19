import { EVOLUTION_FORMS } from '../balance/balance';
import { auraLook } from './miner-aura';

describe('auraLook', () => {
  it("n'éveille pas d'aura avant la Légende du Cœur du monde", () => {
    for (const form of EVOLUTION_FORMS.filter((candidate) => candidate.id !== 'heart')) {
      expect(auraLook(form)).toBeNull();
    }
  });

  it("rend l'aura plus vive, plus grande et plus fumante à chaque étoile, jusqu'au plein à 5 étoiles", () => {
    const looks = EVOLUTION_FORMS.filter((form) => form.id === 'heart').map((form) => auraLook(form));
    expect(looks).toHaveLength(5);
    looks.slice(1).forEach((look, index) => {
      const previous = looks[index];
      expect(look?.strength).toBeGreaterThan(previous?.strength ?? 0);
      expect(look?.scale).toBeGreaterThan(previous?.scale ?? 0);
      expect(look?.wisps).toBeGreaterThan(previous?.wisps ?? 0);
    });
    expect(looks[4]?.strength).toBeCloseTo(1);
  });
});
