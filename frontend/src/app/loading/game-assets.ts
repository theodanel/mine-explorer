// Liste unique des fichiers à charger avant d'afficher le jeu.
import { GALLERY_IDS, type GalleryId } from '../balance/galleries';
import type { EvolutionId } from '../balance/balance';
import { ARTIFACT_IDS, type ArtifactId } from '../balance/artifacts';
import { RARITY_IDS, type Rarity, SKILL_NODES, SPELL_IDS, type SpellId } from '../balance/skill-tree';
import { COMPANION_IDS, type CompanionId } from '../balance/companions';
import { TIER_IDS, type SlotId, type TierId } from '../equipment/equipment.model';

/**
 * Animation de frappe d'une forme, chargée par Pixi (elle reste en cache dans Assets).
 * Toutes ont 23 images à 12 i/s avec l'impact sur la même image : la cadence de minage
 * (BASE_HITS_PER_SECOND) ne dépend donc pas de la forme. Les décalages sont en pixels de la frame source.
 */
export interface StrikeAnimation {
  readonly atlasUrl: string;
  readonly scale: number;
  /** La pioche élargit la frame vers la droite : on décale pour centrer le corps, pas la frame. */
  readonly bodyOffsetX: number;
  /** Pointe de la pioche à l'impact, par rapport à l'ancre (bas-centre) de la frame. */
  readonly impactOffset: { readonly x: number; readonly y: number };
}

/** L'Apprenti sert aussi de métronome invisible aux formes qui n'ont encore qu'une image fixe. */
export const APPRENTICE_STRIKE: StrikeAnimation = {
  atlasUrl: 'assets/characters/miner/atlas_pickaxe_swing_v2.json',
  // Réduit pour laisser la place aux colonnes d'équipement de chaque côté
  scale: 0.58,
  bodyOffsetX: 40,
  impactOffset: { x: 118, y: -41 },
};

// Les formes évoluées sont affichées à environ 300 px de haut, comme leurs images fixes
const MINER_STRIKE: StrikeAnimation = {
  atlasUrl: 'assets/characters/evolutions/mineur-frappe.json',
  // Images de 480 × 365 découpées par art-source/animations/decouper-frappe.py ; mesures sur ses grilles
  scale: 0.83,
  bodyOffsetX: 75,
  impactOffset: { x: 78, y: -35 },
};

const FOREMAN_STRIKE: StrikeAnimation = {
  atlasUrl: 'assets/characters/evolutions/contremaitre-frappe.json',
  scale: 0.85,
  bodyOffsetX: 85,
  impactOffset: { x: 119, y: -44 },
};

const LEGEND_STRIKE: StrikeAnimation = {
  atlasUrl: 'assets/characters/evolutions/legende-frappe.json',
  // Images de 397 × 360 découpées par art-source/animations/decouper-frappe.py ; mesures sur ses grilles
  scale: 0.83,
  bodyOffsetX: 5,
  impactOffset: { x: 122, y: -30 },
};

const HEART_STRIKE: StrikeAnimation = {
  atlasUrl: 'assets/characters/evolutions/coeur-frappe.json',
  // Images de 432 × 368 découpées par art-source/animations/decouper-frappe.py ; mesures sur ses grilles
  scale: 0.83,
  bodyOffsetX: 56,
  impactOffset: { x: 74, y: -18 },
};

const MASTER_STRIKE: StrikeAnimation = {
  atlasUrl: 'assets/characters/evolutions/maitre-frappe.json',
  // Les cornes du casque le rendent plus haut que le Contremaître
  scale: 0.8,
  bodyOffsetX: 83,
  impactOffset: { x: 120, y: -45 },
};

interface ZoneBackground {
  /** Image fixe : le décor, et l'image de secours d'un décor animé (premier chargement, vidéo indisponible). */
  readonly url: string;
  /** Décor animé en boucle (vidéo sans son, même cadrage que l'image), ou null. */
  readonly videoUrl: string | null;
  /** Hauteur du sol plat dans la scène 720×1280, l'image étirée en plein écran. */
  readonly floorY: number;
}

/**
 * Décors animés : une boucle sans couture préparée par art-source/backgrounds/boucler-video.py. La première image de
 * la vidéo de Gemini est l'image fixe, donc le cadrage et le sol sont les mêmes.
 */
