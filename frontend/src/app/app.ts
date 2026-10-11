import { Component, inject } from '@angular/core';

import { ColumnSlot, EquipmentColumn } from './equipment/equipment-column/equipment-column';
import { ForgeButton } from './equipment/forge-button/forge-button';
import { Inventory } from './equipment/inventory';
import { ItemCompare } from './equipment/item-compare/item-compare';
import { StatsPanel } from './equipment/stats-panel/stats-panel';
import { SplashScreen } from './loading/splash-screen/splash-screen';
import { MineScene } from './mine-scene/mine-scene';
import { OfflineReport } from './offline/offline-report/offline-report';
import { ZoneBanner } from './progression/zone-banner/zone-banner';
import { GeodeShards } from './wallet/geode-shards';
import { Wallet } from './wallet/wallet';

@Component({
  selector: 'app-root',
  imports: [MineScene, ZoneBanner, EquipmentColumn, StatsPanel, ForgeButton, ItemCompare, OfflineReport, SplashScreen],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly wallet = inject(Wallet);
  protected readonly shards = inject(GeodeShards);
  protected readonly inventory = inject(Inventory);

  // Trois cases par colonne autour du mineur ; la dernière à droite attend un futur emplacement
  protected readonly leftSlots: readonly ColumnSlot[] = ['helmet', 'pickaxe', 'bag'];
  protected readonly rightSlots: readonly ColumnSlot[] = ['gloves', 'boots', null];
}
