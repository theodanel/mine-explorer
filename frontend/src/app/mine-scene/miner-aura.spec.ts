import { EVOLUTION_FORMS } from '../balance/balance';
import { auraLook } from './miner-aura';

describe('auraLook', () => {
  it("n'allume pas de halo avant les étoiles de Légende", () => {
    for (const form of EVOLUTION_FORMS.filter(
      (candidate) => candidate.stars === 0 && candidate.id !== 'heart',
    )) {
      expect(auraLook(form)).toBeNull();
    }
  });

  it('rend le halo plus vif à chaque étoile, sans dépasser le plein', () => {
    const strengths = EVOLUTION_FORMS.filter((form) => form.stars > 0).map(
      (form) => auraLook(form)?.strength ?? 0,
    );
    expect(strengths).toHaveLength(5);
    strengths
      .slice(1)
      .forEach((strength, index) => expect(strength).toBeGreaterThan(strengths[index]));
    expect(Math.max(...strengths)).toBeLessThanOrEqual(1);
  });

  it('donne à la forme finale un halo plein, couleur de lave', () => {
    const heart = EVOLUTION_FORMS.find((form) => form.id === 'heart');
    expect(heart && auraLook(heart)).toEqual({ strength: 1, color: '#ff9a3c' });
  });
});
