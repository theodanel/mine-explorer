import { Component, computed, DestroyRef, ElementRef, inject, output, signal, viewChild } from '@angular/core';

import { GoogleButton } from '../google-button/google-button';
import { OnlineAccount } from '../online-account';
import { OnlineApi } from '../online-api';
import { CHAT_PHRASES, ChatMessage, chatPhraseText, isChatMessages } from './chat-phrases';

/** La discussion est relue toutes les 8 s tant qu'elle est ouverte, jamais en arrière-plan. */
const REFRESH_MS = 8000;
/** Même délai que le serveur entre deux messages (ChatService.COOLDOWN). */
const COOLDOWN_MS = 5000;
const TIME_FORMAT = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

interface ShownMessage {
  readonly id: number;
  readonly pseudo: string;
  readonly text: string;
  readonly time: string;
  readonly mine: boolean;
}

/**
 * Discussion entre joueurs, faite de phrases prédéfinies : tout le monde lit, un joueur connecté choisit une phrase
 * à envoyer. Ouverte depuis la bulle en haut à gauche de la mine.
 */
@Component({
  selector: 'app-chat-page',
  imports: [GoogleButton],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.scss',
})
export class ChatPage {
  private readonly api = inject(OnlineApi);
  protected readonly account = inject(OnlineAccount);
  readonly closed = output();

  protected readonly phrases = CHAT_PHRASES;
  private readonly messages = signal<readonly ChatMessage[] | null>(null);
  protected readonly failed = signal(false);
  protected readonly cooling = signal(false);
  protected readonly notice = signal<string | null>(null);
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');

  protected readonly shown = computed<readonly ShownMessage[] | null>(() => {
    const messages = this.messages();
    if (messages === null) {
      return null;
    }
    return messages.flatMap((message) => {
      const text = chatPhraseText(message.phrase);
      return text === null
        ? []
        : [{ id: message.id, pseudo: message.pseudo, text, time: TIME_FORMAT.format(new Date(message.sentAt)), mine: message.mine }];
    });
  });

  constructor() {
    void this.refresh();
    const timer = setInterval(() => void this.refresh(), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected async send(key: string): Promise<void> {
    if (this.cooling()) {
      return;
    }
    this.cooling.set(true);
    setTimeout(() => this.cooling.set(false), COOLDOWN_MS);
    const result = await this.api.write('POST', '/api/chat', { phrase: key });
    if (result.ok) {
      this.notice.set(null);
      await this.refresh();
    } else {
      this.notice.set(result.code === 'chat-too-fast' ? 'Doucement : un message toutes les 5 secondes.' : 'Message non envoyé, réessaie.');
    }
  }

  protected close(): void {
    this.closed.emit();
  }

  private async refresh(): Promise<void> {
    const result = await this.api.get('/api/chat');
    if (result.ok && isChatMessages(result.body)) {
      const previousLast = this.messages()?.at(-1)?.id;
      this.messages.set(result.body.messages);
      this.failed.set(false);
      if (result.body.messages.at(-1)?.id !== previousLast) {
        // Nouveau message : on descend tout en bas une fois la liste redessinée
        setTimeout(() => this.list()?.nativeElement.scrollTo({ top: this.list()?.nativeElement.scrollHeight ?? 0 }));
      }
    } else {
      this.failed.set(true);
    }
  }
}
