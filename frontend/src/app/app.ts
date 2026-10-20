import { Component, computed, effect, inject, signal } from '@angular/core';

import { ArtifactFound } from './artifacts/artifact-found/artifact-found';
import { ArtifactsPage } from './artifacts/artifacts-page/artifacts-page';
import { WorkshopPage } from './workshop/workshop-page/workshop-page';
import { AdventuresPage } from './adventures/adventures-page/adventures-page';
import { CampPage } from './camp/camp-page/camp-page';
import { AbyssPage } from './abyss/abyss-page/abyss-page';
import { MinehuntPage } from './minehunt/minehunt-page/minehunt-page';
import { MerchantPage } from './merchant/merchant-page/merchant-page';
import { ForgeExpressPage } from './forge-express/forge-express-page/forge-express-page';
import { TorchlightPage } from './torchlight/torchlight-page/torchlight-page';
import { MerchantHint } from './merchant/merchant-hint/merchant-hint';
import { ZoneMap } from './progression/zone-map/zone-map';
import { ColumnSlot, EquipmentColumn } from './equipment/equipment-column/equipment-column';
import { ForgeButton } from './equipment/forge-button/forge-button';
import { zoneMaterial } from './balance/balance';
import { TIER_LABELS } from './equipment/equipment.model';
import { Evolution } from './evolution/evolution';
import { EvolutionPage } from './evolution/evolution-page/evolution-page';
import { HeartForgePage } from './heart-forge/heart-forge-page/heart-forge-page';
import { GearRunesPage } from './heart-forge/gear-runes-page/gear-runes-page';
import { PassBanner } from './progress-pass/pass-banner/pass-banner';
import { PassPage } from './progress-pass/pass-page/pass-page';
import { DungeonsPage } from './dungeons/dungeons-page/dungeons-page';
import { OutfitsPage } from './outfits/outfits-page/outfits-page';
import { ProfilePage } from './profile/profile-page/profile-page';
import { OnlineLayer } from './online/online-layer';
import { ChatPage } from './online/chat/chat-page';
import { LeaderboardPage } from './online/leaderboard-page/leaderboard-page';
import { ONLINE_CONFIG } from './online/online-config';
import { TestTools } from './test-tools/test-tools';
import { environment } from '../environments/environment';
import { PlayerName } from './shared/player-name';
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
import { MineScene } from './mine-scene/mine-scene';
import { OfflineReport } from './offline/offline-report/offline-report';
import { RevealDirective } from './onboarding/reveal.directive';
import { RevealHint } from './onboarding/reveal-hint/reveal-hint';
import { Ores } from './ores/ores';
import { FooterMenu } from './navigation/footer-menu/footer-menu';
import { Navigation } from './navigation/navigation';
import { Progression } from './progression/progression';
import { Sound } from './audio/sound';
import { SkillsPage } from './skills/skills-page/skills-page';
import { SpellBar } from './spells/spell-bar/spell-bar';
import { SpellCaster } from './spells/spell-caster';
import { ZoneBanner } from './progression/zone-banner/zone-banner';
import { LotteryButton } from './lottery/lottery-button/lottery-button';
import { RewardFlightLayer } from './reward-flight/reward-flight-layer';
import { GeodeShards } from './wallet/geode-shards';
import { Wallet } from './wallet/wallet';
import { RankStars } from './evolution/rank-stars/rank-stars';

/** En dessous de 100 000, le nombre exact ; au-delà, la forme courte. */
const COMPACT_FROM = 100_000;
const COMPACT = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

function resourceLabel(amount: number): string {
  return amount < COMPACT_FROM ? String(amount) : COMPACT.format(amount);
}

@Component({
  selector: 'app-root',
  imports: [
    MineScene,
    RankStars,
    RewardFlightLayer,
    LotteryButton,
    ZoneBanner,
    EquipmentColumn,
    SpellBar,
    StatsButton,
    ForgeButton,
    SkillsPage,
    ArtifactsPage,
    WorkshopPage,
    AdventuresPage,
    CampPage,
    AbyssPage,
    MinehuntPage,
    MerchantPage,
    ForgeExpressPage,
    TorchlightPage,
    MerchantHint,
    ZoneMap,
    FooterMenu,
    ItemCompare,
    ArtifactFound,
    OfflineReport,
    EvolutionPage,
    HeartForgePage,
    GearRunesPage,
    PassBanner,
    PassPage,
    DungeonsPage,
    OutfitsPage,
    ProfilePage,
    OnlineLayer,
    LeaderboardPage,
    ChatPage,
    TestTools,
    SplashScreen,
    RevealHint,
    RevealDirective,
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
  protected readonly playerName = inject(PlayerName);
  protected readonly online = inject(ONLINE_CONFIG).enabled;
  /** Site de test (staging) : un bandeau le distingue du vrai jeu. */
  protected readonly testBanner = environment.testBanner;
  /** Outils de test (or, zone, forme…), ouverts depuis le bandeau du site de test. */
  protected readonly testToolsOpen = signal(false);
  // Le défi tourne toute la partie : ses points comptent même quand sa page est fermée
  protected readonly challenge = inject(Challenge);
  private readonly ores = inject(Ores);
  private readonly progression = inject(Progression);

  /** Minerai que donne la zone en cours, affiché en haut pour voir la récolte avancer (aucun en zone 1). */
  protected readonly zoneOre = computed(() => {
    const tier = zoneMaterial(this.progression.playingZone());
    return tier === null ? null : { tier, label: TIER_LABELS[tier], amount: this.ores.stock()[tier] };
  });
  protected readonly portraitUrl = computed(() => EVOLUTION_VISUALS[this.evolution.form().id].portraitUrl);
  /** Grands nombres abrégés (« 45,2 M ») : le compteur reste lisible en haut d'un écran de téléphone. */
  protected readonly coinsLabel = computed(() => resourceLabel(this.wallet.coins()));
  protected readonly shardsLabel = computed(() => resourceLabel(this.shards.amount()));

  // Panneau du bas : les 5 emplacements, puis l'artefact et le compagnon
  protected readonly equipmentSlots: readonly ColumnSlot[] = ['helmet', 'pickaxe', 'bag', 'gloves', 'boots', 'artifact', 'companion'];

  constructor() {
    // Le lanceur de sorts tourne pendant toute la partie, même quand la barre de sorts est cachée par une page
    inject(SpellCaster);
    // Chaque zone a sa musique : elle suit la zone affichée, y compris un retour dans une zone passée
    const sound = inject(Sound);
    effect(() => sound.setMusicZone(this.progression.playingZone()));
  }
}
