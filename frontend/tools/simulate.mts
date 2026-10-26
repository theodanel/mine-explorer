// Simulation de l'économie avec les vraies règles du jeu : forge, équipement, filons, pioche, missions, évolutions,
// absence, arbre de compétences, sorts en lancement automatique et artefacts.
// Lancement depuis frontend/ : node --import ./tools/register-ts.mjs tools/simulate.mts [profil] [jours] [--sans-nouveautes]
// Profils : continu (joue sans arrêt), assidu (6 sessions de 30 min par jour), regulier (4 sessions de 15 min par jour).
// --sans-nouveautes : sans arbre, sorts ni artefacts, pour mesurer ce qu'ils ajoutent.
import {
  DAILY_CHEST_REWARD,
  DAILY_MISSIONS,
  EMPTY_COUNTERS,
  isComplete,
  mainMission,
  type CounterId,
  type Counters,
} from '../src/app/missions/mission-rules.ts';
import {
  damagePerSecond,
  EVOLUTION_FORMS,
  evolutionStrikeMultiplier,
  FORGE_SHARD_COST,
  MAX_PICKAXE_LEVEL,
  offlineGains,
  ORE_FIND_CHANCE,
  SEGMENTS_PER_LEVEL,
  segmentCost,
  shardsForStage,
  upgradeDurationMs,
  ZONE_CLEAR_ORES,
  zoneClearShards,
  zoneMaterial,
  hitsPerSecond,
  powerOf,
  minedGold,
} from '../src/app/balance/balance.ts';
import { ARTIFACT_FIND_CHANCE, ARTIFACT_SLOT_FORMS, ARTIFACTS, type ArtifactId } from '../src/app/balance/artifacts.ts';
import {
  blastStrikeMultiplier,
  NO_BONUSES,
  shardEchoChance,
  SKILL_NODES,
  SPELL_SLOTS,
  spellCooldownMs,
  spellDurationMs,
  SPELLS,
  type SpellId,
} from '../src/app/balance/skill-tree.ts';
import { computeStats, powerDelta, resolveHit, rollItem, sellPrice } from '../src/app/equipment/equipment-rules.ts';
import type { EquippedItems, Item, MiningStats, TierId } from '../src/app/equipment/equipment.model.ts';
import { TIER_IDS } from '../src/app/equipment/equipment.model.ts';
import {
  applyDamage,
  BEFORE_GUARDIAN_STAGE,
  challengeGuardian,
  failGuardian,
  isGuardian,
  START_PROGRESS,
  stagesReached,
  type Progress,
} from '../src/app/progression/progression-rules.ts';
import { GUARDIAN_SECONDS } from '../src/app/balance/balance.ts';
import { learn, learnCheck, passiveBonuses, pointsEarned, pointsSpent, spellRank, type SkillRanks } from '../src/app/skills/skill-rules.ts';
import {
  addArtifact,
  canReforge,
  EMPTY_ARTIFACTS,
  equipArtifact,
  equippedArtifactBonuses,
  openSlotCount,
  reforge,
  reforgeOreCost,
  reforgeOresEach,
  resolveReforge,
  rollArtifact,
  type ArtifactState,
} from '../src/app/artifacts/artifact-rules.ts';
import { minerProfile, NO_BUFFS, type MinerProfile, type SpellBuffs } from '../src/app/miner/miner-rules.ts';
import { WORKSHOP_UNLOCK_FORM, type WorkshopLevels } from '../src/app/balance/workshop.ts';
import { pieceLevel, reinforce, upgradeCost, withLevel } from '../src/app/workshop/workshop-rules.ts';
import { canEvolve, objectivesFor, unclaimedShards } from '../src/app/evolution/evolution-rules.ts';
import { SLOT_IDS, type SlotId } from '../src/app/equipment/equipment.model.ts';
import { CRYSTAL_RAIN_COUNT, EVENT_TOUCH_RATE } from '../src/app/balance/mine-events.ts';
import { eventGain, nextEventDelayMs, rollEventId } from '../src/app/mine-events/mine-event-rules.ts';
import { GALLERIES, type GalleryId } from '../src/app/balance/galleries.ts';
import { rollOffer, scaleAmount } from '../src/app/galleries/gallery-rules.ts';
import { COMPANION_IDS, COMPANIONS, COMPANIONS_UNLOCK_ZONE, type CompanionId, zoneClearGivesEgg } from '../src/app/balance/companions.ts';
import { abilityBlastMultiplier, abilityBuffs, abilityCooldownMs, abilityDurationMs, combineBuffs } from '../src/app/companions/companion-ability-rules.ts';
import { CHALLENGE_MILESTONES } from '../src/app/balance/challenge.ts';
import { challengePoints } from '../src/app/challenge/challenge-rules.ts';
import { CHALLENGE_DAYS } from '../src/app/balance/challenge.ts';
import { BUILDING_IDS, CAMP_UNLOCK_ZONE, type BuildingId } from '../src/app/balance/camp.ts';
import { ABYSS_DAILY_RUNS, ABYSS_RUN_MS, ABYSS_UNLOCK_FORM } from '../src/app/balance/abyss.ts';
import { runReward } from '../src/app/abyss/abyss-rules.ts';
import { isOver, startGame, tap as abyssTap, tick as abyssTick, type Fighter } from '../src/app/abyss/abyss-game.ts';
import {
  buildingCost,
  buildingLevel,
  collectedAt,
  EMPTY_CAMP,
  isMaxLevel,
  offlineCapMs,
  tavernBonus,
  wellStock,
  type CampState,
} from '../src/app/camp/camp-rules.ts';
import {
  activeCompanionBonuses,
  addEgg,
  collectExpedition,
  EMPTY_COMPANIONS,
  raiseStar,
  nextStarCost,
  hatch,
  rollEggRarity,
  sendOnExpedition,
  setActive,
  type CompanionState,
} from '../src/app/companions/companion-rules.ts';
import {
  ABYSS_FLOORS_PER_ESSENCES,
  ALLIANCE_RECIPES,
  ESSENCE_ELEMENTS,
  ESSENCES,
  RING_SOCKETS,
  type EssenceId,
  type RuneType,
} from '../src/app/balance/heart-forge.ts';
import {
  addEssences,
  canCreate,
  canGrow,
  canSocket,
  createRune,
  EMPTY_HEART_FORGE,
  growCost,
  growRune,
  runeCount,
  socketRune,
  socketRuneIn,
  starRunesSet,
  type HeartForgeState,
} from '../src/app/heart-forge/heart-forge-rules.ts';
import { gearRuneBonuses, OpenSockets, setGearRune } from '../src/app/heart-forge/gear-runes-rules.ts';
import { AWAKENING_UNLOCK_FORM, awakeningCost, awakeningSockets, MAX_AWAKENING } from '../src/app/balance/awakening.ts';
import { activeAwakening, awaken, AwakeningState, EMPTY_AWAKENING, lowestAwakening, recordDuplicate } from '../src/app/equipment/awakening-rules.ts';
import { spendEssences } from '../src/app/heart-forge/heart-forge-rules.ts';
import { REBIRTH_MIN_ZONE, type RebirthBranch } from '../src/app/balance/rebirth.ts';
import { buy, canBuy, EMPTY_REBIRTH, rebirth, rebirthEffects, type RebirthState } from '../src/app/rebirth/rebirth-rules.ts';
import { GEAR_SOCKETS_TOTAL, gearSocketCount } from '../src/app/balance/gear-runes.ts';

type Profile = 'continu' | 'assidu' | 'regulier';
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const profile = (args[0] ?? 'regulier') as Profile;
const days = Number(args[1] ?? 60);
const withNewSystems = !process.argv.includes('--sans-nouveautes');
const withWorkshop = withNewSystems && !process.argv.includes('--sans-atelier');
const withEvents = withNewSystems && !process.argv.includes('--sans-evenements');
const withCompanions = withNewSystems && !process.argv.includes('--sans-compagnons');
const withCamp = withNewSystems && !process.argv.includes('--sans-campement');
const withAbyss = withNewSystems && !process.argv.includes('--sans-puits');
const withGearRunes = withNewSystems && !process.argv.includes('--sans-runes-equipement');
/**
 * Choix de galerie en fin de zone : neutre (le joueur ne choisit jamais, rythme de base), optimal (préfère l'or,
 * puis les explosions, puis le minerai s'il manque pour évoluer, puis les éclats), hasard.
 */
