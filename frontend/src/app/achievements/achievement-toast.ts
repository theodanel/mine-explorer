import { Component, effect, inject, signal, untracked } from '@angular/core';

import { Achievements } from './achievements';

/** Durée de l'annonce d'un succès gagné. */
const TOAST_MS = 3500;

/** « Succès : Forgeron » : une annonce brève quand un succès tombe, puis elle s'efface. */
@Component({
  selector: 'app-achievement-toast',
  template: `
    @if (text(); as message) {
      <p class="toast" role="status">{{ message }}</p>
    }
  `,
  styles: `
    .toast {
      margin: 0;
      padding: 1.2cqw 3.5cqw;
      border: 0.45cqw solid var(--ink);
      border-radius: 999px;
      background: linear-gradient(#ffe68a, #f2b52c);
      color: var(--ink);
      font: 3.2cqw / 1.2 var(--font-display);
      white-space: nowrap;
      animation: toast-in 0.4s ease-out;
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(-3cqw);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .toast {
        animation: none;
      }
    }
  `,
})
export class AchievementToast {
  private readonly achievements = inject(Achievements);
  protected readonly text = signal<string | null>(null);

  constructor() {
    let timer: ReturnType<typeof setTimeout> | null = null;
    effect(() => {
      const latest = this.achievements.latest();
      if (latest.length === 0) {
        return;
      }
      untracked(() => {
        const names = latest.map((achievement) => achievement.title).join(', ');
        this.text.set(`Succès : ${names} !`);
        if (timer !== null) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => this.text.set(null), TOAST_MS);
      });
    });
  }
}
