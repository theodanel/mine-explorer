// Équilibrage du passe de progression : une récompense tous les 5 filons, des zones 1 à 20.
// Lot 4 des idées inspirées de Forge Master (demande de Théo, 19/10/2026). Voir docs/game-design/passe-de-progression.md.
import type { TierId } from '../equipment/equipment.model';
import { STAGES_PER_ZONE, zoneMaterial } from './balance';

export const PASS_ZONES = 20;
/** Un palier tous les 5 filons : 3 par zone, 60 en tout. */
export const ROCKS_PER_PASS_TIER = 5;
export const PASS_TIERS_PER_ZONE = STAGES_PER_ZONE / ROCKS_PER_PASS_TIER;
export const PASS_TIER_COUNT = PASS_ZONES * PASS_TIERS_PER_ZONE;
/**
 * Éclats d'un palier : le numéro de la zone ; le dernier palier d'une zone en donne le double. La spec partait de
 * 5 × la zone et 5 minerais : au simulateur, les éclats du début (forges en plus quand chacune compte le plus)
 * avançaient la pioche 30 de 2,5 jours. À 1 × la zone et 2 minerais, l'écart tombe à 1 jour environ.
 */
const SHARDS_PER_ZONE = 1;
const ZONE_FINALE_SHARD_FACTOR = 2;
/** Minerai de la zone à chaque palier (la zone 1 n'en a pas). */
const PASS_ORES = 2;

/** Ce que rapporte un palier du passe. */
export interface PassTier {
  /** Numéro du palier, de 1 à 60. */
  readonly index: number;
  readonly zone: number;
  /** Filons à avoir épuisés depuis le début de la partie. */
  readonly rocks: number;
  readonly shards: number;
  readonly ore: { readonly tier: TierId; readonly amount: number } | null;
  /**
   * Dernier palier d'une zone : il réserve aussi une récompense de collection (tenue ou titre, lots 6 et 7), attribuée
   * d'après les paliers récupérés, donc jamais perdue même si elle arrive après.
   */
  readonly finale: boolean;
}

export function passTier(index: number): PassTier {
  const zone = Math.ceil(index / PASS_TIERS_PER_ZONE);
  const finale = index % PASS_TIERS_PER_ZONE === 0;
  const material = zoneMaterial(zone);
  return {
    index,
    zone,
    rocks: index * ROCKS_PER_PASS_TIER,
    shards: SHARDS_PER_ZONE * zone * (finale ? ZONE_FINALE_SHARD_FACTOR : 1),
    ore: material === null ? null : { tier: material, amount: PASS_ORES },
    finale,
  };
}

export const PASS_TIERS: readonly PassTier[] = Array.from({ length: PASS_TIER_COUNT }, (_, index) => passTier(index + 1));