const galleryStrategy = (process.env.GALLERY ?? 'neutre') as 'neutre' | 'optimal' | 'hasard';
const GALLERY_PREFERENCE: readonly GalleryId[] = ['goldVein', 'unstable', 'flooded', 'crystal'];
/**
 * Part du prix d'un segment de pioche que le joueur accepte de mettre dans un niveau d'Atelier :
 * la pioche reste la priorité, l'Atelier prend les petites sommes, puis tout l'or une fois la pioche au maximum.
 */
const WORKSHOP_SHARE_OF_SEGMENT = Number(process.env.WORKSHOP_SHARE ?? 0.25);
/** Le joueur simulé met au Campement au plus ce multiple d'un segment de pioche : la pioche reste prioritaire. */
const CAMP_SHARE_OF_SEGMENT = Number(process.env.CAMP_SHARE ?? 2);

const HOUR = 3600;
const DAY = 24 * HOUR;
/** Sessions de jeu dans la journée : [heure de début, durée en minutes]. */
const SESSIONS: Record<Profile, readonly (readonly [number, number])[]> = {
  continu: [[0, 24 * 60]],
  assidu: [[8, 30], [10, 30], [13, 30], [16, 30], [19, 30], [22, 30]],
  regulier: [[8, 15], [12, 15], [18, 15], [22, 15]],
};

/** Ordre d'apprentissage du joueur simulé : une voie Force et Maîtrise, puis la Prospection. */
const LEARN_ORDER: readonly string[] = [
  'dynamite', 'firmGrip', 'firmGrip', 'frenzy', 'firmGrip', 'sharpEye', 'firmGrip', 'firmGrip', 'shortFuse',
  'sharpEye', 'sharpEye', 'dynamite', 'geologistEye', 'preciseBlows', 'preciseBlows', 'frenzy', 'sharpEye',
  'sharpEye', 'preciseBlows', 'shortFuse', 'shortFuse', 'preciseBlows', 'preciseBlows', 'firedamp', 'focus',
  'focus', 'dynamite', 'frenzy', 'firedamp', 'firedamp', 'shortFuse', 'shortFuse', 'focus', 'focus', 'focus',
  'blastMaster', 'blastMaster', 'blastMaster', 'geologistEye', 'geologistEye', 'goldNose', 'goldNose', 'goldNose',
  'goldNose', 'goldNose', 'goldenVein', 'geodeHunter', 'geodeHunter', 'geodeHunter', 'geodeHunter', 'geodeHunter',
  'bottomlessBag', 'bottomlessBag', 'bottomlessBag', 'bottomlessBag', 'bottomlessBag', 'geodeEcho',
];
/** Sorts gardés en priorité dans les 3 emplacements. */
const SPELL_PRIORITY: readonly SpellId[] = ['firedamp', 'frenzy', 'dynamite', 'geologistEye', 'goldenVein', 'geodeEcho'];

let seed = Number(process.env.SEED ?? 12345);
const random = (): number => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
// Tirages d'artefacts sur une suite à part : juste après une très petite valeur (la chance de trouvaille),
// la suite principale donne une valeur prévisible qui fausserait la rareté tirée.
let artifactSeed = 987654;
const artifactRandom = (): number => {
  artifactSeed = (artifactSeed * 48271) % 2147483647;
  return (artifactSeed - 1) / 2147483646;
};
// Événements de mine sur une suite à part, pour ne pas décaler les autres tirages
let eventSeed = 424242;
const eventRandom = (): number => {
  eventSeed = (eventSeed * 48271) % 2147483647;
  return (eventSeed - 1) / 2147483646;
};
let gallerySeed = 8675309;
const galleryRandom = (): number => {
  gallerySeed = (gallerySeed * 48271) % 2147483647;
  return (gallerySeed - 1) / 2147483646;
};
let gallery: GalleryId = 'neutral';
let companions: CompanionState = EMPTY_COMPANIONS;
let companionSeed = 1357911;
const companionRandom = (): number => {
  companionSeed = (companionSeed * 48271) % 2147483647;
  return (companionSeed - 1) / 2147483646;
};
let eggsFound = 0;
let legendaryAt = '';

function findEgg(now: number, minRarity: 'common' | 'rare' = 'common'): void {
  if (!withCompanions || progress.zone < COMPANIONS_UNLOCK_ZONE) return;
  eggsFound++;
  companions = addEgg(companions, rollEggRarity(companionRandom, companions.sinceLegendary, minRarity), now * 1000);
}

// ─── Défi de la mine ────────────────────────────────────────────────────────
let challengePeriodIndex = -1;
let challengeBaseline: Counters = EMPTY_COUNTERS;
let challengeClaimed: number[] = [];
let challengeMilestonesReached = 0;
let challengesPlayed = 0;

/** Le joueur récupère chaque palier atteint ; un nouveau défi commence tous les 3 jours. */
function runChallenge(now: number): void {
  if (!withCompanions || progress.zone < COMPANIONS_UNLOCK_ZONE) return;
  const period = Math.floor(now / DAY / CHALLENGE_DAYS);
  if (period !== challengePeriodIndex) {
    challengePeriodIndex = period;
    challengeBaseline = counters;
    challengeClaimed = [];
    challengesPlayed++;
  }
  const points = challengePoints(counters, challengeBaseline);
  CHALLENGE_MILESTONES.forEach((milestone, index) => {
    if (points < milestone.points || challengeClaimed.includes(index)) return;
    challengeClaimed.push(index);
    challengeMilestonesReached++;
    const reward = milestone.reward;
    if (reward.kind === 'egg') findEgg(now, reward.minRarity === 'rare' ? 'rare' : 'common');
    if (reward.kind === 'stones') companions = { ...companions, stones: companions.stones + reward.amount };
    if (reward.kind === 'shards') {
      shards += reward.amount;
      shardSources.defi += reward.amount;
    }
  });
}

/** Le joueur simulé fait éclore, garde le compagnon qui rapporte le plus, et monte son étoile dès qu'il peut. */
function tendCompanions(now: number): void {
  if (!withCompanions || progress.zone < COMPANIONS_UNLOCK_ZONE) return;
  if (!companions.gifted) {
    companions = { ...addEgg(companions, 'common', now * 1000), gifted: true };
    eggsFound++;
  }
  for (let result = hatch(companions, companionRandom, now * 1000); result !== null; result = hatch(companions, companionRandom, now * 1000)) {
    companions = result.state;
    if (result.hatching.kind === 'new' && COMPANIONS[result.hatching.id].rarity === 'legendary' && legendaryAt === '') {
      legendaryAt = `${fmt(now)} (œuf n° ${eggsFound})`;
    }
  }
  let best: CompanionId | null = companions.active;
  let bestValue = -1;
  for (const id of Object.keys(companions.owned) as CompanionId[]) {
    if (companions.expeditions[id] !== undefined) continue;
    const candidate = minerProfile(gear, [...families().slice(0, 2), activeCompanionBonuses({ ...companions, active: id })], NO_BUFFS);
    const value = powerOf(candidate.stats) * (1 + candidate.stats.goldBonus * 0.2);
    if (value > bestValue) {
      bestValue = value;
      best = id;
    }
  }
  if (best !== null) companions = setActive(companions, best);
  const active = companions.active;
  while (active !== null) {
    const cost = nextStarCost(companions, active);
    if (cost === null || companions.stones < cost) break;
    companions = raiseStar(companions, active);
  }
  refresh(now);
}

/** En début de session : les compagnons rentrés rendent leur butin, puis repartent 4 h. */
function runExpeditions(now: number): void {
  if (!withCompanions || process.argv.includes('--sans-expeditions')) return;
  for (const id of Object.keys(companions.owned) as CompanionId[]) {
    const back = collectExpedition(companions, id, now * 1000);
    if (back !== null) {
      companions = back.state;
      shards += back.loot.shards;
      shardSources.expeditions += back.loot.shards;
    }
    companions = sendOnExpedition(companions, id, 4, now * 1000);
  }
}
const galleryCounts: Partial<Record<GalleryId, number>> = {};

