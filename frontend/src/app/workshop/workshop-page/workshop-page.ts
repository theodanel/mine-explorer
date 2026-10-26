import { Component, computed, inject, signal } from '@angular/core';

import { ArtifactReforge } from '../../artifacts/artifact-reforge/artifact-reforge';
import { Artifacts } from '../../artifacts/artifacts';
import { ARTIFACT_IDS, ARTIFACT_MAX_LEVEL } from '../../balance/artifacts';
import { Sound } from '../../audio/sound';
import { tierZone, WORKSHOP_MAX_LEVEL, WORKSHOP_STEP, workshopMaterial } from '../../balance/workshop';
import { formatStat } from '../../equipment/equipment-format';
import { SLOT_AFFINITIES, SLOT_IDS, SLOTS, STATS, SlotId, StatId, TIER_LABELS, TierId } from '../../equipment/equipment.model';
import { Inventory } from '../../equipment/inventory';
import { reforgeableAffixes } from '../../equipment/reforge-rules';
import { itemIconUrl, materialIconUrl } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Ores } from '../../ores/ores';
import { Progression } from '../../progression/progression';
import { Wallet } from '../../wallet/wallet';
import { UpgradeCheck, Workshop } from '../workshop';
import { Echoes } from '../../heart-forge/echoes';
import { compactNumber } from '../../shared/format-number';

const PERCENT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

const BLOCKED_TEXT: Readonly<Record<Exclude<UpgradeCheck, 'ok'>, string>> = {
  locked: 'Atelier fermé',
  empty: 'Aucune pièce portée',
  max: 'Niveau maximum',
  gold: 'Pas assez d\'or',
  ores: 'Pas assez de minerai',
};

/** Atelier : la pièce portée de chaque emplacement se renforce dans sa qualité, niveau par niveau jusqu'à 50. */
@Component({
  selector: 'app-workshop-page',
  imports: [ArtifactReforge],
  templateUrl: './workshop-page.html',
  styleUrl: './workshop-page.scss',
})
export class WorkshopPage {
  protected readonly workshop = inject(Workshop);
  private readonly wallet = inject(Wallet);
  private readonly ores = inject(Ores);
  private readonly progression = inject(Progression);
  protected readonly echoes = inject(Echoes);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  private readonly inventory = inject(Inventory);
  private readonly artifacts = inject(Artifacts);
  /** Dernière reforge, pour faire briller l'affixe obtenu. */
  protected readonly reforged = signal<{ readonly slot: SlotId; readonly stat: StatId } | null>(null);

  protected readonly maxLevel = WORKSHOP_MAX_LEVEL;
  /**
   * La réforge des artefacts n'apparaît qu'avec un artefact au niveau maximum : sans lui, elle n'était qu'un texte
   * d'explication (retiré à la demande de Théo, 19/10/2026).
   */
  protected readonly reforgeable = computed(() => {
    const owned = this.artifacts.owned();
    return ARTIFACT_IDS.some((id) => owned[id] === ARTIFACT_MAX_LEVEL);
  });
  protected readonly coins = computed(() => compactNumber(this.wallet.coins()));

  protected readonly rows = computed(() =>
    SLOT_IDS.map((slot) => {
      const tier = this.workshop.tier(slot);
      const level = this.workshop.level(slot);
      const cost = this.workshop.cost(slot);
      const check = this.workshop.check(slot);
      const material = tier === null ? null : workshopMaterial(tier);
      return {
        slot,
        tier,
        label: tier === null ? SLOTS[slot].label : `${SLOTS[slot].label} · ${TIER_LABELS[tier]}`,
        icon: itemIconUrl(slot, tier, SLOTS[slot].iconUrl),
        level,
        effect: `+${PERCENT.format(level * WORKSHOP_STEP * 100)} % à toutes les stats`,
        next: level < WORKSHOP_MAX_LEVEL ? `+${PERCENT.format((level + 1) * WORKSHOP_STEP * 100)} %` : null,
        gold: cost === null ? null : compactNumber(cost.gold),
        ore:
          cost === null || material === null
            ? null
            : {
                icon: materialIconUrl(material),
                need: cost.ores[material] ?? 0,
                stock: this.ores.stock()[material],
                // Zone où se mine ce minerai : on peut y revenir si elle est déjà terminée
                zone: tierZone(material),
                canFarm: tierZone(material) < this.progression.zone() && tierZone(material) !== this.progression.farmZone(),
              },
        check,
        blocked: check === 'ok' ? null : BLOCKED_TEXT[check],
        affinities: SLOT_AFFINITIES[slot].map((affinity) => STATS[affinity].label).join(', '),
        reforge: this.reforgeRow(slot),
      };
    }),
  );

  /** Affixes reforgeables de la pièce portée, et le prix d'une reforge. */
  private reforgeRow(slot: SlotId) {
    const item = this.inventory.equipped()[slot];
    const cost = this.workshop.reforgeCost(slot);
    if (item === undefined || cost === null) {
      return null;
    }
    const check = this.workshop.reforgeCheck(slot);
    const [material, need] = Object.entries(cost.ores)[0] ?? [null, 0];
    return {
      affixes: reforgeableAffixes(item).map((stat) => ({ stat, text: `${STATS[stat].label} ${formatStat(stat, item.stats[stat] ?? 0)}` })),
      gold: compactNumber(cost.gold),
      ore: material === null ? null : { icon: materialIconUrl(material as TierId), need },
      check,
      full: check === 'max',
    };
  }

  protected reforge(slot: SlotId, stat: StatId): void {
    const result = this.workshop.reforge(slot, stat);
    if (result !== null) {
      this.reforged.set({ slot, stat: result });
      this.sound.play('forgeRare');
    }
  }

  /** Revient miner le minerai qui manque, dans sa zone. */
  protected farm(zone: number): void {
    if (this.echoes.enter(zone)) {
      this.navigation.open('mine');
    }
  }

  protected upgrade(slot: SlotId): void {
    if (this.workshop.upgrade(slot)) {
      this.sound.play('upgrade');
    }
  }

  protected close(): void {
    this.navigation.open('mine');
  }
}
