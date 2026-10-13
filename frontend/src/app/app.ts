import { Component, computed, inject } from '@angular/core';

import { ArtifactFound } from './artifacts/artifact-found/artifact-found';
import { ArtifactsPage } from './artifacts/artifacts-page/artifacts-page';
import { WorkshopPage } from './workshop/workshop-page/workshop-page';
import { ColumnSlot, EquipmentColumn } from './equipment/equipment-column/equipment-column';
import { ForgeButton } from './equipment/forge-button/forge-button';
import { zoneMaterial } from './balance/balance';
import { TIER_LABELS } from './equipment/equipment.model';
import { Evolution } from './evolution/evolution';
import { EvolutionPage } from './evolution/evolution-page/evolution-page';
import { ProfilePage } from './profile/profile-page/profile-page';
import { ItemCompare } from './equipment/item-compare/item-compare';
import { StatsButton } from './equipment/stats-button/stats-button';
import { EVOLUTION_VISUALS, materialIconUrl } from './loading/game-assets';
import { MineEventLayer } from './mine-events/mine-event-layer/mine-event-layer';
import { CompanionBuddy } from './companions/companion-buddy/companion-buddy';
import { CompanionHatched } from './companions/companion-hatched/companion-hatched';
import { CompanionsPage } from './companions/companions-page/companions-page';
import { Challenge } from './challenge/challenge';
import { ChallengePage } from './challenge/challenge-page/challenge-page';
import { GalleryChoice } from './galleries/gallery-choice/gallery-choice';
import { SplashScreen } from './loading/splash-screen/splash-screen';
import { TutorialOverlay } from './tutorial/tutorial-overlay/tutorial-overlay';
import { MineScene } from './mine-scene/mine-scene';
import { OfflineReport } from './offline/offline-report/offline-report';
import { Ores } from './ores/ores';
import { FooterMenu } from './navigation/footer-menu/footer-menu';
import { Navigation } from './navigation/navigation';
import { Progression } from './progression/progression';
import { SkillsPage } from './skills/skills-page/skills-page';
import { SpellBar } from './spells/spell-bar/spell-bar';
import { SpellCaster } from './spells/spell-caster';
import { ZoneBanner } from './progression/zone-banner/zone-banner';
import { GeodeShards } from './wallet/geode-shards';
import { Wallet } from './wallet/wallet';

@Component({
  selector: 'app-root',
  imports: [
    MineScene,
    ZoneBanner,
    EquipmentColumn,
    SpellBar,
    StatsButton,
    ForgeButton,
    SkillsPage,
    ArtifactsPage,
    WorkshopPage,
    FooterMenu,
    ItemCompare,
    ArtifactFound,
    OfflineReport,
    EvolutionPage,
    ProfilePage,
    SplashScreen,
    TutorialOverlay,
    MineEventLayer,
    GalleryChoice,
    CompanionsPage,
    ChallengePage,
    CompanionHatched,
    CompanionBuddy,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly materialIcon = materialIconUrl;
  protected readonly wallet = inject(Wallet);
  protected readonly shards = inject(GeodeShards);
  protected readonly evolution = inject(Evolution);
  protected readonly navigation = inject(Navigation);
  // Le défi tourne toute la partie : ses points comptent même quand sa page est fermée
  protected readonly challenge = inject(Challenge);
  private readonly ores = inject(Ores);
  private readonly progression = inject(Progression);

  /** Minerai que donne la zone en cours, affiché en haut pour voir la récolte avancer (aucun en zone 1). */
  protected readonly zoneOre = computed(() => {
    const tier = zoneMaterial(this.progression.zone());
    return tier === null ? null : { tier, label: TIER_LABELS[tier], amount: this.ores.stock()[tier] };
  });
  protected readonly portraitUrl = computed(() => EVOLUTION_VISUALS[this.evolution.form().id].portraitUrl);

  // Panneau du bas : les 5 emplacements, puis l'artefact et le compagnon
  protected readonly equipmentSlots: readonly ColumnSlot[] = ['helmet', 'pickaxe', 'bag', 'gloves', 'boots', 'artifact', 'companion'];

  constructor() {
    // Le lanceur de sorts tourne pendant toute la partie, même quand la barre de sorts est cachée par une page
    inject(SpellCaster);
  }
}
