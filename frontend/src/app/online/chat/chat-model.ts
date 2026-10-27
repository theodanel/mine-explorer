// Discussion entre joueurs, en texte libre : données reçues du serveur, petits emojis à insérer, messages d'erreur.
// Le serveur filtre chaque message (backend/.../chat/ChatRules.java) ; le jeu ne fait qu'aider le joueur.

import { SLOT_IDS, SlotId, STAT_IDS, StatId, TIER_IDS, TierId } from '../../equipment/equipment.model';

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
  /** Identifiant du titre porté par l'auteur (succès), absent d'un serveur plus ancien. */
  readonly title?: string | null;
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
    typeof message.mine === 'boolean' &&
    (message.title === undefined || message.title === null || typeof message.title === 'string')
  );
}

/** Une pièce portée par l'auteur d'un message, telle que le serveur la montre (liste blanche). */
export interface ProfilePiece {
  readonly slot: SlotId;
  readonly tier: TierId;
  readonly level: number;
  readonly stats: Readonly<Partial<Record<StatId, number>>>;
  /** Éveil du Divin corrompu (0 hors Divin). */
  readonly awakening: number;
}

/** Profil public de l'auteur d'un message : jamais d'identifiant de joueur. */
export interface AuthorProfile {
  readonly pseudo: string;
  readonly title: string | null;
  readonly zone: number;
  /** Rang d'évolution du mineur (0 : Apprenti). */
  readonly form: number;
  readonly equipment: readonly ProfilePiece[];
}

export function isAuthorProfile(value: unknown): value is AuthorProfile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const profile = value as Partial<Record<keyof AuthorProfile, unknown>>;
  return (
    typeof profile.pseudo === 'string' &&
    (profile.title === null || profile.title === undefined || typeof profile.title === 'string') &&
    Number.isSafeInteger(profile.zone) &&
    Number.isSafeInteger(profile.form) &&
    Array.isArray(profile.equipment) &&
    profile.equipment.every(isProfilePiece)
  );
}

function isProfilePiece(value: unknown): value is ProfilePiece {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const piece = value as Partial<Record<keyof ProfilePiece, unknown>>;
  return (
    (SLOT_IDS as readonly unknown[]).includes(piece.slot) &&
    (TIER_IDS as readonly unknown[]).includes(piece.tier) &&
    Number.isSafeInteger(piece.level) &&
    Number.isSafeInteger(piece.awakening) &&
    typeof piece.stats === 'object' &&
    piece.stats !== null &&
    Object.entries(piece.stats).every(([stat, amount]) => (STAT_IDS as readonly string[]).includes(stat) && typeof amount === 'number')
  );
}

/** Messages des autres arrivés depuis le dernier lu, et le dernier message visible. */
export interface ChatUnreadCount {
  readonly count: number;
  readonly lastId: number;
}

export function isChatUnreadCount(value: unknown): value is ChatUnreadCount {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const unread = value as Partial<Record<keyof ChatUnreadCount, unknown>>;
  return Number.isSafeInteger(unread.count) && Number.isSafeInteger(unread.lastId);
}