function chooseGallery(): void {
  const offer = rollOffer(galleryRandom);
  if (galleryStrategy === 'neutre') {
    gallery = 'neutral';
  } else if (galleryStrategy === 'hasard') {
    gallery = offer[Math.floor(galleryRandom() * offer.length)];
  } else {
    const next = EVOLUTION_FORMS[formIndex + 1];
    const tier = zoneMaterial(progress.zone);
    const needsOres = next !== undefined && tier !== null && (next.ores[tier] ?? 0) > ores[tier];
    const preference = needsOres ? (['flooded', ...GALLERY_PREFERENCE] as GalleryId[]) : GALLERY_PREFERENCE;
    gallery = preference.find((id) => offer.includes(id)) ?? 'neutral';
  }
  galleryCounts[gallery] = (galleryCounts[gallery] ?? 0) + 1;
}

let nextId = 0;
const createId = (): string => `sim-${++nextId}`;

// ─── État du joueur ─────────────────────────────────────────────────────────
let progress: Progress = START_PROGRESS;
/** Gardien de fin de zone : début du combat (s), blocage après un échec, et Puissance au moment de l'échec. */
let guardianStart: number | null = null;
let guardianBlocked = false;
let guardianFailedAt = 0;
let guardianFailPower = 0;
let guardianFails = 0;
const guardianFailsByZone: Record<number, number> = {};
const guardianKills: string[] = [];
/** Le joueur retente le gardien quand sa Puissance a gagné 5 %, ou au bout de 30 minutes de jeu. */
const GUARDIAN_RETRY_POWER = 1.05;
const GUARDIAN_RETRY_SECONDS = 30 * 60;
let equipped: EquippedItems = {};
let gold = 0;
let shards = 0;
const ores = Object.fromEntries(TIER_IDS.map((tier) => [tier, 0])) as Record<TierId, number>;
let pickaxe = { level: 1, segments: 0, upgradeEndsAt: null as number | null };
let formIndex = 0;
/** Renaissance (25/10/2026) : arbre des Braises et dureté des filons de la vie en cours. */
let rebirthState: RebirthState = EMPTY_REBIRTH;
const withRebirth = withNewSystems && !process.argv.includes('--sans-renaissance');
/** Le joueur renaît quand il n'a pas changé de zone depuis ce nombre de jours, au-delà de la zone 20. */
const REBIRTH_STALL_DAYS = Number(process.env.REBIRTH_STALL ?? 2);
let lastZoneChangeDay = 0;
const lives: string[] = [];
let lifeStart = 0;
let zone20Reached = false;
// Déclarés tôt : gearStats() les lit dès le premier calcul de stats
let awakeningState: AwakeningState = EMPTY_AWAKENING;
const withAwakening = withNewSystems && !process.argv.includes('--sans-eveil');
let counters: Counters = EMPTY_COUNTERS;
let mainIndex = 0;
let mainBaseline: Counters = EMPTY_COUNTERS;
let dayBaseline: Counters = EMPTY_COUNTERS;
let dailyClaimed = new Set<string>();
let chestClaimed = false;
let ranks: SkillRanks = {};
let artifacts: ArtifactState = EMPTY_ARTIFACTS;
let workshop: WorkshopLevels = {};
let goldWorkshop = 0;
/** Sorts équipés et leurs minuteurs, en secondes de simulation. */
let spellSlots: { spell: SpellId; readyAt: number; activeUntil: number }[] = [];
/** Compétence du familier actif, lancée en automatique comme les sorts. */
const companionAbilityTimer = { readyAt: 0, activeUntil: 0 };
let abilityDamage = 0;
let gear: MiningStats = gearStats();
let profileNow: MinerProfile = profileAt(0);

// ─── Mesures ────────────────────────────────────────────────────────────────
const shardSources = { coups: 0, filons: 0, zones: 0, missions: 0, absence: 0, artefacts: 0, evenements: 0, expeditions: 0, evolution: 0, defi: 0, puits: 0 };
let camp: CampState = EMPTY_CAMP;
let abyssRecord = 0;
let abyssBest = 0;
let abyssFloorsTotal = 0;
const abyssRandom = mulberryForAbyss(Number(process.env.SEED ?? 1) + 7);
let abyssRuns = 0;
let abyssStones = 0;
let abyssShards = 0;
let goldCamp = 0;
let goldEvents = 0;
let eventsSeen = 0;
let forges = 0;
let sold = 0;
let goldFromSales = 0;
let goldMined = 0;
let goldOffline = 0;
let blastDamage = 0;
let totalDamage = 0;
let artifactsFound = 0;
let heartForge: HeartForgeState = EMPTY_HEART_FORGE;
/** Jour où la pièce la moins éveillée atteint chaque palier d'Éveil. */
const awakeningDays: string[] = [];
let essencesEarned = 0;
let runesCreated = 0;
let runesGrown = 0;
const heartRandom = mulberryForAbyss(Number(process.env.SEED ?? 1) + 11);
/** Minutes passées chaque jour dans les Échos, dès la Légende (le reste du temps actif va à la zone en cours). */
const ECHO_MINUTES_PER_DAY = Number(process.env.ECHO_MINUTES ?? 20);
const ECHO_ROCK_SECONDS = 120;
function earnEssences(gains: Partial<Record<EssenceId, number>>): void {
  heartForge = addEssences(heartForge, gains);
  essencesEarned += Object.values(gains).reduce((sum, amount) => sum + (amount ?? 0), 0);
}
let artifactReforges = 0;
let artifactReforgesKept = 0;
const milestones: string[] = [];
const daily: string[] = [];
let lastZone = 1;
let filonSecondsInZone = 0;
let filonsInZone = 0;

function gearStats(): MiningStats {
  const base = computeStats(equipped, awakeningState.levels, rebirthState.count);
  return reinforce({ ...base, strikePower: base.strikePower * evolutionStrikeMultiplier(formIndex) }, workshop, equipped);
}

function rebirthBonuses() {
  const effects = rebirthEffects(rebirthState);
  return { ...NO_BONUSES, strikePct: effects.strikeMultiplier - 1, speed: effects.speed };
}

function gearSockets(): number {
  return gearSocketCount(EVOLUTION_FORMS[formIndex].stars);
}

/** Châsses ouvertes par emplacement : les étoiles, plus l'Éveil des pièces Divin. */
function openSockets(): OpenSockets {
  const base = gearSockets();
  return Object.fromEntries(
    SLOT_IDS.map((slot) => [slot, base === 0 ? 0 : base + awakeningSockets(activeAwakening(equipped, awakeningState.levels, slot))]),
  ) as Record<SlotId, number>;
}

function families() {
  return withNewSystems
    ? [
        passiveBonuses(ranks),
        equippedArtifactBonuses(artifacts, artifactSlots()),
        activeCompanionBonuses(companions),
        // Avant la 1re étoile, la Forge n'existe pas encore pour le simulateur (heartForge est déclaré plus bas)
        withGearRunes && gearSockets() > 0 ? gearRuneBonuses(heartForge.gear, openSockets()) : NO_BONUSES,
        rebirthBonuses(),
      ]
    : [NO_BONUSES];
}

function buffsAt(now: number): SpellBuffs {
  let buffs = NO_BUFFS;
  for (const slot of spellSlots) {
    if (now >= slot.activeUntil) continue;
    const effect = SPELLS[slot.spell].effect;
    if (effect.kind === 'speed') buffs = { ...buffs, speed: buffs.speed + effect.amount };
    if (effect.kind === 'crit') buffs = { ...buffs, guaranteedCrit: true };
    if (effect.kind === 'gold') buffs = { ...buffs, goldMultiplier: buffs.goldMultiplier * effect.multiplier };
    if (effect.kind === 'shard') buffs = { ...buffs, shardChance: buffs.shardChance + shardEchoChance(SPELLS[slot.spell], spellRank(ranks, slot.spell)) };
  }
  const active = companions.active;
  if (withCompanions && active !== null && now < companionAbilityTimer.activeUntil) {
    buffs = combineBuffs(buffs, abilityBuffs(COMPANIONS[active].ability));
  }
  return buffs;
}

function profileAt(now: number): MinerProfile {
  const buffs = buffsAt(now);
  return minerProfile(gear, families(), { ...buffs, speed: buffs.speed + GALLERIES[gallery].modifiers.speed });
}

/** Profil sans sort actif : celui de l'absence et des relevés. */
function permanentProfile(): MinerProfile {
  return minerProfile(gear, families(), NO_BUFFS);
}

