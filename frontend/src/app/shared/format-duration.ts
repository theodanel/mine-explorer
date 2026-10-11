const SECOND_MS = 1000;
const MINUTE_S = 60;
const HOUR_S = 60 * MINUTE_S;
const DAY_S = 24 * HOUR_S;

/** Durée lisible et courte : « 45 s », « 12 min 05 », « 3 h 20 », « 2 j 4 h ». */
export function formatDuration(ms: number): string {
  const seconds = Math.ceil(Math.max(ms, 0) / SECOND_MS);
  if (seconds < MINUTE_S) {
    return `${seconds} s`;
  }
  if (seconds < HOUR_S) {
    return `${Math.floor(seconds / MINUTE_S)} min ${pad(seconds % MINUTE_S)}`;
  }
  if (seconds < DAY_S) {
    return `${Math.floor(seconds / HOUR_S)} h ${pad(Math.floor((seconds % HOUR_S) / MINUTE_S))}`;
  }
  return `${Math.floor(seconds / DAY_S)} j ${Math.floor((seconds % DAY_S) / HOUR_S)} h`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
