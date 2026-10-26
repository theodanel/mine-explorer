import { ASTRE_COLORS, ASTRE_ELEMENT_BONUS, ASTRE_STAGE_TOTALS } from '../balance/astre';
import { astreBonuses, astreColor, EMPTY_ASTRE, feedAstre, nextStageProgress, stageOf } from './astre-rules';

describe("Bonus et couleur de l'Astre", () => {
  it('ne donne rien tant qu’il dort, puis renforce le domaine de sa nourriture', () => {
    expect(astreBonuses(EMPTY_ASTRE).strikePct).toBe(0);
    const ember = feedAstre(EMPTY_ASTRE, 'ember', ASTRE_STAGE_TOTALS[4]);
    expect(stageOf(ember)).toBe(5);
    expect(astreBonuses(ember).strikePct).toBeCloseTo(ASTRE_ELEMENT_BONUS.ember.full);
    expect(astreBonuses(ember).goldPct).toBe(0);
  });

  it('partage ses bonus selon la part de chaque ressource', () => {
    const mixed = feedAstre(feedAstre(EMPTY_ASTRE, 'ember', 650), 'dawn', 650);
    expect(astreBonuses(mixed).strikePct).toBeCloseTo(ASTRE_ELEMENT_BONUS.ember.full / 2);
    expect(astreBonuses(mixed).goldPct).toBeCloseTo(ASTRE_ELEMENT_BONUS.dawn.full / 2);
  });

  it('prend la couleur de sa nourriture', () => {
    expect(astreColor(feedAstre(EMPTY_ASTRE, 'frost', 5))).toBe(ASTRE_COLORS.frost);
  });

  it('reste vive quand on lui donne de tout : seules ses deux ressources principales la colorent', () => {
    let fed = EMPTY_ASTRE;
    for (const [essence, amount] of [['ember', 30], ['dawn', 10], ['frost', 9], ['mist', 9], ['sap', 9]] as const) {
      fed = feedAstre(fed, essence, amount);
    }
    const twoOnly = feedAstre(feedAstre(EMPTY_ASTRE, 'ember', 30), 'dawn', 10);
    expect(astreColor(fed)).toBe(astreColor(twoOnly));
  });

  it('montre où il en est vers le stade suivant', () => {
    expect(nextStageProgress(feedAstre(EMPTY_ASTRE, 'sap', ASTRE_STAGE_TOTALS[0] + 5))).toEqual({
      given: 5,
      needed: ASTRE_STAGE_TOTALS[1] - ASTRE_STAGE_TOTALS[0],
    });
    expect(nextStageProgress(feedAstre(EMPTY_ASTRE, 'sap', ASTRE_STAGE_TOTALS[4]))).toBeNull();
  });
});