function refresh(now: number): void {
  gear = gearStats();
  profileNow = profileAt(now);
}

function record(counter: CounterId, amount = 1): void {
  counters = { ...counters, [counter]: counters[counter] + amount };
}

function fmt(seconds: number): string {
  if (seconds < HOUR) return `${(seconds / 60).toFixed(0)} min`;
  if (seconds < DAY) return `${(seconds / HOUR).toFixed(1)} h`;
  return `j${(seconds / DAY + 1).toFixed(1)}`;
}

function big(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} Md`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)} k`;
  return value.toFixed(0);
}

function forgeAll(now: number): void {
  while (shards >= FORGE_SHARD_COST) {
    shards -= FORGE_SHARD_COST;
    forges++;
    record('itemsForged');
    const item: Item = rollItem(random, createId, pickaxe.level);
    if (powerDelta(equipped, item, workshop, awakeningState.levels) > 0) {
      const replaced = equipped[item.slot];
      if (replaced) {
        if (awakeningUnlocked()) awakeningState = recordDuplicate(awakeningState, replaced);
        gold += sellPrice(replaced);
        goldFromSales += sellPrice(replaced);
        record('itemsSold');
        sold++;
      }
      equipped = { ...equipped, [item.slot]: item };
      refresh(now);
    } else {
      if (awakeningUnlocked()) awakeningState = recordDuplicate(awakeningState, item);
      gold += sellPrice(item);
      goldFromSales += sellPrice(item);
      record('itemsSold');
      sold++;
    }
  }
}

function payPickaxe(now: number): void {
  if (pickaxe.upgradeEndsAt !== null && now >= pickaxe.upgradeEndsAt) {
    pickaxe = { level: pickaxe.level + 1, segments: 0, upgradeEndsAt: null };
    if ([5, 10, 15, 20, 25, 30].includes(pickaxe.level)) milestones.push(`${fmt(now)} : pioche ${pickaxe.level}`);
  }
  if (pickaxe.upgradeEndsAt !== null || pickaxe.level >= MAX_PICKAXE_LEVEL) return;
  const cost = segmentCost(pickaxe.level) ?? Infinity;
  while (gold >= cost && pickaxe.segments < SEGMENTS_PER_LEVEL) {
    gold -= cost;
    pickaxe.segments++;
    record('segmentsPaid');
  }
  if (pickaxe.segments === SEGMENTS_PER_LEVEL) pickaxe.upgradeEndsAt = now + upgradeDurationMs(pickaxe.level) / 1000;
}

/** Promotion dès que les objectifs de la forme suivante sont remplis ; leurs éclats sont touchés au passage. */
function tryEvolve(now: number): void {
  const next = EVOLUTION_FORMS[formIndex + 1];
  if (!next) return;
  const progressNow = { zone: progress.zone, zoneCleared: progress.zone - 1, pickaxeLevel: pickaxe.level, itemsForged: counters.itemsForged, rocksBroken: counters.rocksBroken };
  const objectives = objectivesFor(next, progressNow, []);
  if (!canEvolve(objectives)) return;
  if (next.id === 'heart' && !starRunesSet(heartForge, next.stars)) return;
  const reward = unclaimedShards(objectives);
  shards += reward;
  shardSources.evolution += reward;
  formIndex++;
  refresh(now);
  milestones.push(`${fmt(now)} : évolution ${next.label} (zone ${progress.zone}, pioche ${pickaxe.level}, forges ${counters.itemsForged}, événements ${counters.eventsTouched}, segments ${counters.segmentsPaid}, filons ${counters.rocksBroken}, ventes ${counters.itemsSold})`);
}

/** Renforce l'emplacement qui rapporte le plus de Puissance (l'or compte pour un cinquième), tant que c'est abordable. */
function payWorkshop(now: number): void {
  const unlockIndex = EVOLUTION_FORMS.findIndex((form) => form.id === WORKSHOP_UNLOCK_FORM);
  if (!withWorkshop || formIndex < unlockIndex) return;
  const pickaxeDone = pickaxe.level >= MAX_PICKAXE_LEVEL;
  const budget = pickaxeDone ? Infinity : (segmentCost(pickaxe.level) ?? 0) * WORKSHOP_SHARE_OF_SEGMENT;
  for (let guard = 0; guard < 200; guard++) {
    const value = (levels: WorkshopLevels): number => {
      const saved = workshop;
      workshop = levels;
      const candidate = minerProfile(gearStats(), families(), NO_BUFFS);
      workshop = saved;
      return powerOf(candidate.stats) * (1 + candidate.stats.goldBonus * 0.2);
    };
    const current = value(workshop);
    let best: { slot: SlotId; tier: TierId; level: number; gain: number } | null = null;
    for (const slot of SLOT_IDS) {
      const tier = equipped[slot]?.tier;
      if (tier === undefined) continue;
      const level = pieceLevel(workshop, slot, tier);
      const cost = upgradeCost(tier, level);
      if (cost === null || cost.gold > gold || cost.gold > budget) continue;
      if (Object.entries(cost.ores).some(([ore, need]) => ores[ore as TierId] < (need ?? 0))) continue;
      const gain = (value(withLevel(workshop, slot, tier, level + 1)) - current) / cost.gold;
      if (best === null || gain > best.gain) best = { slot, tier, level, gain };
    }
    if (best === null) break;
    const cost = upgradeCost(best.tier, best.level)!;
    for (const [tier, need] of Object.entries(cost.ores)) ores[tier as TierId] -= need ?? 0;
    gold -= cost.gold;
    goldWorkshop += cost.gold;
    workshop = withLevel(workshop, best.slot, best.tier, best.level + 1);
  }
  refresh(now);
}

/** Construit le bâtiment le moins cher, tant que c'est abordable : le joueur fait grandir son camp au fil de l'eau. */
function payCamp(now: number): void {
  if (!withCamp || progress.zone < CAMP_UNLOCK_ZONE) return;
  const budget = pickaxe.level >= MAX_PICKAXE_LEVEL ? Infinity : (segmentCost(pickaxe.level) ?? 0) * CAMP_SHARE_OF_SEGMENT;
  for (let guard = 0; guard < 10; guard++) {
    const options = BUILDING_IDS.filter((id) => !isMaxLevel(camp.levels, id))
      .map((id) => ({ id, cost: buildingCost(buildingLevel(camp.levels, id), progress.zone) }))
      .filter(({ cost }) => {
        const [[tier, need]] = Object.entries(cost.ores) as [TierId, number][];
        return cost.gold <= gold && cost.gold <= budget && ores[tier] >= need;
      })
      .sort((a, b) => a.cost.gold - b.cost.gold);
    const pick = options[0];
    if (pick === undefined) break;
    for (const [tier, need] of Object.entries(pick.cost.ores)) ores[tier as TierId] -= need ?? 0;
    gold -= pick.cost.gold;
    goldCamp += pick.cost.gold;
    const building: BuildingId = pick.id;
    const levels = { ...camp.levels, [building]: buildingLevel(camp.levels, building) + 1 };
    camp = { levels, wellCollectedAt: building === 'well' && camp.wellCollectedAt === null ? now * 1000 : camp.wellCollectedAt };
  }
}

/**
 * Descentes du Puits sans fond, jouées par un joueur moyen : 5 touchers par seconde (combo entretenu), le point
 * faible visé une fois sur deux, un cristal de temps sur deux attrapé, pas de sort. Joué dès la première session du jour.
 */
