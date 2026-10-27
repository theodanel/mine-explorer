import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';

import { titleOf } from '../../achievements/achievement-rules';
import { EVOLUTION_FORMS } from '../../balance/balance';
import { formatStat } from '../../equipment/equipment-format';
import { SLOT_IDS, SLOTS, STAT_IDS, STATS, TIER_LABELS } from '../../equipment/equipment.model';
import { EVOLUTION_VISUALS, itemIconUrl } from '../../loading/game-assets';
import { holdUserDialog } from '../../shared/overlays';
import { OnlineApi } from '../online-api';
import { AuthorProfile, isAuthorProfile } from './chat-model';

/**
 * Fiche d'un joueur ouverte depuis la discussion : son mineur, sa zone et son équipement porté. Le serveur la
 * retrouve par le message ; le jeu ne connaît jamais l'identifiant du joueur.
 */
@Component({
  selector: 'app-author-card',
  templateUrl: './author-card.html',
  styleUrl: './author-card.scss',
})
export class AuthorCard implements OnInit {
  private readonly api = inject(OnlineApi);

  readonly messageId = input.required<number>();
  readonly closed = output();

  private readonly profile = signal<AuthorProfile | null>(null);
  protected readonly failed = signal(false);

  constructor() {
    holdUserDialog();
  }

  ngOnInit(): void {
    // L'identifiant du message n'est connu qu'une fois les entrées posées
    void this.load();
  }

  protected readonly view = computed(() => {
    const profile = this.profile();
    if (profile === null) {
      return null;
    }
    const form = EVOLUTION_FORMS[Math.min(profile.form, EVOLUTION_FORMS.length - 1)];
    const pieces = new Map(profile.equipment.map((piece) => [piece.slot, piece]));
    return {
      pseudo: profile.pseudo,
      title: titleOf(profile.title),
      zone: profile.zone,
      formLabel: form.label,
      stars: form.stars,
      portrait: EVOLUTION_VISUALS[form.id].portraitUrl,
      slots: SLOT_IDS.map((slot) => {
        const piece = pieces.get(slot);
        return {
          slot,
          label: SLOTS[slot].label,
          icon: itemIconUrl(slot, piece?.tier ?? null, SLOTS[slot].iconUrl),
          tier: piece?.tier ?? 'empty',
          tierLabel: piece === undefined ? 'Vide' : TIER_LABELS[piece.tier] + (piece.awakening > 0 ? ` corrompu · Éveil ${piece.awakening}` : ''),
          level: piece?.level ?? null,
          awakening: piece?.awakening ?? 0,
          stats:
            piece === undefined
              ? []
              : STAT_IDS.filter((stat) => piece.stats[stat] !== undefined).map(
                  (stat) => `${STATS[stat].label} ${formatStat(stat, piece.stats[stat] ?? 0)}`,
                ),
        };
      }),
    };
  });

  private async load(): Promise<void> {
    const result = await this.api.get(`/api/chat/${this.messageId()}/author`);
    if (result.ok && isAuthorProfile(result.body)) {
      this.profile.set(result.body);
    } else {
      this.failed.set(true);
    }
  }
}
