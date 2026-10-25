import { Component, computed, DestroyRef, ElementRef, inject, output, signal, viewChild } from '@angular/core';

import { GoogleButton } from '../google-button/google-button';
import { AuthorCard } from './author-card';
import { ChatUnread } from './chat-unread';
import { OnlineAccount } from '../online-account';
import { OnlineApi } from '../online-api';
import { CHAT_EMOJIS, CHAT_MAX_LENGTH, ChatView, chatLength, chatRefusalText, isChatView } from './chat-model';
import { titleOf } from '../../achievements/achievement-rules';

/** La discussion est relue toutes les 6 s tant qu'elle est ouverte, jamais en arrière-plan. */
const REFRESH_MS = 6000;
const TIME_FORMAT = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

/**
 * Discussion entre joueurs : tout le monde lit ; un joueur connecté écrit ce qu'il veut (200 caractères, petits
 * emojis), signale un message gênant ; un modérateur retire un message ou coupe son auteur. Le serveur filtre tout.
 * Ouverte depuis la bulle en haut à gauche de la mine.
 */
@Component({
  selector: 'app-chat-page',
  imports: [GoogleButton, AuthorCard],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.scss',
})
export class ChatPage {
  private readonly api = inject(OnlineApi);
  protected readonly account = inject(OnlineAccount);
  private readonly unread = inject(ChatUnread);
  readonly closed = output();

  protected readonly emojis = CHAT_EMOJIS;
  protected readonly maxLength = CHAT_MAX_LENGTH;
  private readonly view = signal<ChatView | null>(null);
  protected readonly failed = signal(false);
  protected readonly draft = signal('');
  protected readonly sending = signal(false);
  protected readonly emojisOpen = signal(false);
  protected readonly notice = signal<string | null>(null);
  /** Message dont on regarde l'auteur : sa fiche s'ouvre par-dessus la discussion. */
  protected readonly authorOf = signal<number | null>(null);
  /** Messages signalés pendant cette visite : le bouton devient « Signalé ». */
  protected readonly reported = signal<ReadonlySet<number>>(new Set());
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');

  protected readonly canWrite = computed(() => this.view()?.canWrite ?? false);
  protected readonly moderator = computed(() => this.view()?.moderator ?? false);
  protected readonly remaining = computed(() => CHAT_MAX_LENGTH - chatLength(this.draft()));
  protected readonly canSend = computed(() => !this.sending() && this.draft().trim() !== '' && this.remaining() >= 0);
  protected readonly messages = computed(() =>
    this.view()?.messages.map((message) => ({
      ...message,
      time: TIME_FORMAT.format(new Date(message.sentAt)),
      titleLabel: titleOf(message.title ?? null),
      initial: [...message.pseudo.trim()][0]?.toUpperCase() ?? '?',
      hue: avatarHue(message.pseudo),
    })) ?? null,
  );

  constructor() {
    void this.refresh();
    const timer = setInterval(() => void this.refresh(), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected addEmoji(emoji: string): void {
    if (chatLength(this.draft() + emoji) <= CHAT_MAX_LENGTH) {
      this.draft.update((text) => text + emoji);
    }
    this.input()?.nativeElement.focus();
  }

  protected async send(): Promise<void> {
    if (!this.canSend()) {
      return;
    }
    this.sending.set(true);
    const result = await this.api.write('POST', '/api/chat', { text: this.draft() });
    this.sending.set(false);
    if (result.ok) {
      this.draft.set('');
      this.notice.set(null);
      this.emojisOpen.set(false);
      await this.refresh();
    } else {
      this.notice.set(chatRefusalText(result.code));
    }
  }

  protected async report(id: number): Promise<void> {
    const result = await this.api.write('POST', `/api/chat/${id}/report`);
    if (result.ok) {
      this.reported.update((ids) => new Set([...ids, id]));
      await this.refresh();
    }
  }

  protected async remove(id: number): Promise<void> {
    await this.api.write('DELETE', `/api/chat/${id}`);
    await this.refresh();
  }

  protected async muteAuthor(id: number): Promise<void> {
    await this.api.write('POST', `/api/chat/${id}/mute-author`);
    await this.refresh();
  }

  protected close(): void {
    this.closed.emit();
  }

  private async refresh(): Promise<void> {
    const result = await this.api.get('/api/chat');
    if (result.ok && isChatView(result.body)) {
      const previousLast = this.view()?.messages.at(-1)?.id;
      this.view.set(result.body);
      this.failed.set(false);
      const lastId = result.body.messages.at(-1)?.id;
      if (lastId !== undefined) {
        this.unread.markRead(lastId);
      }
      if (result.body.messages.at(-1)?.id !== previousLast) {
        // Nouveau message : on descend tout en bas une fois la liste redessinée
        setTimeout(() => {
          const list = this.list()?.nativeElement;
          list?.scrollTo({ top: list.scrollHeight });
        });
      }
    } else {
      this.failed.set(true);
    }
  }
}

/** Teinte de la bulle d'un joueur : toujours la même pour un pseudo, pour le reconnaître d'un coup d'œil. */
function avatarHue(pseudo: string): number {
  let hash = 0;
  for (const char of pseudo) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 360;
  }
  return hash;
}