const ZONE_VIDEOS: Readonly<Record<number, string>> = { 20: 'assets/backgrounds/zone20.mp4' };

/**
 * Fonds larges dont le bord gauche continue le bord droit, pour le héros qui avance d'un filon au suivant
 * (art-source/backgrounds/preparer-fond-large.py). Le sol est mesuré sur l'image ramenée à 1280 px de haut, au milieu
 * de la bande de terre battue. Une zone sans fond large défile avec son fond habituel mis bout à bout en miroir.
 */
export const WIDE_BACKGROUNDS: Readonly<Partial<Record<number, { readonly url: string; readonly floorY: number }>>> = {
  1: { url: 'assets/backgrounds/zone1-large.webp', floorY: 885 },
};

/**
 * Marche de profil de l'Apprenti, découpée par art-source/animations/decouper-marche.py : un cycle de deux pas. Le corps
 * fait 360 px dans l'atlas, ramené aux 259 px de l'Apprenti à l'écran (446 px de frappe × 0,58). Le numéro de version
 * change à chaque nouvelle vidéo : les images gardent un jour en cache et l'ancienne marche resterait affichée.
 */
export const APPRENTICE_WALK = {
  atlasUrl: 'assets/characters/miner/apprenti-marche-v3.json',
  animation: 'walk',
  scale: 0.72,
} as const;

/** Le fond de la zone 1 a son sol plus bas que les fonds suivants, peints d'après un autre gabarit. */
const ZONE1_FLOOR_Y = 850;
const OTHER_ZONES_FLOOR_Y = 735;

/**
 * Hauteur du sol des décors des zones 11 à 20, mesurée sur chaque image : Gemini ne pose pas le sol tout à fait
 * au même endroit d'une image à l'autre.
 */
const DEEP_ZONES_FLOOR_Y: Readonly<Record<number, number>> = {
  11: 744, 12: 752, 13: 728, 14: 680, 15: 707, 16: 742, 17: 748, 18: 758, 19: 748, 20: 686,
};

/** Zones dont le rocher n'est pas encore livré : elles reprennent celui d'une zone proche (obsidienne → magma). */
const STAND_IN_ROCK_ZONE: Readonly<Record<number, number>> = { 14: 9 };

/** Dernière zone qui a son propre décor ; au-delà, on reste dans le Cœur du monde. */
export const LAST_DECORATED_ZONE = 20;

/** Zone dont on affiche le décor : au-delà de la dernière, on reste dans le Cœur du monde. */
function visualZone(zone: number): number {
  return Math.min(Math.max(zone, 1), LAST_DECORATED_ZONE);
}

/** Un fond par zone : les paliers de matériaux jusqu'à Divin en zone 10, puis la mine de plus en plus étrange. */
export function zoneBackground(zone: number): ZoneBackground {
  const shown = visualZone(zone);
  const floorY = shown === 1 ? ZONE1_FLOOR_Y : (DEEP_ZONES_FLOOR_Y[shown] ?? OTHER_ZONES_FLOOR_Y);
  return { url: `assets/backgrounds/zone${shown}.webp`, videoUrl: ZONE_VIDEOS[shown] ?? null, floorY };
}

/**
 * Rocher que frappe le mineur, un par zone et assorti à son décor. Les images viennent de Gemini
 * (prompts dans docs/game-design/prompts-gemini.md et zones-11-20.md) : tant qu'une image manque, la scène
 * n'affiche que la barre de vie.
 */
export function rockUrl(zone: number): string {
  const shown = visualZone(zone);
  return `assets/rocks/zone${STAND_IN_ROCK_ZONE[shown] ?? shown}.webp`;
}

/** Images de l'interface, préchargées pour éviter qu'elles n'apparaissent une à une au lancement. */
export const UI_IMAGES: readonly string[] = [
  'assets/ui/coin.webp',
  'assets/ui/geode-shard.webp',
  'assets/ui/forge-icon.webp',
  'assets/ui/forge-anvil.webp',
  'assets/ui/miner-portrait.webp',
  'assets/ui/helmet.webp',
  'assets/ui/pickaxe.webp',
  'assets/ui/backpack.webp',
  'assets/ui/gloves.webp',
  'assets/ui/boots.webp',
];

/** Icônes peintes des sorts, des compétences passives, des artefacts et de la barre de menus (planches Gemini découpées). */
export function spellIconUrl(spell: SpellId): string {
  return `assets/ui/spells/${spell}.webp`;
}

