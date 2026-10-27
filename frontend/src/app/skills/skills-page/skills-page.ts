import { Component, computed, inject, signal } from '@angular/core';

import {
  BRANCH_IDS,
  BranchId,
  BRANCHES,
  blastStrikeMultiplier,
  nodeMaxRank,
  nodeRankCost,
  PassiveNode,
  RARITY_LABELS,
  ROW_THRESHOLDS,
  shardEchoChance,
  SKILL_NODES,
  SkillNode,
  SPELL_SLOTS,
  spellCooldownMs,
  spellDurationMs,
  SpellDef,
  SPELLS,
} from '../../balance/skill-tree';
import { skillIconUrl } from '../../loading/game-assets';
import { describeBonus } from '../../miner/bonus-format';
import { Navigation } from '../../navigation/navigation';
import { Spells } from '../../spells/spells';
import { Wallet } from '../../wallet/wallet';
import { pointsSpent, rowOpen } from '../skill-rules';
import { Skills } from '../skills';

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const ROW_COUNT = ROW_THRESHOLDS.length;

/** Page de l'arbre : un onglet par branche, ses 4 rangées en arbre vertical, et le détail du nœud choisi en bas. */
@Component({
  selector: 'app-skills-page',
  templateUrl: './skills-page.html',
  styleUrl: './skills-page.scss',
})
export class SkillsPage {
  protected readonly skills = inject(Skills);
  protected readonly wallet = inject(Wallet);
  private readonly spells = inject(Spells);
  private readonly navigation = inject(Navigation);
  private readonly selectedId = signal<string>(SKILL_NODES[0].id);
  protected readonly branchId = signal<BranchId>('force');
  protected readonly confirmRespec = signal(false);
  protected readonly slotIndexes = Array.from({ length: SPELL_SLOTS }, (_, index) => index);

  protected readonly tabs = computed(() => {
    const ranks = this.skills.ranks();
    return BRANCH_IDS.map((branch) => ({ id: branch, label: BRANCHES[branch].label, spent: pointsSpent(ranks, branch) }));
  });

  protected readonly branch = computed(() => {
    const ranks = this.skills.ranks();
    const branch = this.branchId();
    return {
      id: branch,
      ...BRANCHES[branch],
      rows: Array.from({ length: ROW_COUNT }, (_, row) => row)
        .filter((row) => SKILL_NODES.some((node) => node.branch === branch && node.row === row))
        .map((row) => ({
        row,
        open: rowOpen(ranks, branch, row),
        threshold: ROW_THRESHOLDS[row],
        missing: Math.max(ROW_THRESHOLDS[row] - pointsSpent(ranks, branch), 0),
        nodes: SKILL_NODES.filter((node) => node.branch === branch && node.row === row).map((node) => this.nodeView(node)),
      })),
    };
  });

  protected readonly selected = computed(() => {
    const node = SKILL_NODES.find((candidate) => candidate.id === this.selectedId()) ?? SKILL_NODES[0];
    const rank = this.skills.rank(node);
    const max = nodeMaxRank(node);
    const check = this.skills.check(node);
    return {
      node,
      ...this.nodeView(node),
      kindLabel: node.kind === 'spell' ? `Sort ${RARITY_LABELS[SPELLS[node.spell].rarity].toLowerCase()}` : 'Passif',
      summary: node.kind === 'spell' ? SPELLS[node.spell].summary : `${node.summary} : ${describeBonus(node.bonus, node.perRank)} par rang.`,
      current: rank > 0 ? this.effectAt(node, rank) : null,
      next: rank < max ? this.effectAt(node, rank + 1) : null,
      cost: rank < max ? nodeRankCost(node, rank) : null,
      check,
      blocker: blockerText(check, node),
      spell: node.kind === 'spell' && rank > 0 ? node.spell : null,
    };
  });

  protected readonly equippedSlots = computed(() => this.skills.equipped());

  protected selectId(id: string): void {
    this.selectedId.set(id);
  }

  /** Changer de branche montre aussi son premier nœud, pour que le détail suive. */
  protected selectBranch(branch: BranchId): void {
    this.branchId.set(branch);
    const first = SKILL_NODES.find((node) => node.branch === branch);
    if (first) {
      this.selectedId.set(first.id);
    }
  }

  protected close(): void {
    this.navigation.open('mine');
  }

  protected respec(): void {
    if (this.skills.respec()) {
      this.confirmRespec.set(false);
    }
  }

  private nodeView(node: SkillNode) {
    const rank = this.skills.rank(node);
    const spell = node.kind === 'spell' ? SPELLS[node.spell] : null;
    const label = spell?.label ?? (node as PassiveNode).label;
    return {
      id: node.id,
      label,
      icon: skillIconUrl(node.id),
      rarity: spell?.rarity ?? null,
      branch: node.branch,
      rank,
      max: nodeMaxRank(node),
      learnable: this.skills.check(node) === 'ok',
      selected: node.id === this.selectedId(),
      equipped: spell !== null && this.skills.equipped().includes(spell.id),
    };
  }

  /** Effet d'un nœud à un rang donné, en tenant compte des bonus de recharge et de durée actuels. */
  private effectAt(node: SkillNode, rank: number): string {
    if (node.kind === 'passive') {
      return describeBonus(node.bonus, node.perRank * rank);
    }
    return spellEffect(SPELLS[node.spell], rank, this.spells.modifiers());
  }
}

function spellEffect(spell: SpellDef, rank: number, modifiers: { cooldownPct: number; durationPct: number; blastPct: number }): string {
  const cooldown = `recharge ${NUMBER.format(spellCooldownMs(spell, modifiers.cooldownPct) / 1000)} s`;
  const duration = `${NUMBER.format(spellDurationMs(spell, rank, modifiers.durationPct) / 1000)} s`;
  const effect = spell.effect;
  switch (effect.kind) {
    case 'blast':
      return `Coup à ×${NUMBER.format(blastStrikeMultiplier(spell, rank, modifiers.blastPct))} la Frappe, ${cooldown}`;
    case 'speed':
      return `+${NUMBER.format(effect.amount * 100)} % de Vitesse pendant ${duration}, ${cooldown}`;
    case 'crit':
      return `Coups critiques garantis pendant ${duration}, ${cooldown}`;
    case 'gold':
      return `Or ×${NUMBER.format(effect.multiplier)} pendant ${duration}, ${cooldown}`;
    case 'shard':
      return `${NUMBER.format(shardEchoChance(spell, rank) * 100)} % de chances d'éclat par coup pendant ${duration}, ${cooldown}`;
  }
}

function blockerText(check: string, node: SkillNode): string | null {
  if (check === 'locked') {
    return `Dépense ${ROW_THRESHOLDS[node.row]} points dans la branche ${BRANCHES[node.branch].label} pour ouvrir cette rangée.`;
  }
  if (check === 'noPoints') {
    return 'Pas assez de points : termine une zone pour en gagner 3.';
  }
  return null;
}
