// Règles pures du jeu en ligne : quelles clés partent dans le cloud, et lecture prudente des réponses du serveur.

/** Préfixe des clés de la partie dans le localStorage : tout ce qui commence ainsi est envoyé au cloud. */
export const SAVE_KEY_PREFIX = 'mine-explorer.';
/** Même règle que le serveur (SaveController.KEY_PATTERN) : une clé refusée là-bas ferait échouer tout l'envoi. */
const SAVE_KEY_PATTERN = /^mine-explorer\.[a-z0-9-]{1,40}$/;

export type SaveData = Readonly<Record<string, string>>;

export interface Profile {
  readonly pseudo: string;
  readonly createdAt: string;
  readonly providers: readonly string[];
}

export interface CloudSave {
  readonly version: number;
  readonly updatedAt: string;
  readonly data: SaveData;
}

export interface SaveReceipt {
  readonly version: number;
  readonly updatedAt: string;
}

export interface LeaderboardEntry {
  readonly rank: number;
  readonly pseudo: string;
  readonly value: number;
}

export interface Leaderboard {
  readonly top: readonly LeaderboardEntry[];
  readonly me: LeaderboardEntry | null;
}

export type LeaderboardType = 'depth' | 'abyss';

export function isSaveKey(key: string): boolean {
  return SAVE_KEY_PATTERN.test(key);
}

/** Partie à envoyer : les clés du jeu présentes dans le stockage. */
export function collectSave(entries: Iterable<readonly [string, string]>): SaveData {
  const data: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (isSaveKey(key)) {
      data[key] = value;
    }
  }
  return data;
}

/** Étiquette « zone-étape » d'une partie, pour aider le joueur à choisir entre deux parties. */
export function progressLabel(data: SaveData): string {
  const raw = data[`${SAVE_KEY_PREFIX}progress`];
  if (raw === undefined) {
    return '1-1';
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isRecord(value) && isPositiveInteger(value['zone']) && isPositiveInteger(value['stage'])) {
      return `${value['zone']}-${value['stage']}`;
    }
  } catch {
    // Valeur illisible : traitée comme une partie neuve juste en dessous
  }
  return '1-1';
}

export function isProfile(value: unknown): value is Profile {
  return (
    isRecord(value) &&
    typeof value['pseudo'] === 'string' &&
    typeof value['createdAt'] === 'string' &&
    Array.isArray(value['providers']) &&
    value['providers'].every((provider) => typeof provider === 'string')
  );
}

export function isCloudSave(value: unknown): value is CloudSave {
  return isRecord(value) && isSaveReceipt(value) && isStringRecord(value['data']);
}

export function isSaveReceipt(value: unknown): value is SaveReceipt {
  return isRecord(value) && Number.isSafeInteger(value['version']) && typeof value['updatedAt'] === 'string';
}

export function isLeaderboard(value: unknown): value is Leaderboard {
  return (
    isRecord(value) &&
    Array.isArray(value['top']) &&
    value['top'].every(isLeaderboardEntry) &&
    (value['me'] === null || isLeaderboardEntry(value['me']))
  );
}

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  return (
    isRecord(value) &&
    isPositiveInteger(value['rank']) &&
    typeof value['pseudo'] === 'string' &&
    Number.isSafeInteger(value['value'])
  );
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}