/**
 * Les sceaux n'ont pas encore d'icône peinte : celle de Poigne solide (Frappe, comme eux) les remplace en attendant.
 * Une icône manquante bloque tout le chargement du jeu, puisque les icônes sont préchargées.
 */
const SEAL_ICON_STAND_IN = 'firmGrip';

export function skillIconUrl(nodeId: string): string {
  const node = SKILL_NODES.find((candidate) => candidate.id === nodeId);
  if (node?.kind === 'spell') {
    return spellIconUrl(node.spell);
  }
  return `assets/ui/skills/${node?.branch === 'seals' ? SEAL_ICON_STAND_IN : nodeId}.webp`;
}

export function artifactIconUrl(artifact: ArtifactId): string {
  return `assets/ui/artifacts/${artifact}.webp`;
}

/** Icône peinte d'un matériau : minerais, paliers de forge, filtres. */
export function materialIconUrl(tier: TierId): string {
  return `assets/ui/materials/${tier}.webp`;
}

export const MENU_ICONS = {
  skills: 'assets/ui/menu/skills.webp',
  artifacts: 'assets/ui/menu/artifacts.webp',
  companions: 'assets/ui/menu/companions.webp',
  workshop: 'assets/ui/menu/workshop.webp',
  adventures: 'assets/ui/aventures/aventures.webp',
} as const;

/** Visuels des Aventures (planche 11 et deux fonds, Gemini) : chargés avec leurs pages. */
export const ADVENTURE_IMAGES = {
  abyssCard: 'assets/ui/aventures/puits-sans-fond.webp',
  campCard: 'assets/ui/aventures/campement.webp',
  tavern: 'assets/ui/aventures/taverne.webp',
  warehouse: 'assets/ui/aventures/entrepot.webp',
  well: 'assets/ui/aventures/puits.webp',
  record: 'assets/ui/aventures/record.webp',
  hourglass: 'assets/ui/aventures/sablier.webp',
  trapRock: 'assets/ui/aventures/rocher-piege.webp',
  guardianRock: 'assets/ui/aventures/gardien.webp',
  abyssBackground: 'assets/backgrounds/aventure-puits.webp',
  campBackground: 'assets/backgrounds/aventure-campement.webp',
} as const;

/** Fond d'une page d'aventure : le décor, assombri pour que le texte reste lisible par-dessus. */
export function pageBackground(url: string): string {
  return `linear-gradient(rgb(20 12 6 / 55%), rgb(20 12 6 / 70%)), url(${url})`;
}

/** Préchargées avec l'interface : la barre de menus et les sorts s'affichent sans clignoter. */
/** Visuels des événements de mine (planche 6 et rat voleur). La géode a 4 états, du plus fermé au plus ouvert. */
export const EVENT_IMAGES = {
  geode: ['assets/events/geode-1.webp', 'assets/events/geode-2.webp', 'assets/events/geode-3.webp', 'assets/events/geode-4.webp'],
  chestClosed: 'assets/events/chest-closed.webp',
  chestOpen: 'assets/events/chest-open.webp',
  crystal: 'assets/events/crystal.webp',
  coinSack: 'assets/events/coin-sack.webp',
  /** Bande de 20 images de 240 × 180 px : la course du rat en boucle. */
  ratStrip: 'assets/events/rat-thief.webp',
} as const;

/**
 * Visuels du Marchand nain (images Gemini, préparées par art-source/aventures/preparer-aventures.py) : le nain et
 * sa mule, et son étal en fond. Les traces de pas attendent encore leur image.
 */
export const MERCHANT_IMAGES = {
  merchant: 'assets/ui/aventures/marchand.webp',
  stall: 'assets/backgrounds/aventure-marchand.webp',
  footprints: null as string | null,
} as const;

/**
 * Visuels de la Forge express : l'enclume de la Forge, et les images Gemini du lingot, du marteau et de la carte.
 */
export const FORGE_EXPRESS_IMAGES = {
  anvil: 'assets/ui/forge-anvil.webp',
  hammer: 'assets/ui/aventures/marteau.webp',
  ingot: 'assets/ui/aventures/lingot.webp',
  card: 'assets/ui/aventures/forge-carte.webp',
  background: 'assets/backgrounds/zone5.webp',
} as const;