const ABYSS_TAPS_PER_SECOND = Number(process.env.ABYSS_TAPS ?? 5);
function playAbyss(): void {
  const unlockIndex = EVOLUTION_FORMS.findIndex((form) => form.id === ABYSS_UNLOCK_FORM);
  if (!withAbyss || formIndex < unlockIndex) return;
  const stats = permanentProfile().stats;
  const fighter: Fighter = {
    strike: stats.strikePower,
    critChance: stats.critChance,
    critDamage: stats.critDamage,
    hitsPerSecond: hitsPerSecond(stats),
  };
  const step = 50;
  for (let run = 0; run < ABYSS_DAILY_RUNS; run++) {
    let game = startGame(abyssRandom);
    let tapDebt = 0;
    while (!isOver(game)) {
      game = abyssTick(game, step, fighter, abyssRandom);
      if (game.crystal !== null && game.crystal.ageMs < step && abyssRandom() < 0.5) game = abyssTap(game, 'crystal', fighter, abyssRandom);
      tapDebt += (ABYSS_TAPS_PER_SECOND * step) / 1000;
      while (tapDebt >= 1) {
        tapDebt -= 1;
        const weak = game.floor.weakPoint !== null && abyssRandom() < 0.5;
        game = abyssTap(game, weak ? 'weak' : 'rock', fighter, abyssRandom);
      }
    }
    const reward = runReward(game.floorsCleared, game.shards, abyssRecord);
    if (formIndex >= EVOLUTION_FORMS.findIndex((form) => form.id === 'legend')) {
      const each = Math.floor(game.floorsCleared / ABYSS_FLOORS_PER_ESSENCES);
      earnEssences(Object.fromEntries(ESSENCES.map((id) => [id, each])));
    }
    abyssRecord = Math.max(abyssRecord, game.floorsCleared);
    abyssBest = Math.max(abyssBest, game.floorsCleared);
    abyssFloorsTotal += game.floorsCleared;
    shards += reward.shards;
    abyssShards += reward.shards;
    abyssStones += reward.stones;
    if (withCompanions) companions = { ...companions, stones: companions.stones + reward.stones };
    abyssRuns++;
  }
}

/** Récolte du puits du Campement en revenant. */
function collectWell(now: number): void {
  const stock = wellStock(camp, now * 1000);
  if (stock === 0) return;
  shards += stock;
  shardSources.puits += stock;
  camp = { ...camp, wellCollectedAt: collectedAt(camp, now * 1000, stock) };
}

/** Niveau d'Atelier de chaque pièce portée, avec sa qualité (« steel 24 »). */
function workshopSummary(): string {
  return SLOT_IDS.map((slot) => {
    const tier = equipped[slot]?.tier;
    return tier === undefined ? '-' : `${tier} ${pieceLevel(workshop, slot, tier)}`;
  }).join('/');
}

/** Ce que l'Atelier ajoute à la Puissance permanente. */
function workshopPower(): number {
  const saved = workshop;
  workshop = {};
  const without = powerOf(minerProfile(gearStats(), families(), NO_BUFFS).stats);
  workshop = saved;
  return powerOf(minerProfile(gearStats(), families(), NO_BUFFS).stats) / without;
}

function spendPoints(now: number): void {
  if (!withNewSystems) return;
  let learned = true;
  while (learned) {
    learned = false;
    const available = pointsEarned(progress.zone) - pointsSpent(ranks);
    const counts = new Map<string, number>();
    for (const id of LEARN_ORDER) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
      const node = SKILL_NODES.find((candidate) => candidate.id === id);
      if (!node || (ranks[id] ?? 0) >= (counts.get(id) ?? 0)) continue;
      if (learnCheck(node, ranks, available) === 'ok') {
        ranks = learn(ranks, node);
        learned = true;
      }
      break;
    }
  }
  const wanted = SPELL_PRIORITY.filter((spell) => spellRank(ranks, spell) > 0).slice(0, SPELL_SLOTS);
  if (wanted.join() !== spellSlots.map((slot) => slot.spell).join()) {
    spellSlots = wanted.map((spell) => spellSlots.find((slot) => slot.spell === spell) ?? { spell, readyAt: now, activeUntil: 0 });
  }
  refresh(now);
}

/** Emplacements d'artefact ouverts selon la forme (1, puis 2 au Contremaître et 3 à la Légende). */
function artifactSlots(): number {
  return openSlotCount(formIndex, ARTIFACT_SLOT_FORMS.map((id) => EVOLUTION_FORMS.findIndex((form) => form.id === id)));
}

function artifactPower(): number {
  const profile = minerProfile(gear, families(), NO_BUFFS);
  return powerOf(profile.stats) * (1 + profile.stats.goldBonus * 0.2);
}

/** Remplit les emplacements ouverts un par un avec l'artefact qui rapporte le plus de Puissance. */
function equipBestArtifact(now: number): void {
  const open = artifactSlots();
  artifacts = { ...artifacts, slots: artifacts.slots.map(() => null) };
  for (let slot = 0; slot < open; slot++) {
    let best: ArtifactId | null = null;
    let bestPower = -1;
    for (const id of Object.keys(artifacts.owned) as ArtifactId[]) {
      if (artifacts.slots.includes(id)) continue;
      const before = artifacts;
      artifacts = equipArtifact(artifacts, id, slot, open);
      const power = artifactPower();
      artifacts = before;
      if (power > bestPower) {
        bestPower = power;
        best = id;
      }
    }
    if (best !== null) artifacts = equipArtifact(artifacts, best, slot, open);
  }
  refresh(now);
}

/** Recette d'une rune de rang 1 : 3 ressources de son élément, ou la recette de l'alliance. */
function recipeOf(type: RuneType): readonly EssenceId[] {
  if (type in ALLIANCE_RECIPES) return ALLIANCE_RECIPES[type as keyof typeof ALLIANCE_RECIPES];
  const essence = ESSENCES.find((id) => ESSENCE_ELEMENTS[id] === type) ?? ESSENCES[0];
  return [essence, essence, essence];
}

/** Ressources par filon d'Écho : 1, plus la Mémoire du Cœur. */
function echoGain(): number {
  return 1 + rebirthEffects(rebirthState).essencesPerRock;
}

/** Avance d'un pas vers une rune visée : fait grandir la plus haute en dessous de son rang, sinon en crée une. */
function stepTowards(target: { type: RuneType; rank: number }): boolean {
  for (let rank = target.rank - 1; rank >= 1; rank--) {
    const rune = { type: target.type, rank };
    if (runeCount(heartForge, rune) > 0) {
      if (!canGrow(heartForge, rune)) return false;
      heartForge = growRune(heartForge, rune);
      runesGrown++;
      return true;
    }
  }
  const stars = EVOLUTION_FORMS[formIndex].stars;
  if (!canCreate(heartForge, target.type, stars)) return false;
  heartForge = createRune(heartForge, target.type, stars);
  runesCreated++;
  return true;
}

/** Ressource qui manque le plus pour le prochain pas vers cette rune. */
function lackingFor(target: { type: RuneType; rank: number }): EssenceId {
  const owned = [...Array(target.rank - 1).keys()].map((index) => target.rank - 1 - index).find((rank) => runeCount(heartForge, { type: target.type, rank }) > 0);
  const cost = owned === undefined ? null : growCost({ type: target.type, rank: owned });
  const needs = cost === null ? recipeOf(target.type) : (Object.keys(cost) as EssenceId[]);
  return [...needs].sort((a, b) => heartForge.essences[a] - heartForge.essences[b])[0];
}

/**
 * Une fois par jour, dès la Légende : le joueur passe quelques minutes dans les Échos à récolter ce qui manque, puis
 * crée, fait grandir et sertit les runes de la prochaine étoile.
 */
function craftRunes(): void {
  if (formIndex < EVOLUTION_FORMS.findIndex((form) => form.id === 'legend')) return;
  const socketsFree = Array.from({ length: RING_SOCKETS }, (_, index) => index).filter((index) => !heartForge.sockets[index]);
  if (socketsFree.length === 0) return;
  const star = Math.floor(socketsFree[0] / 2);
  const targets = [star * 2, star * 2 + 1].filter((index) => !heartForge.sockets[index]);
  // Récolte du jour : un filon d'Écho toutes les 2 minutes, dans l'Écho de la ressource qui manque le plus
  let rocks = Math.round((ECHO_MINUTES_PER_DAY * 60) / ECHO_ROCK_SECONDS);
  while (rocks > 0) {
    const unfilled = targets.filter((socket) => !heartForge.sockets[socket] && runeCount(heartForge, socketRune(socket)) === 0);
    if (unfilled.length === 0) break;
    earnEssences({ [lackingFor(socketRune(unfilled[rocks % unfilled.length]))]: echoGain() });
    rocks--;
  }
  for (let guard = 0; guard < 5000; guard++) {
    let progressMade = false;
    for (const socket of targets) {
      if (canSocket(heartForge, socket, EVOLUTION_FORMS[formIndex].stars)) {
        heartForge = socketRuneIn(heartForge, socket, EVOLUTION_FORMS[formIndex].stars);
        progressMade = true;
      }
    }
    for (const socket of targets.filter((index) => !heartForge.sockets[index])) {
      const target = socketRune(socket);
      if (runeCount(heartForge, target) === 0 && stepTowards(target)) progressMade = true;
    }
    if (!progressMade) break;
  }
}

