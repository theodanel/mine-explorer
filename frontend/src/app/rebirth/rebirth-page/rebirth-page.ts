import { Component, computed, DOCUMENT, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { REBIRTH_BRANCHES, REBIRTH_MIN_ZONE, REBIRTH_TREE, RebirthBranch, rebirthEmbers, rebirthHardness } from '../../balance/rebirth';
import { Navigation } from '../../navigation/navigation';
import { Progression } from '../../progression/progression';
import { Wallet } from '../../wallet/wallet';
import { Rebirth } from '../rebirth';
import { writeNewLife } from '../rebirth-reset';
import { branchLevel, buy, canBuy, nextCost, rebirth, rebirthEffects, RebirthState } from '../rebirth-rules';
import { romanNumeral } from '../rebirth-visuals';

const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR');

/**
 * Page Renaissance : renaître depuis la zone 20 ou plus loin, et dépenser les Braises du Cœur dans l'arbre permanent.
 * Renaître remet la partie de mine à zéro puis recharge le jeu : chaque service repart de sa sauvegarde.
 */
@Component({
  selector: 'app-rebirth-page',
  templateUrl: './rebirth-page.html',
  styleUrl: './rebirth-page.scss',
})
export class RebirthPage {
  protected readonly rebirth = inject(Rebirth);
  private readonly progression = inject(Progression);
  private readonly wallet = inject(Wallet);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  private readonly document = inject(DOCUMENT);

  /**
   * Renaissance préparée : les Braises de cette vie sont déjà comptées, et le joueur les dépense avant de repartir
   * (le Raccourci et la Pioche mémoire servent dès la nouvelle vie). Rien n'est enregistré avant la confirmation.
   */
  protected readonly draft = signal<RebirthState | null>(null);
  /** L'arbre affiché : celui de la renaissance préparée, sinon celui du compte. */
  private readonly shown = computed(() => this.draft() ?? this.rebirth.snapshot());

  protected readonly zone = this.progression.zone;
  protected readonly minZone = REBIRTH_MIN_ZONE;
  protected readonly emblem = computed(() => romanNumeral(this.rebirth.count()));
  protected readonly embersLabel = computed(() => NUMBER_FORMAT.format(this.shown().embers));
  protected readonly canRebirth = computed(() => this.zone() >= REBIRTH_MIN_ZONE);
  protected readonly gain = computed(() => NUMBER_FORMAT.format(rebirthEmbers(this.zone())));
  /** Ce que la vie suivante coûtera en plus : la dureté des filons après cette renaissance. */
  protected readonly nextHardness = computed(() => {
    const ratio = rebirthHardness(this.rebirth.count() + 1);
    return `×${ratio.toFixed(2).replace('.', ',')}`;
  });
  protected readonly start = computed(() => {
    const effects = rebirthEffects(this.shown());
    return `zone ${effects.startZone}, pioche niveau ${effects.startPickaxe}, ${Math.round(effects.goldKept * 100)} % de l'or`;
  });

  protected readonly branches = computed(() => {
    const state = this.shown();
    return REBIRTH_BRANCHES.map((branch) => {
      const definition = REBIRTH_TREE[branch];
      const level = branchLevel(state, branch);
      const cost = nextCost(state, branch);
      return {
        branch,
        label: definition.label,
        level,
        maxLevel: definition.maxLevel,
        current: level > 0 ? definition.describe(level) : 'Pas encore acheté',
        next: cost === null ? null : definition.describe(level + 1),
        cost: cost === null ? null : NUMBER_FORMAT.format(cost),
        affordable: canBuy(state, branch),
      };
    });
  });

  protected buy(branch: RebirthBranch): void {
    const draft = this.draft();
    if (draft !== null) {
      if (canBuy(draft, branch)) {
        this.draft.set(buy(draft, branch));
        this.sound.play('upgrade');
      }
    } else if (this.rebirth.buy(branch)) {
      this.sound.play('upgrade');
    }
  }

  /** Prépare la renaissance : les Braises de cette vie s'ajoutent, à dépenser avant de repartir. */
  protected prepareRebirth(): void {
    if (this.canRebirth()) {
      this.draft.set(rebirth(this.rebirth.snapshot(), this.zone(), this.progression.stagesReached()));
    }
  }

  protected cancelRebirth(): void {
    this.draft.set(null);
  }

  /** Renaît pour de bon : l'arbre et la nouvelle vie sont écrits dans la sauvegarde, puis le jeu se recharge. */
  protected confirmRebirth(): void {
    const draft = this.draft();
    if (draft === null) {
      return;
    }
    this.rebirth.commit(draft);
    writeNewLife(rebirthEffects(draft), this.wallet.amount());
    this.document.location.reload();
  }

  protected close(): void {
    this.navigation.open('profile');
  }
}
