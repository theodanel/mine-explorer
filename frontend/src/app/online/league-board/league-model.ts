// Ce que renvoie GET /api/league, et sa vérification.

export const LEAGUES = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'LEGEND'] as const;
export type LeagueId = (typeof LEAGUES)[number];

export const LEAGUE_LABELS: Readonly<Record<LeagueId, string>> = {
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  DIAMOND: 'Diamant',
  LEGEND: 'Légende',
};

export interface LeagueRow {
  readonly rank: number;
  readonly pseudo: string;
  readonly title?: string | null;
  /** Filons gagnés depuis lundi. */
  readonly score: number;
  readonly mine: boolean;
}

export interface LeagueView {
  readonly league: LeagueId;
  /** Lundi suivant à 0 h, heure de Paris (date ISO). */
  readonly endsAt: string;
  readonly promote: number;
  readonly demote: number;
  readonly members: readonly LeagueRow[];
  readonly me: LeagueRow | null;
  readonly pending: { readonly shards: number; readonly from: LeagueId; readonly to: LeagueId } | null;
}

function isLeague(value: unknown): value is LeagueId {
  return (LEAGUES as readonly unknown[]).includes(value);
}

function isRow(value: unknown): value is LeagueRow {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(row['rank']) &&
    typeof row['pseudo'] === 'string' &&
    (row['title'] === undefined || row['title'] === null || typeof row['title'] === 'string') &&
    Number.isSafeInteger(row['score']) &&
    typeof row['mine'] === 'boolean'
  );
}

export function isLeagueView(value: unknown): value is LeagueView {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const view = value as Record<string, unknown>;
  const pending = view['pending'];
  const pendingValid =
    pending === null ||
    pending === undefined ||
    (typeof pending === 'object' &&
      Number.isSafeInteger((pending as Record<string, unknown>)['shards']) &&
      isLeague((pending as Record<string, unknown>)['from']) &&
      isLeague((pending as Record<string, unknown>)['to']));
  return (
    isLeague(view['league']) &&
    typeof view['endsAt'] === 'string' &&
    Number.isSafeInteger(view['promote']) &&
    Number.isSafeInteger(view['demote']) &&
    Array.isArray(view['members']) &&
    view['members'].every(isRow) &&
    (view['me'] === null || view['me'] === undefined || isRow(view['me'])) &&
    pendingValid
  );
}
