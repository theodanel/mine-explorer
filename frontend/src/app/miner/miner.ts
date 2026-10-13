import { computed, inject, Injectable } from '@angular/core';

import { Artifacts } from '../artifacts/artifacts';
import { Inventory } from '../equipment/inventory';
import { Companions } from '../companions/companions';
import { Galleries } from '../galleries/galleries';
import { Skills } from '../skills/skills';
import { Spells } from '../spells/spells';
import { reinforce } from '../workshop/workshop-rules';
import { Workshop } from '../workshop/workshop';
import { minerProfile, NO_BUFFS } from './miner-rules';

/**
 * Stats complètes du mineur : équipement et évolution (Inventory), Atelier, arbre de compétences, artefact porté, compagnon,
 * et sorts en cours pour `current`. `permanent` sert à l'absence et aux comparaisons, `current` à la mine.
 */
@Injectable({ providedIn: 'root' })
export class Miner {
  private readonly inventory = inject(Inventory);
  private readonly skills = inject(Skills);
  private readonly artifacts = inject(Artifacts);
  private readonly spells = inject(Spells);
  private readonly workshop = inject(Workshop);
  private readonly galleries = inject(Galleries);
  private readonly companions = inject(Companions);

  private readonly families = computed(() => [this.skills.bonuses(), this.artifacts.bonuses(), this.companions.bonuses()]);
  /** Équipement et évolution, renforcés par l'Atelier. */
  private readonly gear = computed(() => reinforce(this.inventory.stats(), this.workshop.levels()));
  readonly permanent = computed(() => minerProfile(this.gear(), this.families(), NO_BUFFS));
  /** La galerie de la zone ne compte qu'en jeu : elle s'ajoute aux sorts, comme un effet temporaire. */
  readonly current = computed(() => {
    const buffs = this.spells.buffs();
    return minerProfile(this.gear(), this.families(), { ...buffs, speed: buffs.speed + this.galleries.modifiers().speed });
  });
}