/**
 * Runes d'équipement (dès la 1re étoile) : le joueur passe GEAR_ECHO_MINUTES par jour dans les Échos pour elles, et
 * sertit sur chaque emplacement la rune de son esprit (Feu sur la pioche, Glace sur les gants…) au rang visé.
 * Les runes des étoiles passent avant : craftRunes() tourne d'abord.
 */
const GEAR_ECHO_MINUTES_PER_DAY = Number(process.env.GEAR_ECHO_MINUTES ?? 10);
const GEAR_TARGET_RANK = Number(process.env.GEAR_RANK ?? 2);
const GEAR_PLAN: readonly [SlotId, RuneType][] = [
  ['pickaxe', 'fire'],
  ['helmet', 'shadow'],
  ['gloves', 'ice'],
  ['bag', 'light'],
  ['boots', 'earth'],
];
let gearRunesSet = 0;

function gearTargets(): { slot: SlotId; socket: number; type: RuneType }[] {
  const open = openSockets();
  const targets: { slot: SlotId; socket: number; type: RuneType }[] = [];
  for (let socket = 0; socket < GEAR_SOCKETS_TOTAL; socket++) {
    for (const [slot, type] of GEAR_PLAN) {
      if (socket >= open[slot]) continue;
      const current = heartForge.gear[slot][socket];
      if (current === null || current.rank < GEAR_TARGET_RANK) targets.push({ slot, socket, type });
    }
  }
  return targets;
}

function craftGearRunes(): void {
  if (!withGearRunes || gearSockets() === 0) return;
  let rocks = Math.round((GEAR_ECHO_MINUTES_PER_DAY * 60) / ECHO_ROCK_SECONDS);
  for (let guard = 0; guard < 5000; guard++) {
    const target = gearTargets()[0];
    if (target === undefined) return;
    const wanted = { type: target.type, rank: GEAR_TARGET_RANK };
    if (runeCount(heartForge, wanted) > 0) {
      heartForge = setGearRune(heartForge, target.slot, target.socket, wanted, openSockets()[target.slot]);
      gearRunesSet++;
      continue;
    }
    if (stepTowards(wanted)) continue;
    if (rocks <= 0) return;
    earnEssences({ [lackingFor(wanted)]: echoGain() });
    rocks--;
  }
}

/**
 * Éveil des pièces Divin (dès la Légende du Cœur du monde) : le joueur passe AWAKEN_ECHO_MINUTES par jour dans les
 * Échos pour la ressource de la pièce la moins éveillée, puis éveille tout ce qu'il peut payer, la moins éveillée
 * d'abord. Les runes passent avant.
 */
const AWAKEN_ECHO_MINUTES_PER_DAY = Number(process.env.AWAKEN_ECHO_MINUTES ?? 10);
function awakeningUnlocked(): boolean {
  return withAwakening && formIndex >= EVOLUTION_FORMS.findIndex((form) => form.id === AWAKENING_UNLOCK_FORM);
}
function awakenGear(now: number): void {
  if (!awakeningUnlocked()) return;
  const byLevel = () => [...SLOT_IDS].sort((a, b) => (awakeningState.levels[a] ?? 0) - (awakeningState.levels[b] ?? 0));
  let rocks = Math.round((AWAKEN_ECHO_MINUTES_PER_DAY * 60) / ECHO_ROCK_SECONDS);
  const target = byLevel().find((slot) => equipped[slot]?.tier === 'divine' && (awakeningState.levels[slot] ?? 0) < MAX_AWAKENING);
  const cost = target === undefined ? null : awakeningCost(target, awakeningState.levels[target] ?? 0);
  if (cost !== null) {
    while (rocks-- > 0) earnEssences({ [cost.essence]: echoGain() });
  }
  for (let guard = 0; guard < 25; guard++) {
    const slot = byLevel().find((id) => {
      const next = awakeningCost(id, awakeningState.levels[id] ?? 0);
      return (
        equipped[id]?.tier === 'divine' &&
        next !== null &&
        rebirthState.count >= next.rebirths &&
        (awakeningState.duplicates[id] ?? 0) >= next.duplicates &&
        heartForge.essences[next.essence] >= next.essences
      );
    });
    if (slot === undefined) break;
    const next = awakeningCost(slot, awakeningState.levels[slot] ?? 0);
    const paid = next === null ? null : spendEssences(heartForge, { [next.essence]: next.essences });
    if (paid === null) break;
    heartForge = paid;
    awakeningState = awaken(awakeningState, slot);
  }
  const lowest = lowestAwakening(equipped, awakeningState.levels);
  while (awakeningDays.length < lowest) awakeningDays.push(fmt(now));
  refresh(now);
}

/** Ordre d'achat dans l'arbre : départ plus rapide d'abord, puis la Frappe, puis le reste. */
const REBIRTH_PRIORITY: readonly RebirthBranch[] = ['strike', 'shortcut', 'pickaxe', 'speed', 'essences', 'shards', 'gold'];

/** Au-delà de la zone 20, le joueur renaît quand il piétine : Braises dépensées, partie de mine remise à zéro. */
function maybeRebirth(now: number): void {
  if (!withRebirth || progress.zone < REBIRTH_MIN_ZONE || now / DAY - lastZoneChangeDay < REBIRTH_STALL_DAYS) return;
  const reachedZone = progress.zone;
  rebirthState = rebirth(rebirthState, reachedZone, stagesReached(progress));
  for (let guard = 0; guard < 500; guard++) {
    const branch = REBIRTH_PRIORITY.find((id) => canBuy(rebirthState, id));
    if (branch === undefined) break;
    rebirthState = buy(rebirthState, branch);
  }
  const effects = rebirthEffects(rebirthState);
  lives.push(
    `${fmt(now)} : renaissance ${rebirthState.count} depuis la zone ${reachedZone} (vie de ${((now - lifeStart) / DAY).toFixed(1)} j), ` +
      `arbre ${Object.entries(rebirthState.tree).map(([id, level]) => `${id} ${level}`).join(', ')}, Braises restantes ${rebirthState.embers}`,
  );
  progress = { zone: effects.startZone, stage: 1, damage: 0 };
  lastZone = effects.startZone;
  lastZoneChangeDay = now / DAY;
  lifeStart = now;
  zone20Reached = false;
  pickaxe = { level: effects.startPickaxe, segments: 0, upgradeEndsAt: null };
  equipped = {};
  gold = Math.floor(gold * effects.goldKept);
  for (const tier of TIER_IDS) ores[tier] = 0;
  workshop = {};
  camp = EMPTY_CAMP;
  ranks = {};
  guardianStart = null;
  guardianBlocked = false;
  refresh(now);
}

/** Une fois par jour, réforge chaque artefact porté au niveau 5 qu'on peut payer, et garde l'effet s'il est meilleur. */
function reforgeArtifacts(now: number): void {
  if (!withNewSystems) return;
  for (const id of artifacts.slots.slice(0, artifactSlots())) {
    if (id === null || !canReforge(artifacts, id)) continue;
    const token = (artifacts.tokens[id] ?? 0) > 0;
    const cost = reforgeOreCost(ores, reforgeOresEach(artifacts, id));
    if (!token && cost === null) continue;
    if (!token && cost !== null) for (const [tier, need] of Object.entries(cost)) ores[tier as TierId] -= need ?? 0;
    const before = artifactPower();
    artifacts = reforge(artifacts, id, artifactRandom, token);
    const kept = resolveReforge(artifacts, true);
    const previous = artifacts;
    artifacts = kept;
    const keep = artifactPower() > before;
    artifacts = resolveReforge(previous, keep);
    if (keep) artifactReforgesKept++;
    artifactReforges++;
  }
  refresh(now);
}

function findArtifact(now: number): void {
  if (!withNewSystems) return;
  const { state, find } = addArtifact(artifacts, rollArtifact(artifactRandom));
  artifacts = state;
  artifactsFound++;
  if (find.kind === 'new' && ARTIFACTS[find.id].rarity === 'legendary') {
    milestones.push(`${fmt(now)} : artefact légendaire ${ARTIFACTS[find.id].label}`);
  }
  equipBestArtifact(now);
}

