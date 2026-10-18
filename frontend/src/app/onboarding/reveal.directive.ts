import { computed, Directive, inject, input } from '@angular/core';

import { Reveal } from './reveal';
import { RevealId } from './reveal-rules';

/**
 * Cache l'élément tant qu'il n'est pas dévoilé, en gardant sa place pour que l'écran ne saute pas,
 * puis le fait surgir la première fois qu'il apparaît. data-reveal marque l'élément que la bulle entoure :
 * quand plusieurs éléments apparaissent ensemble, les autres passent revealAnchor à false.
 */
@Directive({
  selector: '[appReveal]',
  host: {
    '[class.unrevealed]': '!shown()',
    '[class.reveal-pop]': 'pop()',
    '[attr.data-reveal]': 'revealAnchor() ? appReveal() : null',
  },
})
export class RevealDirective {
  private readonly reveal = inject(Reveal);
  readonly appReveal = input.required<RevealId>();
  readonly revealAnchor = input(true);
  protected readonly shown = computed(() => this.reveal.isRevealed(this.appReveal()));
  protected readonly pop = computed(() => this.reveal.isFresh(this.appReveal()));
}
