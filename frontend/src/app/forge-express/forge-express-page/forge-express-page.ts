import { Component, computed, effect, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { FAIR_WINDOW, GOOD_WINDOW, PERFECT_WINDOW, STRIKES_PER_RUN, StrikeGrade } from '../../balance/forge-express';
import { SLOTS, TIER_LABELS } from '../../equipment/equipment.model';
import { FORGE_EXPRESS_IMAGES, itemIconUrl, pageBackground } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { ForgeExpress } from '../forge-express';
import { heat } from '../forge-express-game';

const PERCENT = 100;
const POP_MS = 650;
const SWING_MS = 220;

const GRADE_LABELS: Readonly<Record<StrikeGrade, string>> = { perfect: 'Parfait !', good: 'Bien', fair: 'Juste', miss: 'Raté' };

/** Forge express : la jauge de chaleur, l'enclume à frapper en rythme, puis l'objet gagné. */
@Component({
  selector: 'app-forge-express-page',
  templateUrl: './forge-express-page.html',
  styleUrl: './forge-express-page.scss',
  host: { '(window:keydown.space)': 'onSpace($event)' },
})
export class ForgeExpressPage {
  protected readonly forgeExpress = inject(ForgeExpress);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);

  protected readonly images = FORGE_EXPRESS_IMAGES;
  protected readonly scene = pageBackground(FORGE_EXPRESS_IMAGES.background);
  /** Zones de la jauge, en % de sa largeur : juste, bien, parfait, centrées. */
  protected readonly zones = {
    fair: { left: (0.5 - FAIR_WINDOW) * PERCENT, width: FAIR_WINDOW * 2 * PERCENT },
    good: { left: (0.5 - GOOD_WINDOW) * PERCENT, width: GOOD_WINDOW * 2 * PERCENT },
    perfect: { left: (0.5 - PERFECT_WINDOW) * PERCENT, width: PERFECT_WINDOW * 2 * PERCENT },
  };
  protected readonly smithing = this.forgeExpress.smithing;
  protected readonly needle = computed(() => {
    const smithing = this.smithing();
    return smithing === null ? 0 : heat(smithing) * PERCENT;
  });
  /** La couleur du lingot suit sa chaleur, du rouge sombre au jaune vif. */
  protected readonly glow = computed(() => this.needle() / PERCENT);
  protected readonly strikes = computed(() => {
    const grades = this.smithing()?.grades ?? [];
    return Array.from({ length: STRIKES_PER_RUN }, (_, index) => grades[index] ?? null);
  });
  protected readonly result = computed(() => {
    const result = this.forgeExpress.lastResult();
    if (result === null) {
      return null;
    }
    const { item } = result;
    return {
      ...result,
      icon: itemIconUrl(item.slot, item.tier, SLOTS[item.slot].iconUrl),
      label: `${SLOTS[item.slot].label} · ${TIER_LABELS[item.tier]}`,
    };
  });
  protected readonly pop = signal<{ id: number; text: string; grade: StrikeGrade; combo: number } | null>(null);
  protected readonly swing = signal(false);
  private popId = 0;

  constructor() {
    effect(() => {
      if (this.forgeExpress.lastResult() !== null) {
        this.sound.play('forgeEpic');
      }
    });
  }

  protected start(): void {
    if (this.forgeExpress.start()) {
      this.sound.play('upgrade');
    }
  }

  protected strike(): void {
    const before = this.smithing();
    if (before === null || this.forgeExpress.lastResult() !== null) {
      return;
    }
    this.forgeExpress.strike();
    const after = this.smithing();
    const grade = after?.grades.at(-1);
    if (grade === undefined || after === null) {
      return;
    }
    this.sound.play(grade === 'perfect' ? 'crit' : grade === 'miss' ? 'rockBreak' : 'strike');
    const id = ++this.popId;
    this.pop.set({ id, text: GRADE_LABELS[grade], grade, combo: after.combo });
    setTimeout(() => this.pop.update((pop) => (pop?.id === id ? null : pop)), POP_MS);
    this.swing.set(true);
    setTimeout(() => this.swing.set(false), SWING_MS);
  }

  protected onSpace(event: Event): void {
    if (this.smithing() !== null) {
      event.preventDefault();
      this.strike();
    }
  }

  /** L'objet gagné attend sur la mine, comme un objet forgé : on y va pour l'équiper ou le vendre. */
  protected seeItem(): void {
    this.forgeExpress.leave();
    this.navigation.open('mine');
  }

  protected back(): void {
    this.forgeExpress.leave();
    this.navigation.open('adventures');
  }
}