function claimMissions(): void {
  const gauges = { stagesReached: stagesReached(progress), pickaxeLevel: pickaxe.level };
  for (let guard = 0; guard < 10; guard++) {
    const mission = mainMission(mainIndex);
    if (!isComplete(mission, counters, mainBaseline, gauges)) break;
    shards += mission.reward.shards;
    shardSources.missions += mission.reward.shards;
    gold += mission.reward.gold;
    mainIndex++;
    mainBaseline = counters;
  }
  for (const mission of DAILY_MISSIONS) {
    if (!dailyClaimed.has(mission.id) && isComplete(mission, counters, dayBaseline, gauges)) {
      dailyClaimed.add(mission.id);
      shards += mission.reward.shards;
      shardSources.missions += mission.reward.shards;
    }
  }
  if (!chestClaimed && dailyClaimed.size === DAILY_MISSIONS.length) {
    chestClaimed = true;
    shards += DAILY_CHEST_REWARD.shards;
    shardSources.missions += DAILY_CHEST_REWARD.shards;
  }
}

/** Applique des dégâts au filon en cours, avec tout ce qui en découle (or, éclats, minerai, artefact). */
function dealDamage(now: number, damage: number): void {
  updateGuardian(now);
  const { zone, stage } = progress;
  const mods = GALLERIES[gallery].modifiers;
  const result = applyDamage(progress, scaleAmount(damage, 1 / (mods.hardness * rebirthEffects(rebirthState).hardness), galleryRandom), guardianBlocked);
  progress = result.progress;
  if (isGuardian(progress) && stage === BEFORE_GUARDIAN_STAGE) {
    guardianStart = now;
  }
  if (result.clearedZone !== null && guardianStart !== null) {
    guardianKills.push(`z${zone} ${(now - guardianStart).toFixed(0)} s`);
    guardianStart = null;
  }
  totalDamage += damage;
  const earned = Math.round(minedGold(damage, profileNow.stats.goldBonus) * mods.gold);
  gold += earned;
  goldMined += earned;
  if (result.rockBroken) {
    record('rocksBroken');
    filonsInZone++;
    const stageShards = shardsForStage(zone, stage);
    shards += stageShards;
    shardSources.filons += stageShards;
    const tier = zoneMaterial(zone);
    if (tier !== null && result.clearedZone !== null) ores[tier] += scaleAmount(ZONE_CLEAR_ORES, mods.ores, galleryRandom);
    if (result.clearedZone !== null) {
      shards += zoneClearShards(zone);
      shardSources.zones += zoneClearShards(zone);
      findArtifact(now);
      if (zoneClearGivesEgg(result.clearedZone)) findEgg(now);
      spendPoints(now);
      chooseGallery();
    }
  }
  if (progress.zone !== lastZone) {
    milestones.push(
      `${fmt(now)} : zone ${progress.zone} (pioche ${pickaxe.level}, Puissance ${big(powerOf(permanentProfile().stats))}, ` +
        `${(filonSecondsInZone / Math.max(filonsInZone, 1)).toFixed(0)} s par filon dans la zone précédente)`,
    );
    lastZone = progress.zone;
    lastZoneChangeDay = now / DAY;
    if (progress.zone >= REBIRTH_MIN_ZONE && !zone20Reached) {
      zone20Reached = true;
      lives.push(`vie ${rebirthState.count + 1} : zone ${REBIRTH_MIN_ZONE} en ${((now - lifeStart) / DAY).toFixed(1)} j`);
    }
    filonSecondsInZone = 0;
    filonsInZone = 0;
  }
}

/** Gardien raté au bout de 30 s ; une fois bloqué, le joueur le retente quand il s'est renforcé. */
function updateGuardian(now: number): void {
  if (isGuardian(progress) && guardianStart !== null && now - guardianStart > GUARDIAN_SECONDS) {
    progress = failGuardian(progress);
    guardianStart = null;
    guardianBlocked = true;
    guardianFailedAt = now;
    guardianFailPower = powerOf(permanentProfile().stats);
    guardianFails++;
    guardianFailsByZone[progress.zone] = (guardianFailsByZone[progress.zone] ?? 0) + 1;
    return;
  }
  const stronger = powerOf(permanentProfile().stats) >= guardianFailPower * GUARDIAN_RETRY_POWER;
  if (guardianBlocked && (stronger || now - guardianFailedAt > GUARDIAN_RETRY_SECONDS)) {
    progress = challengeGuardian(progress);
    guardianBlocked = false;
    guardianStart = now;
  }
}

function castReadySpells(now: number): void {
  for (const slot of spellSlots) {
    if (now < slot.readyAt) continue;
    const spell = SPELLS[slot.spell];
    const rank = spellRank(ranks, slot.spell);
    slot.readyAt = now + spellCooldownMs(spell, profileNow.cooldownPct) / 1000;
    if (spell.effect.kind === 'blast') {
      const damage = Math.round(gear.strikePower * (1 + passiveBonuses(ranks).strikePct) * blastStrikeMultiplier(spell, rank, profileNow.blastPct) * GALLERIES[gallery].modifiers.blast);
      blastDamage += damage;
      dealDamage(now, damage);
    } else {
      slot.activeUntil = now + spellDurationMs(spell, rank, profileNow.durationPct) / 1000;
    }
  }
  castCompanionAbility(now);
  profileNow = profileAt(now);
}

function castCompanionAbility(now: number): void {
  const active = companions.active;
  if (!withCompanions || active === null || now < companionAbilityTimer.readyAt) return;
  const ability = COMPANIONS[active].ability;
  const stars = companions.owned[active]?.stars ?? 1;
  companionAbilityTimer.readyAt = now + abilityCooldownMs(ability, profileNow.cooldownPct) / 1000;
  if (ability.effect.kind === 'blast') {
    const damage = Math.round(gear.strikePower * (1 + passiveBonuses(ranks).strikePct) * abilityBlastMultiplier(ability, stars, profileNow.blastPct) * GALLERIES[gallery].modifiers.blast);
    abilityDamage += damage;
    dealDamage(now, damage);
  } else {
    companionAbilityTimer.activeUntil = now + abilityDurationMs(ability, stars, profileNow.durationPct) / 1000;
  }
}

function strike(now: number, interval: number): void {
  castReadySpells(now);
  const hit = resolveHit(profileNow.stats, random);
  filonSecondsInZone += interval;
  if (random() < profileNow.shardChance * GALLERIES[gallery].modifiers.shards) {
    shards++;
    shardSources.coups++;
  }
  if (withNewSystems && random() < ARTIFACT_FIND_CHANCE) findArtifact(now);
  // Minerai déterré au coup de pioche, dans la zone frappée
  const oreTier = zoneMaterial(progress.zone);
  if (oreTier !== null && random() < ORE_FIND_CHANCE * GALLERIES[gallery].modifiers.ores) ores[oreTier]++;
  dealDamage(now, hit.damage);
}

/** Un événement de mine apparaît : le joueur simulé en touche 80 %, et la pluie de cristaux en entier. */
function mineEvent(now: number): void {
  eventsSeen++;
  if (eventRandom() >= EVENT_TOUCH_RATE) return;
  record('eventsTouched');
  const id = rollEventId(eventRandom);
  const gain = eventGain(id, permanentProfile().stats);
  const times = id === 'crystalRain' ? CRYSTAL_RAIN_COUNT : 1;
  gold += gain.gold * times;
  goldEvents += gain.gold * times;
  shards += gain.shards * times;
  shardSources.evenements += gain.shards * times;
  const tier = zoneMaterial(progress.zone);
  if (tier !== null) ores[tier] += gain.ores * times;
}

