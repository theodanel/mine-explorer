import { Component, DOCUMENT, inject, output, signal } from '@angular/core';

import { EVOLUTION_FORMS, MAX_PICKAXE_LEVEL } from '../balance/balance';
import { ABYSS_FLOORS_PER_ESSENCES } from '../balance/heart-forge';
import { TIER_IDS } from '../equipment/equipment.model';
import { formTitle } from '../evolution/evolution-rules';
import { HeartForge } from '../heart-forge/heart-forge';
import { REVEAL_IDS } from '../onboarding/reveal-rules';
import { Ores } from '../ores/ores';
import { Rebirth, REBIRTH_STORAGE_KEY } from '../rebirth/rebirth';
import { writeStorage } from '../shared/local-storage';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { compactNumber } from '../shared/format-number';

/** Clés de sauvegarde du jeu : toutes commencent ainsi. */
const SAVE_PREFIX = 'mine-explorer.';
/** Zones proposées : les zones continuent sans fin depuis la renaissance, assez loin pour tester la fin de jeu. */
const LAST_ZONE = 60;
const COIN_GIFTS = [10_000, 1_000_000, 1_000_000_000] as const;
const SHARD_GIFT = 1_000;
const ORE_GIFT = 100;
const ESSENCE_GIFT = 50;

/**
 * Outils du site de test (staging) seulement : se donner de l'or, des éclats, des minerais, une renaissance, sauter à
 * une zone, choisir une forme ou un niveau de pioche, tout débloquer, ou repartir de zéro. Jamais dans le build de production
 * (environment.testBanner). Les réglages qui changent l'état de départ réécrivent la sauvegarde puis rechargent la
 * page : chaque service relit et valide sa clé, comme au lancement du jeu.
 */
@Component({
  selector: 'app-test-tools',
  templateUrl: './test-tools.html',
  styleUrl: './test-tools.scss',
})
export class TestTools {
  private readonly wallet = inject(Wallet);
  private readonly shards = inject(GeodeShards);
  private readonly ores = inject(Ores);
  private readonly heartForge = inject(HeartForge);
  private readonly rebirth = inject(Rebirth);
  private readonly document = inject(DOCUMENT);
  readonly closed = output();

  protected readonly coinGifts = COIN_GIFTS.map((amount) => ({
    amount,
    label: compactNumber(amount),
  }));
  protected readonly zones = Array.from({ length: LAST_ZONE }, (_, index) => index + 1);
  protected readonly forms = EVOLUTION_FORMS.map((form, index) => ({
    index,
    label: formTitle(form),
  }));
  protected readonly pickaxeLevels = Array.from(
    { length: MAX_PICKAXE_LEVEL },
    (_, index) => index + 1,
  );
  protected readonly shardGift = SHARD_GIFT;
  protected readonly oreGift = ORE_GIFT;
  protected readonly essenceGift = ESSENCE_GIFT;
  protected readonly done = signal<string | null>(null);
  protected readonly confirmingReset = signal(false);

  protected addCoins(amount: number): void {
    this.wallet.add(amount);
    this.done.set(`+${compactNumber(amount)} d'or`);
  }

  protected addShards(): void {
    this.shards.add(SHARD_GIFT);
    this.done.set(`+${SHARD_GIFT} éclats`);
  }

  protected addOres(): void {
    for (const tier of TIER_IDS) {
      this.ores.add(tier, ORE_GIFT);
    }
    this.done.set(`+${ORE_GIFT} de chaque minerai`);
  }

  /** Une descente du Puits donne une ressource du Cœur de chaque sorte tous les 25 étages. */
  protected addEssences(): void {
    this.heartForge.onAbyssRun(ESSENCE_GIFT * ABYSS_FLOORS_PER_ESSENCES);
    this.done.set(`+${ESSENCE_GIFT} de chaque ressource du Cœur`);
  }

  /** Une renaissance de plus, sans repartir de zéro : pour tester la Constellation et la dureté des filons. */
  protected addRebirth(): void {
    const state = this.rebirth.snapshot();
    writeStorage(REBIRTH_STORAGE_KEY, JSON.stringify({ ...state, count: state.count + 1 }));
    this.reload();
  }

  protected goToZone(zone: number): void {
    writeStorage(`${SAVE_PREFIX}progress`, JSON.stringify({ zone, stage: 1, damage: 0 }));
    // Plus de zone passée en cours ni de gardien raté : on arrive au début de la zone choisie
    this.removeKeys(['farm', 'guardian-blocked']);
    this.reload();
  }

  protected setForm(index: number): void {
    writeStorage(`${SAVE_PREFIX}evolution`, String(index));
    this.reload();
  }

  protected setPickaxe(level: number): void {
    writeStorage(
      `${SAVE_PREFIX}pickaxe`,
      JSON.stringify({ level, segments: 0, upgradeEndsAt: null }),
    );
    this.reload();
  }

  /** Tout l'écran présenté d'un coup, sans les bulles de la prise en main. */
  protected unlockInterface(): void {
    writeStorage(`${SAVE_PREFIX}devoilement`, JSON.stringify(REVEAL_IDS));
    this.reload();
  }

  /** Repartir d'une partie neuve sur cet appareil (la sauvegarde en ligne de test n'est pas touchée). */
  protected resetGame(): void {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(SAVE_PREFIX));
    for (const key of keys) {
      localStorage.removeItem(key);
    }
    this.reload();
  }

  protected close(): void {
    this.closed.emit();
  }

  private removeKeys(names: readonly string[]): void {
    for (const name of names) {
      localStorage.removeItem(`${SAVE_PREFIX}${name}`);
    }
  }

  private reload(): void {
    this.document.defaultView?.location.reload();
  }
}
