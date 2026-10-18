// Discussion entre joueurs, en texte libre : données reçues du serveur, petits emojis à insérer, messages d'erreur.
// Le serveur filtre chaque message (backend/.../chat/ChatRules.java) ; le jeu ne fait qu'aider le joueur.

/** Même limite que le serveur (ChatRules.MAX_LENGTH), comptée en caractères visibles. */
export const CHAT_MAX_LENGTH = 200;

/** Petits emojis proposés sous le champ de saisie, dans l'ambiance de la mine. */
export const CHAT_EMOJIS: readonly string[] = [
  '😀', '😂', '😅', '😮', '😢', '😡', '🥳', '😎',
  '👍', '👏', '🙏', '👋', '💪', '🎉', '❤️', '🔥',
  '⛏️', '💎', '🪙', '🏆', '⭐', '✨', '🐣', '🕳️',
];

export interface ChatMessage {
  readonly id: number;
  readonly pseudo: string;
  readonly text: string;
  readonly sentAt: string;
  readonly mine: boolean;
}

export interface ChatView {
  readonly messages: readonly ChatMessage[];
  /** Connecté et pas coupé de la discussion. */
  readonly canWrite: boolean;
  readonly moderator: boolean;
}

/** Longueur comme le serveur la compte : un emoji ou une lettre accentuée vaut un caractère. */
export function chatLength(text: string): number {
  return [...text].length;
}

/** Explication à montrer au joueur quand le serveur refuse son message. */
export function chatRefusalText(code: string | null): string {
  switch (code) {
    case 'chat-too-fast':
      return 'Doucement : un message toutes les 5 secondes.';
    case 'chat-link':
      return 'Les liens ne sont pas autorisés.';
    case 'chat-personal-info':
      return 'Ne partage ni adresse e-mail ni numéro de téléphone.';
    case 'chat-too-long':
      return `${CHAT_MAX_LENGTH} caractères au plus.`;
    case 'chat-muted':
      return 'Un modérateur t’a retiré la parole dans la discussion.';
    case 'chat-empty':
      return 'Écris quelque chose avant d’envoyer.';
    default:
      return 'Message non envoyé, réessaie.';
  }
}

export function isChatView(value: unknown): value is ChatView {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const view = value as Partial<Record<keyof ChatView, unknown>>;
  return (
    typeof view.canWrite === 'boolean' &&
    typeof view.moderator === 'boolean' &&
    Array.isArray(view.messages) &&
    view.messages.every(isChatMessage)
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const message = value as Partial<Record<keyof ChatMessage, unknown>>;
  return (
    Number.isSafeInteger(message.id) &&
    typeof message.pseudo === 'string' &&
    typeof message.text === 'string' &&
    typeof message.sentAt === 'string' &&
    typeof message.mine === 'boolean'
  );
}