// ─── Boucle ─────────────────────────────────────────────────────────────────
let lastSeen = 0;
let lastDecisionAt = 0;
for (let day = 0; day < days; day++) {
  dayBaseline = counters;
  dailyClaimed = new Set();
  chestClaimed = false;
  const forgesBefore = forges;
  const shardsBefore = { ...shardSources };
  let abyssPlayedToday = false;
  for (const [startHour, minutes] of SESSIONS[profile]) {
    const start = day * DAY + startHour * HOUR;
    const end = start + minutes * 60;
    if (start > lastSeen && profile !== 'continu') {
      const permanent = permanentProfile();
      const gains = offlineGains(
        permanent.stats,
        (start - lastSeen) * 1000,
        permanent.offlineEfficiency + tavernBonus(camp.levels),
        offlineCapMs(camp.levels),
      );
      gold += gains.gold;
      goldOffline += gains.gold;
      shards += gains.shards;
      shardSources.absence += gains.shards;
    }
    runExpeditions(start);
    collectWell(start);
    if (!abyssPlayedToday) {
      playAbyss();
      abyssPlayedToday = true;
    }
    // Les sorts reprennent prêts à chaque session : le joueur les relance en revenant
    for (const slot of spellSlots) {
      slot.readyAt = Math.min(slot.readyAt, start);
      slot.activeUntil = 0;
    }
    companionAbilityTimer.readyAt = Math.min(companionAbilityTimer.readyAt, start);
    companionAbilityTimer.activeUntil = 0;
    let now = start;
    let nextDecision = now;
    // Le compte à rebours des événements ne tourne qu'en jeu : il repart à chaque session
    let nextEventAt = now + nextEventDelayMs(eventRandom) / 1000;
    while (now < end) {
      const interval = 1 / hitsPerSecond(profileNow.stats);
      strike(now, interval);
      now += interval;
      if (withEvents && now >= nextEventAt) {
        mineEvent(now);
        nextEventAt = now + nextEventDelayMs(eventRandom) / 1000;
      }
      if (now >= nextDecision) {
        claimMissions();
        forgeAll(now);
        tryEvolve(now);
        if (artifactSlots() !== artifacts.slots.filter((id) => id !== null).length && Object.keys(artifacts.owned).length > artifacts.slots.filter((id) => id !== null).length) equipBestArtifact(now);
        payPickaxe(now);
        runChallenge(now);
        tendCompanions(now);
        payWorkshop(now);
        payCamp(now);
        lastDecisionAt = now;
        nextDecision = now + 5;
      }
    }
    lastSeen = end;
  }
  reforgeArtifacts(lastSeen);
  craftRunes();
  craftGearRunes();
  awakenGear(lastSeen);
  maybeRebirth(lastSeen);
  const got = (key: keyof typeof shardSources): number => shardSources[key] - shardsBefore[key];
  if (day < 3 || (day + 1) % 7 === 0 || day === days - 1) {
    daily.push(
      `j${day + 1} : zone ${progress.zone}-${progress.stage}, pioche ${pickaxe.level}, forme ${EVOLUTION_FORMS[formIndex].label}, ` +
        `Puissance ${big(powerOf(permanentProfile().stats))}, ${forges - forgesBefore} forges (éclats : coups ${got('coups')}, filons ${got('filons')}, ` +
        `zones ${got('zones')}, missions ${got('missions')}, absence ${got('absence')}, événements ${got('evenements')}), or en stock ${big(gold)}, ` +
        `points ${pointsSpent(ranks)}/${pointsEarned(progress.zone)}, artefacts ${Object.keys(artifacts.owned).length}, ` +
        `atelier ${workshopSummary()} (×${workshopPower().toFixed(2)}), ` +
        `campement ${BUILDING_IDS.map((id) => buildingLevel(camp.levels, id)).join('/')}, puits record ${abyssRecord}`,
    );
  }
}

console.log(`Profil ${profile}, ${days} jours${withNewSystems ? '' : ' (sans arbre, sorts ni artefacts)'}\n`);
console.log(milestones.join('\n'));
console.log('');
console.log(daily.join('\n'));
if (withRebirth) {
  console.log(`\nRenaissances (${rebirthState.count}) :\n  ${lives.join('\n  ') || 'aucune'}`);
}
if (withAwakening) {
  console.log(
    `\nÉveil (Divin corrompu) : les 5 pièces à l'Éveil ${awakeningDays.map((day, index) => `${index + 1} ${day}`).join(', ') || 'jamais atteint'} ; ` +
      `paliers ${SLOT_IDS.map((slot) => `${slot} ${awakeningState.levels[slot] ?? 0}`).join(', ')}`,
  );
}
console.log(`\nOr gagné : minage ${big(goldMined)}, absence ${big(goldOffline)}, ventes ${big(goldFromSales)} (${sold} objets), événements ${big(goldEvents)} (${eventsSeen} apparus)`);
console.log(`Éclats sur la partie : ${Object.entries(shardSources).map(([key, value]) => `${key} ${value}`).join(', ')}`);
const pct = (value: number): string => `${Math.round(value * 100)} %`;
const finalProfile = permanentProfile();
const finalStats = finalProfile.stats;
console.log(
  `Stats finales : Frappe ${big(finalStats.strikePower)}, Vitesse +${pct(finalStats.miningSpeed)}, Critique ${pct(finalStats.critChance)}, ` +
    `Dégâts crit. +${pct(finalStats.critDamage)}, Bonus d'or +${pct(finalStats.goldBonus)}`,
);
if (withNewSystems) {
  const gearOnly = minerProfile(gear, [NO_BONUSES], NO_BUFFS);
  console.log(
    `Apport final : arbre + artefact ×${(powerOf(finalStats) / powerOf(gearOnly.stats)).toFixed(2)} de Puissance, ` +
      `explosions ${pct(blastDamage / totalDamage)} des dégâts, compétence du familier ${pct(abilityDamage / totalDamage)}, sorts équipés ${spellSlots.map((slot) => slot.spell).join(', ')}, ` +
      `artefacts portés ${artifacts.slots.filter((id) => id !== null).map((id) => `${id} niv. ${artifacts.owned[id as ArtifactId]}`).join(', ') || 'aucun'}, ` +
      `réforges ${artifactReforges} (${artifactReforgesKept} gardées), ` +
      `ressources du Cœur ${essencesEarned} récoltées, ${runesCreated} runes créées, ${runesGrown} croissances, ` +
      `anneau ${heartForge.sockets.filter(Boolean).length}/${RING_SOCKETS}, ` +
      `${artifactsFound} trouvés, ${Object.keys(artifacts.owned).length} différents`,
  );
}
if (withWorkshop) {
  console.log(
    `Atelier : pièces portées ${workshopSummary()}, ` +
      `×${workshopPower().toFixed(2)} de Puissance, ${big(goldWorkshop)} d'or dépensé`,
  );
}
if (withAbyss) {
  console.log(
    `Puits sans fond : record ${abyssRecord} étages, ${(abyssFloorsTotal / Math.max(abyssRuns, 1)).toFixed(1)} étages par descente en moyenne, ` +
      `${abyssRuns} descentes, ${abyssShards} éclats, ${abyssStones} pierres d'éveil`,
  );
}
if (withCamp) {
  console.log(
    `Campement : ${BUILDING_IDS.map((id) => `${id} ${buildingLevel(camp.levels, id)}`).join(', ')}, ${big(goldCamp)} d'or dépensé, ` +
      `${shardSources.puits} éclats du puits`,
  );
}
console.log(`Galeries (${galleryStrategy}) : ${Object.entries(galleryCounts).map(([id, count]) => `${id} ${count}`).join(', ')}`);
if (withCompanions) {
  const owned = COMPANION_IDS.filter((id) => companions.owned[id] !== undefined).map((id) => `${id} ${companions.owned[id]?.stars}★`);
  const without = powerOf(minerProfile(gear, families().slice(0, 2), NO_BUFFS).stats);
  console.log(
    `Compagnons : ${eggsFound} œufs, ${owned.join(', ')}, actif ${companions.active}, ×${(powerOf(finalStats) / without).toFixed(2)} de Puissance, ` +
      `premier légendaire ${legendaryAt || 'jamais'}, ${challengesPlayed} défis, ${(challengeMilestonesReached / Math.max(challengesPlayed, 1)).toFixed(1)} paliers par défi, ${companions.stones} pierres en stock`,
  );
}
console.log(
  `Gardiens : ${guardianFails} échecs (${Object.entries(guardianFailsByZone).map(([zone, fails]) => `z${zone}×${fails}`).join(', ') || 'aucun'}), ` +
    `réussis en ${guardianKills.join(', ')}`,
);
console.log(`Minerais en stock : ${TIER_IDS.filter((t) => ores[t] > 0).map((t) => `${t} ${ores[t]}`).join(', ')}`);

/** Tirages du Puits séparés de ceux de la mine : ajouter le mini-jeu ne change pas le reste de la partie simulée. */
function mulberryForAbyss(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
