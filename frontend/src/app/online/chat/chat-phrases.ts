// Phrases de la discussion entre joueurs. Aucun texte libre : rien à modérer, ni insulte ni information personnelle.
// Les clés doivent rester celles du serveur (backend/.../chat/ChatPhrase.java) ; seul le texte affiché vit ici.

export interface ChatPhrase {
  readonly key: string;
  readonly text: string;
}

export const CHAT_PHRASES: readonly ChatPhrase[] = [
  { key: 'hello', text: 'Salut les mineurs ! 👋' },
  { key: 'gg', text: 'Bien joué ! 🎉' },
  { key: 'thanks', text: 'Merci ! 🙏' },
  { key: 'good-luck', text: 'Bonne chance ! 🍀' },
  { key: 'zone-cleared', text: 'Zone terminée ! ⛏️' },
  { key: 'evolved', text: 'Je viens d’évoluer ! ✨' },
  { key: 'legendary', text: 'Objet légendaire forgé ! 🔥' },
  { key: 'abyss', text: 'Qui descend au Puits ? 🕳️' },
  { key: 'abyss-record', text: 'Nouveau record au Puits ! 🏆' },
  { key: 'stuck', text: 'Je bloque sur un filon… 😅' },
  { key: 'tip-pickaxe', text: 'Astuce : améliore ta pioche ! 💡' },
  { key: 'companion', text: 'Mon compagnon a éclos ! 🐣' },
  { key: 'laugh', text: 'Haha ! 😂' },
  { key: 'wow', text: 'Waouh ! 😮' },
  { key: 'see-you', text: 'À plus tard ! 👋' },
];

const TEXT_BY_KEY = new Map(CHAT_PHRASES.map((phrase) => [phrase.key, phrase.text]));

/** Texte d'une phrase reçue du serveur, ou null si le jeu ne la connaît pas (version plus ancienne du jeu). */
export function chatPhraseText(key: string): string | null {
  return TEXT_BY_KEY.get(key) ?? null;
}

export interface ChatMessage {
  readonly id: number;
  readonly pseudo: string;
  readonly phrase: string;
  readonly sentAt: string;
  readonly mine: boolean;
}

export function isChatMessages(value: unknown): value is { readonly messages: readonly ChatMessage[] } {
  if (typeof value !== 'object' || value === null || !Array.isArray((value as { messages?: unknown }).messages)) {
    return false;
  }
  return (value as { messages: unknown[] }).messages.every(
    (message) =>
      typeof message === 'object' &&
      message !== null &&
      Number.isSafeInteger((message as ChatMessage).id) &&
      typeof (message as ChatMessage).pseudo === 'string' &&
      typeof (message as ChatMessage).phrase === 'string' &&
      typeof (message as ChatMessage).sentAt === 'string' &&
      typeof (message as ChatMessage).mine === 'boolean',
  );
}
