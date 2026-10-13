import { SKILL_NODES, SKILL_POINTS_PER_ZONE, SkillNode } from '../balance/skill-tree';
import { learn, learnCheck, passiveBonuses, pointsEarned, pointsSpent, rowOpen, SkillRanks, spellRank } from './skill-rules';

function node(id: string): SkillNode {
  const found = SKILL_NODES.find((candidate) => candidate.id === id);
  if (!found) {
    throw new Error(`Nœud inconnu : ${id}`);
  }
  return found;
}

function learnTimes(ranks: SkillRanks, id: string, times: number): SkillRanks {
  let next = ranks;
  for (let i = 0; i < times; i++) {
    next = learn(next, node(id));
  }
  return next;
}

describe('points de compétence', () => {
  it('donnent 3 points par zone terminée', () => {
    expect(pointsEarned(1)).toBe(0);
    expect(pointsEarned(4)).toBe(3 * SKILL_POINTS_PER_ZONE);
  });

  it('coûtent 2 points pour apprendre un sort, puis 1 par rang', () => {
    expect(pointsSpent(learnTimes({}, 'dynamite', 1))).toBe(2);
    expect(pointsSpent(learnTimes({}, 'dynamite', 3))).toBe(4);
  });

  it('coûtent 1 point par rang de passif', () => {
    expect(pointsSpent(learnTimes({}, 'firmGrip', 4))).toBe(4);
  });

  it('demandent plus de points que ce qu\'un joueur gagne en 90 jours : il faut choisir', () => {
    const all = SKILL_NODES.reduce((ranks, candidate) => learnTimes(ranks, candidate.id, candidate.kind === 'spell' ? 3 : candidate.maxRank), {} as SkillRanks);
    expect(pointsSpent(all)).toBe(67);
  });
});

describe('arbre', () => {
  it('ouvre une rangée après assez de points dépensés dans la branche', () => {
    expect(rowOpen({}, 'force', 1)).toBe(false);
    expect(learnCheck(node('sharpEye'), {}, 10)).toBe('locked');
    const ranks = learnTimes({}, 'firmGrip', 3);
    expect(rowOpen(ranks, 'force', 1)).toBe(true);
    expect(learnCheck(node('sharpEye'), ranks, 10)).toBe('ok');
  });

  it('ne compte pas les points des autres branches', () => {
    const ranks = learnTimes({}, 'goldNose', 5);
    expect(rowOpen(ranks, 'force', 1)).toBe(false);
  });

  it('refuse sans assez de points, ou au rang maximum', () => {
    expect(learnCheck(node('dynamite'), {}, 1)).toBe('noPoints');
    expect(learnCheck(node('firmGrip'), learnTimes({}, 'firmGrip', 5), 10)).toBe('maxed');
  });

  it('additionne les bonus des passifs', () => {
    const ranks = learnTimes(learnTimes({}, 'firmGrip', 3), 'goldNose', 2);
    const bonuses = passiveBonuses(ranks);
    expect(bonuses.strikePct).toBeCloseTo(0.09);
    expect(bonuses.goldPct).toBeCloseTo(0.1);
    expect(bonuses.critChance).toBe(0);
  });

  it('donne le rang d\'un sort appris', () => {
    expect(spellRank(learnTimes({}, 'frenzy', 2), 'frenzy')).toBe(2);
    expect(spellRank({}, 'firedamp')).toBe(0);
  });
});
