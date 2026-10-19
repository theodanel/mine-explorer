import { Component } from '@angular/core';

/** Fête du jackpot de la Forge : un éclair doré sur la forge et un bandeau « Jackpot ! » qui jaillit. */
@Component({
  selector: 'app-jackpot-burst',
  template: `<span class="jackpot-flash" aria-hidden="true"></span><span class="jackpot-banner" role="status">Jackpot !</span>`,
  styleUrl: './jackpot-burst.scss',
})
export class JackpotBurst {}