/**
 * Visuels de l'Expédition aux flambeaux : les images Gemini (carte, torche, monstre, dalle du sol), et ceux du jeu
 * pour le reste (fiole du mineur pour l'huile, coffres, pierres d'éveil, rocher de la zone 4).
 */
export const TORCHLIGHT_IMAGES = {
  card: 'assets/ui/aventures/flambeaux-carte.webp',
  torch: 'assets/ui/aventures/torche.webp',
  floor: 'assets/ui/aventures/case-sol.webp',
  background: 'assets/backgrounds/zone6.webp',
  miner: 'assets/evolutions/legende-portrait.webp',
  monster: 'assets/ui/aventures/monstre.webp',
  wall: 'assets/rocks/zone4.webp',
  stones: 'assets/ui/refonte/awakening-stone.webp',
  chest: EVENT_IMAGES.coinSack,
  oil: 'assets/ui/artifacts/minersFlask.webp',
  treasure: EVENT_IMAGES.chestClosed,
  treasureOpen: EVENT_IMAGES.chestOpen,
} as const;

/** Visuels de la Chasse au filon : tous déjà dans le jeu (rochers des zones, éboulement, coffre, pépite, bois). */
export const MINEHUNT_IMAGES = {
  card: EVENT_IMAGES.chestClosed,
  background: 'assets/backgrounds/zone4.webp',
  chest: EVENT_IMAGES.chestOpen,
  nugget: 'assets/ui/refonte/coin-small.webp',
  /** L'éboulement qui tombe et emporte la cagnotte. */
  caveIn: 'assets/ui/aventures/eboulement.webp',
  /** Les étais, en bois de mine. */
  prop: 'assets/ui/materials/wood.webp',
} as const;

/** Vignette de chaque galerie des embranchements (planche 7). */
export function galleryIconUrl(id: GalleryId): string {
  return `assets/galleries/${id}.webp`;
}

/** Portrait de chaque compagnon (planche 8). */
export function companionIconUrl(id: CompanionId): string {
  return `assets/companions/${id}.webp`;
}

/** Œuf de chaque rareté (planche 9). */
export function eggIconUrl(rarity: Rarity): string {
  return `assets/companions/eggs/${rarity}.webp`;
}

/**
 * Compagnons animés dans la mine : une bande d'images en boucle à 12 i/s, tirée de leur vidéo.
 * Les autres s'affichent en image fixe en attendant leur vidéo.
 */
export const COMPANION_ANIMATIONS: Readonly<Partial<Record<CompanionId, { readonly url: string; readonly frames: number; readonly frameWidth: number; readonly frameHeight: number }>>> = {
  canary: { url: 'assets/companions/canary-idle.webp', frames: 24, frameWidth: 192, frameHeight: 200 },
  dragonling: { url: 'assets/companions/dragonling-idle.webp', frames: 33, frameWidth: 199, frameHeight: 200 },
};

/** Icône de la loterie du jour (roue de la fortune), près du bandeau de zone. */
export const LOTTERY_ICON = 'assets/ui/refonte/lottery.webp';

/** Icônes de la refonte (planche 10) : pierre d'éveil, trophée du Défi, parchemin des stats, et la bannière du Défi. */
export const REFONTE_IMAGES = {
  awakeningStone: 'assets/ui/refonte/awakening-stone.webp',
  challengeTrophy: 'assets/ui/refonte/challenge-trophy.webp',
  statsScroll: 'assets/ui/refonte/stats-scroll.webp',
  challengeBanner: 'assets/ui/refonte/challenge-banner.webp',
} as const;

export const ICON_IMAGES: readonly string[] = [
  ...Object.values(REFONTE_IMAGES),
  ...COMPANION_IDS.map(companionIconUrl),
  ...RARITY_IDS.map(eggIconUrl),
  ...GALLERY_IDS.map(galleryIconUrl),
  ...EVENT_IMAGES.geode,
  EVENT_IMAGES.chestClosed,
  EVENT_IMAGES.chestOpen,
  EVENT_IMAGES.crystal,
  EVENT_IMAGES.coinSack,
  EVENT_IMAGES.ratStrip,
  ...Object.values(MENU_ICONS),
  ...SPELL_IDS.map(spellIconUrl),
  ...SKILL_NODES.filter((node) => node.kind === 'passive').map((node) => skillIconUrl(node.id)),
  ...ARTIFACT_IDS.map(artifactIconUrl),
  ...TIER_IDS.map(materialIconUrl),
];

