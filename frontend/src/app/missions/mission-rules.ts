// Règles pures des missions, inspirées de Legends of Mushroom : une mission principale à la fois,
// qui s'enchaîne sans fin, et quatre missions du jour. Elles sont la source principale d'éclats de géode.
import { STAGES_PER_ZONE } from '../balance/balance';

/** Compteurs cumulés depuis le début de la partie, alimentés par les actions du joueur. */
export const COUNTER_IDS = ['rocksBroken', 'itemsForged', 'itemsSold', 'segmentsPaid'] as const;
export type CounterId = (typeof COUNTER_IDS)[number];
export type Counters = Readonly<Record<CounterId, number>>;

/** Jauges lues sur l'état du jeu : elles ne repartent jamais de zéro. */
export type GaugeId = 'stagesReached' | 'pickaxeLevel';
export type Gauges = Readonly<Record<GaugeId, number>>;

export const EMPTY_COUNTERS: Counters = { rocksBroken: 0, itemsForged: 0, itemsSold: 0, segmentsPaid: 0 };

export interface MissionReward {
  readonly shards: number;
  readonly gold: number;
}

export interface MissionDef {
  readonly id: string;
  readonly label: string;
  /** Un compteur se mesure depuis le début de la mission ; une jauge se lit telle quelle. */
  readonly metric: { readonly kind: 'counter'; readonly id: CounterId } | { readonly kind: 'gauge'; readonly id: GaugeId };
  readonly target: number;
  readonly reward: MissionReward;
}

// ─── Missions principales ──────────────────────────────────────────────────

/** Cycle de 6 missions qui revient avec des objectifs plus grands à chaque tour. */
const MAIN_TEMPLATES: readonly ((round: number) => Omit<MissionDef, 'id'>)[] = [
  (round) => counterMission('rocksBroken', 1 + 4 * round, (n) => (n === 1 ? 'Casse un rocher' : `Casse ${n} rochers`), 4),
  (round) => counterMission('itemsForged', 2 + round, (n) => `Forge ${n} objets`, 3),
  (round) => {
    const target = 5 + 6 * round;
    return { label: `Atteins l'étape ${stageName(target)}`, metric: { kind: 'gauge', id: 'stagesReached' }, target, reward: shardsOnly(5) };
  },
  (round) => counterMission('segmentsPaid', 3 + 2 * round, (n) => `Paie ${n} segments de pioche`, 4),
  (round) => counterMission('itemsSold', 1 + round, (n) => (n === 1 ? 'Vends un objet' : `Vends ${n} objets`), 3),
  (round) => {
    const target = 2 + round;
    return { label: `Monte la pioche au niveau ${target}`, metric: { kind: 'gauge', id: 'pickaxeLevel' }, target, reward: shardsOnly(6) };
  },
];

/** Mission principale numéro `index` (à partir de 0). La récompense grandit d'un éclat tous les 2 tours. */
export function mainMission(index: number): MissionDef {
  const round = Math.floor(index / MAIN_TEMPLATES.length);
  const mission = MAIN_TEMPLATES[index % MAIN_TEMPLATES.length](round);
  const bonus = Math.floor(round / 2);
  return { ...mission, id: `main-${index}`, reward: { ...mission.reward, shards: mission.reward.shards + bonus } };
}

// ─── Missions du jour ──────────────────────────────────────────────────────

export const DAILY_MISSIONS: readonly MissionDef[] = [
  { id: 'daily-rocks', ...counterMission('rocksBroken', 20, (n) => `Casse ${n} rochers`, 5) },
  { id: 'daily-forge', ...counterMission('itemsForged', 5, (n) => `Forge ${n} objets`, 5) },
  { id: 'daily-segments', ...counterMission('segmentsPaid', 5, (n) => `Paie ${n} segments de pioche`, 4) },
  { id: 'daily-sell', ...counterMission('itemsSold', 3, (n) => `Vends ${n} objets`, 3) },
];

/** Coffre offert quand toutes les missions du jour sont récupérées. */
export const DAILY_CHEST_REWARD: MissionReward = { shards: 10, gold: 0 };

// ─── Avancement ────────────────────────────────────────────────────────────

/** Avancement d'une mission, plafonné à son objectif. */
export function missionProgress(mission: MissionDef, counters: Counters, baseline: Counters, gauges: Gauges): number {
  const value =
    mission.metric.kind === 'counter'
      ? counters[mission.metric.id] - baseline[mission.metric.id]
      : gauges[mission.metric.id];
  return Math.min(Math.max(value, 0), mission.target);
}

export function isComplete(mission: MissionDef, counters: Counters, baseline: Counters, gauges: Gauges): boolean {
  return missionProgress(mission, counters, baseline, gauges) >= mission.target;
}

/** Jour local au format AAAA-MM-JJ : les missions du jour changent à minuit, heure du joueur. */
export function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isValidCounters(value: unknown): value is Counters {
  return (
    typeof value === 'object' &&
    value !== null &&
    COUNTER_IDS.every((id) => {
      const count = (value as Record<string, unknown>)[id];
      return Number.isSafeInteger(count) && (count as number) >= 0;
    })
  );
}

function counterMission(
  id: CounterId,
  target: number,
  label: (target: number) => string,
  shards: number,
): Omit<MissionDef, 'id'> {
  return { label: label(target), metric: { kind: 'counter', id }, target, reward: shardsOnly(shards) };
}

function shardsOnly(shards: number): MissionReward {
  return { shards, gold: 0 };
}

/** « 5 » → « 1-5 », « 16 » → « 2-1 ». */
function stageName(stagesReached: number): string {
  const zone = Math.floor((stagesReached - 1) / STAGES_PER_ZONE) + 1;
  const stage = ((stagesReached - 1) % STAGES_PER_ZONE) + 1;
  return `${zone}-${stage}`;
}
