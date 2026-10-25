import { computed, DestroyRef, DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';

import { Navigation } from '../../navigation/navigation';
import { readStorage, writeStorage } from '../../shared/local-storage';
import { OnlineApi } from '../online-api';
import { ONLINE_CONFIG } from '../online-config';
import { isChatUnreadCount } from './chat-model';

const STORAGE_KEY = 'mine-explorer.chat-lu';
/** Relevé des nouveaux messages, onglet visible et discussion fermée seulement : une requête légère. */
const POLL_MS = 30_000;
/** Au-delà, la pastille affiche « 9+ ». */
const MAX_SHOWN = 9;

/**
 * Pastille de la bulle de discussion : le nombre de messages des autres arrivés depuis la dernière lecture. Le
 * dernier message lu est gardé dans le navigateur ; au tout premier relevé, l'historique compte comme lu.
 */
@Injectable({ providedIn: 'root' })
export class ChatUnread {
  private readonly api = inject(OnlineApi);
  private readonly navigation = inject(Navigation);
  private readonly document = inject(DOCUMENT);
  private readonly lastRead = signal<number | null>(loadLastRead());
  private readonly count = signal(0);

  /** Texte de la pastille, ou null quand il n'y a rien de nouveau. */
  readonly badge = computed(() => {
    const count = this.count();
    if (count <= 0) {
      return null;
    }
    return count > MAX_SHOWN ? `${MAX_SHOWN}+` : String(count);
  });

  constructor() {
    if (!inject(ONLINE_CONFIG).enabled) {
      return;
    }
    const timer = setInterval(() => void this.poll(), POLL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    void this.poll();
    // En revenant de la discussion, on relève tout de suite : ce qu'on vient de lire ne compte plus
    effect(() => {
      if (this.navigation.page() !== 'chat') {
        void this.poll();
      }
    });
  }

  /** La discussion vient d'afficher ce message : tout ce qui précède est lu. */
  markRead(lastId: number): void {
    this.count.set(0);
    if (lastId > (this.lastRead() ?? 0)) {
      this.lastRead.set(lastId);
      writeStorage(STORAGE_KEY, String(lastId));
    }
  }

  private async poll(): Promise<void> {
    if (this.document.hidden || this.navigation.page() === 'chat') {
      return;
    }
    const lastRead = this.lastRead();
    const result = await this.api.get(`/api/chat/unread?after=${lastRead ?? 0}`);
    if (!result.ok || !isChatUnreadCount(result.body)) {
      // Serveur injoignable : la pastille garde sa valeur, le prochain relevé réessaiera
      return;
    }
    if (lastRead === null) {
      this.markRead(result.body.lastId);
      return;
    }
    this.count.set(result.body.count);
  }
}

function loadLastRead(): number | null {
  const raw = readStorage(STORAGE_KEY);
  const id = raw === null ? Number.NaN : Number(raw);
  return Number.isSafeInteger(id) && id >= 0 ? id : null;
}
