// Règles pures de l'arbre de compétences : points, conditions d'apprentissage et bonus des passifs.
import {
  BONUS_IDS,
  BonusId,
  BranchId,
  Bonuses,
  NO_BONUSES,
  nodeMaxRank,
  nodeRankCost,
  ROW_THRESHOLDS,
  SKILL_NODES,
  SKILL_POINTS_PER_ZONE,
  SkillNode,
  SpellId,
} from '../balance/skill-tree';

/** Rang de chaque nœud appris, par identifiant. Un nœud absent est au rang 0. */
export type SkillRanks = Readonly<Partial<Record<string, number>>>;

export type LearnCheck = 'ok' | 'maxed' | 'locked' | 'noPoints';

/** Points gagnés depuis le début : 3 par zone terminée. */
export function pointsEarned(zone: number): number {
  return Math.max(zone - 1, 0) * SKILL_POINTS_PER_ZONE;
}

export function rankOf(ranks: SkillRanks, node: SkillNode): number {
  return ranks[node.id] ?? 0;
}

/** Points investis dans un nœud jusqu'à son rang actuel. */
export function nodeSpent(node: SkillNode, rank: number): number {
  let total = 0;
  for (let current = 0; current < rank; current++) {
    total += nodeRankCost(node, current);
  }
  return total;
}

export function pointsSpent(ranks: SkillRanks, branch?: BranchId): number {
  return SKILL_NODES.filter((node) => branch === undefined || node.branch === branch).reduce(
    (sum, node) => sum + nodeSpent(node, rankOf(ranks, node)),
    0,
  );
}

export function rowOpen(ranks: SkillRanks, branch: BranchId, row: number): boolean {
  return pointsSpent(ranks, branch) >= ROW_THRESHOLDS[row];
}

export function learnCheck(node: SkillNode, ranks: SkillRanks, available: number): LearnCheck {
  const rank = rankOf(ranks, node);
  if (rank >= nodeMaxRank(node)) {
    return 'maxed';
  }
  if (!rowOpen(ranks, node.branch, node.row)) {
    return 'locked';
  }
  return available >= nodeRankCost(node, rank) ? 'ok' : 'noPoints';
}

export function learn(ranks: SkillRanks, node: SkillNode): SkillRanks {
  return { ...ranks, [node.id]: rankOf(ranks, node) + 1 };
}

/** Somme des bonus des passifs appris : une même famille, donc tout s'additionne. */
export function passiveBonuses(ranks: SkillRanks): Bonuses {
  const totals: Record<BonusId, number> = { ...NO_BONUSES };
  for (const node of SKILL_NODES) {
    if (node.kind === 'passive') {
      totals[node.bonus] += node.perRank * rankOf(ranks, node);
    }
  }
  return totals;
}

export function spellRank(ranks: SkillRanks, spell: SpellId): number {
  const node = SKILL_NODES.find((candidate) => candidate.kind === 'spell' && candidate.spell === spell);
  return node ? rankOf(ranks, node) : 0;
}

export function isValidRanks(value: unknown): value is SkillRanks {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return Object.entries(value).every(([id, rank]) => {
    const node = SKILL_NODES.find((candidate) => candidate.id === id);
    return node !== undefined && Number.isSafeInteger(rank) && (rank as number) >= 0 && (rank as number) <= nodeMaxRank(node);
  });
}

export function isBonusId(value: string): value is BonusId {
  return (BONUS_IDS as readonly string[]).includes(value);
}
