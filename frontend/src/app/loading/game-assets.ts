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
const FOREMAN_STRIKE: StrikeAnimation = {
  atlasUrl: 'assets/characters/evolutions/contremaitre-frappe.json',
  scale: 0.85,
  bodyOffsetX: 85,
  impactOffset: { x: 119, y: -44 },
};

const MASTER_STRIKE: StrikeAnimation = {
  atlasUrl: 'assets/characters/evolutions/maitre-frappe.json',
  // Les cornes du casque le rendent plus haut que le Contremaître
  scale: 0.8,
  bodyOffsetX: 83,
  impactOffset: { x: 120, y: -45 },
};

interface ZoneBackground {
  readonly url: string;
  /** Hauteur du sol plat dans la scène 720×1280, l'image étirée en plein écran. */
  readonly floorY: number;
}

/** Le fond de la zone 1 a son sol plus bas que les fonds suivants, peints d'après un autre gabarit. */
const ZONE1_FLOOR_Y = 850;
const OTHER_ZONES_FLOOR_Y = 735;

/** Un fond par palier de matériau : Bois, Pierre, Cuivre… jusqu'à Divin en zone 10. */
const ZONE_BACKGROUNDS: readonly ZoneBackground[] = Array.from({ length: 10 }, (_, index) => ({
  url: `assets/backgrounds/zone${index + 1}.webp`,
  floorY: index === 0 ? ZONE1_FLOOR_Y : OTHER_ZONES_FLOOR_Y,
}));

/** Au-delà de la zone 10, on reste dans le sanctuaire Divin, le dernier palier, en attendant de nouveaux décors. */
export function zoneBackground(zone: number): ZoneBackground {
  const index = Math.min(Math.max(zone, 1), ZONE_BACKGROUNDS.length) - 1;
  return ZONE_BACKGROUNDS[index];
}

/** Images de l'interface, préchargées pour éviter qu'elles n'apparaissent une à une au lancement. */
export const UI_IMAGES: readonly string[] = [
  'assets/ui/coin.png',
  'assets/ui/geode-shard.png',
  'assets/ui/forge-icon.png',
  'assets/ui/miner-portrait.png',
  'assets/ui/helmet.png',
  'assets/ui/pickaxe.png',
  'assets/ui/backpack.png',
  'assets/ui/gloves.png',
  'assets/ui/boots.png',
];

/** Icônes peintes des sorts, des compétences passives, des artefacts et de la barre de menus (planches Gemini découpées). */
export function spellIconUrl(spell: SpellId): string {
  return `assets/ui/spells/${spell}.png`;
}

export function skillIconUrl(nodeId: string): string {
  const node = SKILL_NODES.find((candidate) => candidate.id === nodeId);
  return node?.kind === 'spell' ? spellIconUrl(node.spell) : `assets/ui/skills/${nodeId}.png`;
}

export function artifactIconUrl(artifact: ArtifactId): string {
  return `assets/ui/artifacts/${artifact}.png`;
}

/** Icône peinte d'un matériau : minerais, paliers de forge, filtres. */
export function materialIconUrl(tier: TierId): string {
  return `assets/ui/materials/${tier}.png`;
}

export const MENU_ICONS = {
  mine: 'assets/ui/menu/mine.png',
  skills: 'assets/ui/menu/skills.png',
  artifacts: 'assets/ui/menu/artifacts.png',
  companions: 'assets/ui/menu/companions.png',
  workshop: 'assets/ui/menu/workshop.png',
} as const;

/** Préchargées avec l'interface : la barre de menus et les sorts s'affichent sans clignoter. */
/** Visuels des événements de mine (planche 6 et rat voleur). La géode a 4 états, du plus fermé au plus ouvert. */
export const EVENT_IMAGES = {
  geode: ['assets/events/geode-1.png', 'assets/events/geode-2.png', 'assets/events/geode-3.png', 'assets/events/geode-4.png'],
  chestClosed: 'assets/events/chest-closed.png',
  chestOpen: 'assets/events/chest-open.png',
  crystal: 'assets/events/crystal.png',
  coinSack: 'assets/events/coin-sack.png',
  /** Bande de 20 images de 240 × 180 px : la course du rat en boucle. */
  ratStrip: 'assets/events/rat-thief.webp',
} as const;