/** Corps du mineur : animé quand la forme a son animation de frappe, sinon une image fixe en attendant. */
export type EvolutionBody =
  | { readonly kind: 'animated'; readonly strike: StrikeAnimation }
  | { readonly kind: 'static'; readonly url: string };

interface EvolutionVisual {
  readonly portraitUrl: string;
  readonly body: EvolutionBody;
}

export const EVOLUTION_VISUALS: Readonly<Record<EvolutionId, EvolutionVisual>> = {
  apprentice: { portraitUrl: 'assets/ui/miner-portrait.webp', body: { kind: 'animated', strike: APPRENTICE_STRIKE } },
  miner: { portraitUrl: 'assets/evolutions/mineur-portrait.webp', body: { kind: 'animated', strike: MINER_STRIKE } },
  foreman: { portraitUrl: 'assets/evolutions/contremaitre-portrait.webp', body: { kind: 'animated', strike: FOREMAN_STRIKE } },
  master: { portraitUrl: 'assets/evolutions/maitre-portrait.webp', body: { kind: 'animated', strike: MASTER_STRIKE } },
  legend: { portraitUrl: 'assets/evolutions/legende-portrait.webp', body: { kind: 'animated', strike: LEGEND_STRIKE } },
  heart: { portraitUrl: 'assets/evolutions/coeur-portrait.webp', body: { kind: 'animated', strike: HEART_STRIKE } },
};

/**
 * Animation qui cadence les coups au lancement : celle de la forme, ou celle de l'Apprenti (rendu invisible) sous une
 * forme en image fixe.
 */
export function cadenceStrike(form: EvolutionId): StrikeAnimation {
  const { body } = EVOLUTION_VISUALS[form];
  return body.kind === 'animated' ? body.strike : APPRENTICE_STRIKE;
}

/**
 * Fichiers du corps d'une forme à précharger. L'Apprenti (0,9 Mo) n'est chargé que s'il cadence une forme en image
 * fixe : un joueur évolué ne le télécharge plus.
 */
export function bodyAssetUrls(form: EvolutionId): readonly string[] {
  const { body } = EVOLUTION_VISUALS[form];
  return body.kind === 'animated' ? [body.strike.atlasUrl] : [APPRENTICE_STRIKE.atlasUrl, body.url];
}

/** Icône de la pioche selon son matériau. Bois et Fer n'ont pas encore la leur : l'icône générique les remplace. */
const PICKAXE_ICONS: Readonly<Partial<Record<TierId, string>>> = {
  stone: 'assets/ui/pickaxes/pierre.webp',
  copper: 'assets/ui/pickaxes/cuivre.webp',
  steel: 'assets/ui/pickaxes/acier.webp',
  gold: 'assets/ui/pickaxes/or.webp',
  mithril: 'assets/ui/pickaxes/mithril.webp',
  crystal: 'assets/ui/pickaxes/cristal.webp',
  magma: 'assets/ui/pickaxes/magma.webp',
  divine: 'assets/ui/pickaxes/divin.webp',
};

/** Pièces Divin éveillées (Divin corrompu) : obsidienne veinée de lave, dès l'Éveil 1. */
const CORRUPTED_ICONS: Readonly<Record<SlotId, string>> = {
  helmet: 'assets/ui/divin-corrompu/helmet.webp',
  pickaxe: 'assets/ui/divin-corrompu/pickaxe.webp',
  bag: 'assets/ui/divin-corrompu/bag.webp',
  gloves: 'assets/ui/divin-corrompu/gloves.webp',
  boots: 'assets/ui/divin-corrompu/boots.webp',
};

/**
 * Icône d'un objet : la version corrompue d'une pièce Divin éveillée, celle de son matériau pour une pioche, sinon
 * celle de l'emplacement.
 */
export function itemIconUrl(slot: SlotId, tier: TierId | null, slotIconUrl: string, awakening = 0): string {
  if (tier === 'divine' && awakening > 0) {
    return CORRUPTED_ICONS[slot];
  }
  return slot === 'pickaxe' && tier !== null ? (PICKAXE_ICONS[tier] ?? slotIconUrl) : slotIconUrl;
}
