// Liste unique des fichiers à charger avant d'afficher le jeu.

/** Chargés par Pixi : ils restent en cache dans Assets et la scène les récupère sans nouveau téléchargement. */
export const MINER_ATLAS_URL = 'assets/characters/miner/atlas_pickaxe_swing_v2.json';

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