/** Vignette de chaque galerie des embranchements (planche 7). */
export function galleryIconUrl(id: GalleryId): string {
  return `assets/galleries/${id}.png`;
}

/** Portrait de chaque compagnon (planche 8). */
export function companionIconUrl(id: CompanionId): string {
  return `assets/companions/${id}.png`;
}

/** Œuf de chaque rareté (planche 9). */
export function eggIconUrl(rarity: Rarity): string {
  return `assets/companions/eggs/${rarity}.png`;
}

/**
 * Compagnons animés dans la mine : une bande d'images en boucle à 12 i/s, tirée de leur vidéo.
 * Les autres s'affichent en image fixe en attendant leur vidéo.
 */
export const COMPANION_ANIMATIONS: Readonly<Partial<Record<CompanionId, { readonly url: string; readonly frames: number; readonly frameWidth: number; readonly frameHeight: number }>>> = {
  canary: { url: 'assets/companions/canary-idle.webp', frames: 24, frameWidth: 192, frameHeight: 200 },
  dragonling: { url: 'assets/companions/dragonling-idle.webp', frames: 33, frameWidth: 199, frameHeight: 200 },
};

export const ICON_IMAGES: readonly string[] = [
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
  apprentice: { portraitUrl: 'assets/ui/miner-portrait.png', body: { kind: 'animated', strike: APPRENTICE_STRIKE } },
  miner: { portraitUrl: 'assets/evolutions/mineur-portrait.webp', body: { kind: 'static', url: 'assets/evolutions/mineur.webp' } },
  foreman: { portraitUrl: 'assets/evolutions/contremaitre-portrait.webp', body: { kind: 'animated', strike: FOREMAN_STRIKE } },
  master: { portraitUrl: 'assets/evolutions/maitre-portrait.webp', body: { kind: 'animated', strike: MASTER_STRIKE } },
  legend: { portraitUrl: 'assets/evolutions/legende-portrait.webp', body: { kind: 'static', url: 'assets/evolutions/legende.webp' } },
};

/** Fichiers du corps d'une forme à précharger, en plus de l'Apprenti qui cadence toujours les coups. */
export function bodyAssetUrls(form: EvolutionId): readonly string[] {
  const { body } = EVOLUTION_VISUALS[form];
  const url = body.kind === 'animated' ? body.strike.atlasUrl : body.url;
  return url === APPRENTICE_STRIKE.atlasUrl ? [url] : [APPRENTICE_STRIKE.atlasUrl, url];
}

/** Icône de la pioche selon son matériau. Bois et Fer n'ont pas encore la leur : l'icône générique les remplace. */
const PICKAXE_ICONS: Readonly<Partial<Record<TierId, string>>> = {
  stone: 'assets/ui/pickaxes/pierre.png',
  copper: 'assets/ui/pickaxes/cuivre.png',
  steel: 'assets/ui/pickaxes/acier.png',
  gold: 'assets/ui/pickaxes/or.png',
  mithril: 'assets/ui/pickaxes/mithril.png',
  crystal: 'assets/ui/pickaxes/cristal.png',
  magma: 'assets/ui/pickaxes/magma.png',
  divine: 'assets/ui/pickaxes/divin.png',
};

/** Icône d'un objet : celle de son matériau pour une pioche, sinon celle de l'emplacement. */
export function itemIconUrl(slot: SlotId, tier: TierId | null, slotIconUrl: string): string {
  return slot === 'pickaxe' && tier !== null ? (PICKAXE_ICONS[tier] ?? slotIconUrl) : slotIconUrl;
}
