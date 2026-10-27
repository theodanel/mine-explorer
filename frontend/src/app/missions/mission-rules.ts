// Règles pures des missions, inspirées de Legends of Mushroom : une mission principale à la fois,
// qui s'enchaîne sans fin, et trois missions du jour avec un coffre. Elles complètent les éclats gagnés en minant.
import { ABYSS_UNLOCK_FORM } from '../balance/abyss';
import { EVOLUTION_FORMS, type EvolutionId, MAX_PICKAXE_LEVEL } from '../balance/balance';
import { COMPANIONS_UNLOCK_ZONE } from '../balance/companions';
import { WORKSHOP_UNLOCK_FORM } from '../balance/workshop';

/**
 * Compteurs cumulés depuis le début de la partie, alimentés par les actions du joueur.
 * « rocksBroken » compte les filons épuisés (un filon = un rocher). L'identifiant reste celui-ci
 * pour ne pas invalider les sauvegardes existantes ; seuls les libellés parlent de filons.
 */
export const COUNTER_IDS = [
  'rocksBroken',
  'itemsForged',
  'itemsSold',
  'segmentsPaid',
  'eventsTouched',
  'workshopUpgrades',
  'adventureRuns',
  'expeditionsSent',
] as const;
export type CounterId = (typeof COUNTER_IDS)[number];
export type Counters = Readonly<Record<CounterId, number>>;

/** Jauges lues sur l'état du jeu : elles ne repartent jamais de zéro. */
export type GaugeId = 'stagesReached' | 'pickaxeLevel';
export type Gauges = Readonly<Record<GaugeId, number>>;

export const EMPTY_COUNTERS: Counters = {
  rocksBroken: 0,
  itemsForged: 0,
  itemsSold: 0,
  segmentsPaid: 0,
  eventsTouched: 0,
  workshopUpgrades: 0,
  adventureRuns: 0,
  expeditionsSent: 0,
};

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
  /** Mission du jour liée à un menu : elle n'apparaît qu'une fois ce menu ouvert. */
  readonly unlock?: { readonly form: EvolutionId } | { readonly zone: number };
  readonly reward: MissionReward;
}

// La mission principale a été retirée le 28/10/2026 (Théo) : le Carnet d'aventure tient ce rôle.

// ─── Missions du jour ──────────────────────────────────────────────────────

/**
 * Faisables en une courte session à tout moment de la partie : en profondeur, un filon peut durer
 * plus d'une demi-heure et un segment de pioche plusieurs jours d'or, donc ni « 20 filons » ni « 5 segments ».
 */
export const DAILY_MISSIONS: readonly MissionDef[] = [
  { id: 'daily-rocks', ...counterMission('rocksBroken', 1, () => 'Épuise un filon', 6) },
  { id: 'daily-forge', ...counterMission('itemsForged', 10, (n) => `Forge ${n} objets`, 6) },
  { id: 'daily-sell', ...counterMission('itemsSold', 5, (n) => `Vends ${n} objets`, 5) },
  // Plus de missions, chacune liée à un pan du jeu (demande de Théo, 14/10/2026) : la forge manquait d'éclats
  { id: 'daily-events', ...counterMission('eventsTouched', 3, (n) => `Touche ${n} événements de mine`, 6) },
  { id: 'daily-workshop', ...counterMission('workshopUpgrades', 3, (n) => `Renforce ${n} fois à l'Atelier`, 8), unlock: { form: WORKSHOP_UNLOCK_FORM } },
  { id: 'daily-adventure', ...counterMission('adventureRuns', 1, () => 'Joue une aventure (Puits ou Chasse au filon)', 8), unlock: { form: ABYSS_UNLOCK_FORM } },
  { id: 'daily-expedition', ...counterMission('expeditionsSent', 1, () => 'Envoie un compagnon en expédition', 6), unlock: { zone: COMPANIONS_UNLOCK_ZONE } },
];

/** Coffre offert quand toutes les missions du jour sont récupérées. */
export const DAILY_CHEST_REWARD: MissionReward = { shards: 15, gold: 0 };

/** Missions du jour ouvertes à ce joueur, selon sa forme et sa zone. */
export function availableDailyMissions(formIndex: number, zone: number): readonly MissionDef[] {
  return DAILY_MISSIONS.filter((mission) => {
    const unlock = mission.unlock;
    if (unlock === undefined) {
      return true;
    }
    return 'zone' in unlock ? zone >= unlock.zone : formIndex >= EVOLUTION_FORMS.findIndex((form) => form.id === unlock.form);
  });
}

// ─── Avancement ────────────────────────────────────────────────────────────

/** Avancement d'une mission, plafonné à son objectif. */
export function missionProgress(mission: MissionDef, counters: Counters, baseline: Counters, gauges: Gauges): number {
  // Pioche au niveau maximum : plus aucun segment à payer, la mission ne doit pas bloquer la chaîne
  if (mission.metric.kind === 'counter' && mission.metric.id === 'segmentsPaid' && gauges.pickaxeLevel >= MAX_PICKAXE_LEVEL) {
    return mission.target;
  }
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

/**
 * Complète une sauvegarde de compteurs écrite avant l'ajout d'un compteur : le nouveau part de zéro.
 * Sans ça, une mise à jour du jeu invaliderait les missions et le défi des joueurs existants.
 */
export function completeCounters(value: unknown): unknown {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? { ...EMPTY_COUNTERS, ...value } : value;
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
