import { Component, computed, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import {
  BUILDING_IDS,
  BUILDING_MAX_LEVEL,
  BuildingId,
  CampLevels,
  TAVERN_EFFICIENCY_STEP,
  WAREHOUSE_CAP_STEP_MS,
  WELL_SHARDS_PER_HOUR,
  WELL_STORAGE_HOURS,
} from '../../balance/camp';
import { OFFLINE_CAP_MS, OFFLINE_EFFICIENCY } from '../../balance/balance';
import { TIER_LABELS } from '../../equipment/equipment.model';
import { ADVENTURE_IMAGES, materialIconUrl } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { formatDuration } from '../../shared/format-duration';
import { Wallet } from '../../wallet/wallet';
import { BuildCheck, Camp } from '../camp';

const PERCENT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const COMPACT = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });
const DECIMAL = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

const BLOCKED_TEXT: Readonly<Record<Exclude<BuildCheck, 'ok'>, string>> = {
  locked: 'Campement fermé',
  max: 'Niveau maximal',
  gold: 'Pas assez d\'or',
  ores: 'Pas assez de minerai',
};

interface BuildingText {
  readonly label: string;
  readonly icon: string;
  /** Emplacement dans le décor du camp, en % de la vue (pied du bâtiment) : les trois places laissées libres. */
  readonly spot: { readonly x: number; readonly y: number };
  readonly role: string;
  /** Effet au niveau donné, en une ligne courte. */
  readonly effect: (level: number) => string;
}

const BUILDINGS: Readonly<Record<BuildingId, BuildingText>> = {
  tavern: {
    label: 'Taverne',
    icon: ADVENTURE_IMAGES.tavern,
    spot: { x: 23, y: 80 },
    role: 'Les mineurs reviennent reposés : plus d\'or pendant ton absence.',
    effect: (level) => `${PERCENT.format((OFFLINE_EFFICIENCY + level * TAVERN_EFFICIENCY_STEP) * 100)} % du rendement hors ligne`,
  },
  warehouse: {
    label: 'Entrepôt',
    icon: ADVENTURE_IMAGES.warehouse,
    spot: { x: 79, y: 80 },
    role: 'Plus de place pour stocker : ton absence compte plus longtemps.',
    effect: (level) => `Absence comptée jusqu'à ${formatDuration(OFFLINE_CAP_MS + level * WAREHOUSE_CAP_STEP_MS)}`,
  },
  well: {
    label: 'Puits',
    icon: ADVENTURE_IMAGES.well,
    spot: { x: 51, y: 62 },
    role: `Il remonte des éclats même jeu fermé, jusqu'à ${WELL_STORAGE_HOURS} h de réserve.`,
    effect: (level) => `${DECIMAL.format(level * WELL_SHARDS_PER_HOUR)} éclat${level * WELL_SHARDS_PER_HOUR >= 2 ? 's' : ''} par heure`,
  },
};

/**
 * Campement : une vue du camp avec ses trois bâtiments posés dans le décor ; toucher un bâtiment ouvre sa fiche
 * (effet actuel et suivant, prix, bouton d'agrandissement). Le puits montre ses éclats prêts à récolter.
 */
@Component({
  selector: 'app-camp-page',
  templateUrl: './camp-page.html',
  styleUrl: './camp-page.scss',
})
export class CampPage {
  protected readonly camp = inject(Camp);
  private readonly wallet = inject(Wallet);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);

  protected readonly scene = `url(${ADVENTURE_IMAGES.campBackground})`;
  protected readonly selected = signal<BuildingId>('tavern');
  protected readonly coins = computed(() => COMPACT.format(this.wallet.coins()));
  protected readonly material = computed(() => {
    const tier = this.camp.material();
    return { tier, label: TIER_LABELS[tier], icon: materialIconUrl(tier) };
  });

  protected readonly rows = computed(() => rowsFor(this.camp.levels(), this.camp));
  protected readonly detail = computed(() => this.rows().find((row) => row.building === this.selected()) ?? this.rows()[0]);

  protected build(building: BuildingId): void {
    if (this.camp.build(building)) {
      this.sound.play('upgrade');
    }
  }

  protected collect(): void {
    if (this.camp.collectWell() > 0) {
      this.sound.play('shard');
    }
  }

  protected back(): void {
    this.navigation.open('adventures');
  }
}

function rowsFor(levels: CampLevels, camp: Camp) {
  return BUILDING_IDS.map((building) => {
    const level = levels[building] ?? 0;
    const max = level >= BUILDING_MAX_LEVEL[building];
    const cost = camp.cost(building);
    const check = camp.check(building);
    const text = BUILDINGS[building];
    return {
      building,
      label: text.label,
      icon: text.icon,
      spot: text.spot,
      role: text.role,
      level,
      maxLevel: BUILDING_MAX_LEVEL[building],
      effect: text.effect(level),
      next: max ? null : text.effect(level + 1),
      gold: COMPACT.format(cost.gold),
      ores: cost.ores[camp.material()] ?? 0,
      check,
      action: level === 0 ? 'Construire' : 'Agrandir',
      blocked: check === 'ok' ? null : BLOCKED_TEXT[check],
    };
  });
}
