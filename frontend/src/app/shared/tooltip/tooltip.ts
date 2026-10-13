import { Directive, DOCUMENT, ElementRef, inject, input, OnDestroy } from '@angular/core';

/** Contenu riche : un titre, une étiquette colorée facultative (palier) et des lignes de détail. */
export interface TooltipCard {
  readonly title: string;
  readonly badge?: { readonly label: string; readonly tier: string };
  readonly lines: readonly string[];
}

export type TooltipContent = string | TooltipCard;

/** Sans interaction (souris immobile, pas de nouvel appui), l'infobulle disparaît au bout de 2 s. */
const IDLE_HIDE_MS = 2000;
/** Écart entre l'élément et l'infobulle, et marge minimale avec les bords du cadre de jeu. */
const GAP_PX = 8;
const EDGE_PX = 6;

/**
 * Infobulle au survol, au focus clavier et à l'appui tactile, réservée aux endroits où elle apprend quelque chose
 * (objets portés, sorts, stats, galerie, menus encore verrouillés). Elle disparaît au bout de 2 s sans interaction
 * ou dès qu'on touche ailleurs. Un contenu null ne montre rien.
 * Elle s'affiche dans le cadre de jeu (.game), au-dessus de l'élément, sans déborder de l'écran.
 * Le contenu est inséré en texte, jamais en HTML : pas de risque d'injection.
 */
@Directive({
  selector: '[appTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focusin)': 'show()',
    '(focusout)': 'hide()',
    '(pointerdown)': 'onPointerDown($event)',
    '(mousemove)': 'restartIdleTimer()',
  },
})
export class Tooltip implements OnDestroy {
  readonly appTooltip = input.required<TooltipContent | null>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private bubble: HTMLElement | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  /** Un appui ailleurs dans la page ferme l'infobulle. */
  private readonly outsidePress = (event: PointerEvent): void => {
    if (!this.host.nativeElement.contains(event.target as Node | null)) {
      this.hide();
    }
  };

  show(): void {
    this.hide();
    const content = this.appTooltip();
    if (content === null) {
      return;
    }
    const container = this.host.nativeElement.closest<HTMLElement>('.game') ?? this.document.body;
    this.bubble = this.render(content);
    container.appendChild(this.bubble);
    this.place(container);
    this.document.addEventListener('pointerdown', this.outsidePress, true);
    this.restartIdleTimer();
  }

  hide(): void {
    this.bubble?.remove();
    this.bubble = null;
    this.document.removeEventListener('pointerdown', this.outsidePress, true);
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /** Repart de 2 s à chaque interaction avec l'élément. */
  restartIdleTimer(): void {
    if (this.bubble === null) {
      return;
    }
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
    }
    this.idleTimer = setTimeout(() => this.hide(), IDLE_HIDE_MS);
  }

  /** Sur écran tactile, il n'y a pas de survol : un appui montre l'infobulle. */
  onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      this.show();
    }
  }

  ngOnDestroy(): void {
    this.hide();
  }

  private render(content: TooltipContent): HTMLElement {
    const bubble = this.document.createElement('div');
    bubble.className = 'tooltip';
    bubble.setAttribute('role', 'tooltip');
    if (typeof content === 'string') {
      bubble.textContent = content;
      return bubble;
    }
    bubble.classList.add('tooltip-card');
    const title = this.document.createElement('strong');
    title.className = 'tooltip-title';
    title.textContent = content.title;
    bubble.appendChild(title);
    if (content.badge) {
      const badge = this.document.createElement('span');
      badge.className = 'tooltip-badge';
      badge.dataset['tier'] = content.badge.tier;
      badge.textContent = content.badge.label;
      bubble.appendChild(badge);
    }
    for (const text of content.lines) {
      const line = this.document.createElement('span');
      line.className = 'tooltip-line';
      line.textContent = text;
      bubble.appendChild(line);
    }
    return bubble;
  }

  /** Au-dessus de l'élément si la place le permet, sinon en dessous ; toujours dans le cadre. */
  private place(container: HTMLElement): void {
    if (!this.bubble) {
      return;
    }
    const frame = container.getBoundingClientRect();
    const target = this.host.nativeElement.getBoundingClientRect();
    const bubble = this.bubble.getBoundingClientRect();
    const centeredLeft = target.left + target.width / 2 - bubble.width / 2 - frame.left;
    const left = Math.min(Math.max(centeredLeft, EDGE_PX), frame.width - bubble.width - EDGE_PX);
    const above = target.top - frame.top - bubble.height - GAP_PX;
    const top = above >= EDGE_PX ? above : target.bottom - frame.top + GAP_PX;
    this.bubble.style.left = `${left}px`;
    this.bubble.style.top = `${top}px`;
  }
}
