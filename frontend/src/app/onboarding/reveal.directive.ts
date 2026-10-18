import { computed, Directive, inject, input } from '@angular/core';

import { Reveal } from './reveal';
import { RevealId } from './reveal-rules';

/**
 * Élément du panneau du bas : grisé et bloqué tant que la prise en main ne l'a pas présenté, puis il surgit.
 * data-reveal marque l'élément que la bulle entoure.
 */
@Directive({
  selector: '[appReveal]',
  host: {
    '[class.locked-ui]': 'locked()',
    // inert bloque toucher, clavier et lecteur d'écran tant que l'élément n'est pas débloqué
    '[attr.inert]': "locked() ? '' : null",
    '[class.reveal-pop]': 'pop()',
    '[attr.data-reveal]': 'appReveal()',
  },
})
export class RevealDirective {
  private readonly reveal = inject(Reveal);
  readonly appReveal = input.required<RevealId>();
  protected readonly locked = computed(() => this.reveal.isLocked(this.appReveal()));
  protected readonly pop = computed(() => this.reveal.isFresh(this.appReveal()));
}
