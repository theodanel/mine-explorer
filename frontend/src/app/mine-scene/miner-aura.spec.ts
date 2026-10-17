import { EVOLUTION_FORMS } from '../balance/balance';
import { auraLook } from './miner-aura';

describe('auraLook', () => {
  it("n'allume pas de halo avant la Légende du Cœur du monde", () => {
    for (const form of EVOLUTION_FORMS.filter((candidate) => candidate.id !== 'heart')) {
      expect(auraLook(form)).toBeNull();
    }
  });

  it("rend le halo plus vif à chaque étoile, jusqu'au plein à 5 étoiles", () => {
    const strengths = EVOLUTION_FORMS.filter((form) => form.id === 'heart').map(
      (form) => auraLook(form)?.strength ?? 0,
    );
    expect(strengths).toHaveLength(5);
    strengths
      .slice(1)
      .forEach((strength, index) => expect(strength).toBeGreaterThan(strengths[index]));
    expect(strengths[4]).toBeCloseTo(1);
  });
});
