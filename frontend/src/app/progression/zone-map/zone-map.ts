import { AfterViewInit, Component, computed, ElementRef, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { zoneMaterial } from '../../balance/balance';
import { TIER_LABELS } from '../../equipment/equipment.model';
import { Evolution } from '../../evolution/evolution';
import { EVOLUTION_VISUALS, LAST_DECORATED_ZONE, materialIconUrl, zoneBackground } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Ores } from '../../ores/ores';
import { Progression } from '../progression';
import { Echoes } from '../../heart-forge/echoes';

/** Nom de chaque zone, d'après son décor. Au-delà, on reste dans les profondeurs du Cœur du monde. */
const ZONE_NAMES: readonly string[] = [
  'Galerie des racines',
  'Carrière de pierre',
  'Veines de cuivre',
  'Mine de fer',
  'Forge naine',
  "Caverne d'or",
  'Ruines elfiques',
  'Grotte de cristal',
  'Caverne de magma',
  'Sanctuaire divin',
  'Forêt souterraine',
  'Lac gelé',
  'Cité naine engloutie',
  "Grotte d'obsidienne",
  'Jardin de cristaux',
  'Nid de dragon',
  'Ruines anciennes',
  'Abysses',
  'Royaume des fées',
  'Cœur du monde',
];

/** Les zones à venir : on en voit toujours deux d'avance, et la carte va au moins jusqu'à la dernière décorée. */
const FUTURE_ZONES_SHOWN = 2;
/** Écart vertical entre deux étapes du chemin, et leur balancement gauche-droite (en % de largeur). */
const STEP_CQW = 34;
const SWAY = [50, 74, 62, 30, 26, 44];

export type ZoneStatus = 'done' | 'current' | 'future';

export function zoneName(zone: number): string {
  return ZONE_NAMES[zone - 1] ?? 'Profondeurs';
}

/**
 * Carte des zones, façon chemin de jeu mobile : de la zone 1 en bas jusqu'aux zones à venir en haut, voilées
 * d'un point d'interrogation. Toucher une zone terminée propose d'y revenir miner son minerai, sans fin.
 */
@Component({
  selector: 'app-zone-map',
  templateUrl: './zone-map.html',
  styleUrl: './zone-map.scss',
})
export class ZoneMap implements AfterViewInit {
  protected readonly progression = inject(Progression);
  protected readonly echoes = inject(Echoes);
  private readonly navigation = inject(Navigation);
  private readonly ores = inject(Ores);
  private readonly evolution = inject(Evolution);
  private readonly sound = inject(Sound);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly portrait = computed(() => EVOLUTION_VISUALS[this.evolution.form().id].portraitUrl);
  protected readonly selected = signal<number | null>(null);

  /** Étapes du chemin, de la plus profonde (en haut) à la zone 1 (en bas). */
  protected readonly nodes = computed(() => {
    const frontier = this.progression.zone();
    const farm = this.progression.farmZone();
    const last = Math.max(frontier + FUTURE_ZONES_SHOWN, LAST_DECORATED_ZONE);
    return Array.from({ length: last }, (_, index) => {
      const zone = index + 1;
      const status: ZoneStatus = zone < frontier ? 'done' : zone === frontier ? 'current' : 'future';
      const tier = zoneMaterial(zone);
      return {
        zone,
        status,
        here: zone === (farm ?? frontier),
        name: status === 'future' ? '???' : zoneName(zone),
        scene: `url(${zoneBackground(zone).url})`,
        material: tier === null ? null : { icon: materialIconUrl(tier), label: TIER_LABELS[tier] },
        left: SWAY[index % SWAY.length],
      };
    }).reverse();
  });
  /** Le chemin qui relie les étapes, en coordonnées de la carte (largeur 100, une étape = 1). */
  protected readonly path = computed(() => {
    const nodes = this.nodes();
    return nodes.map((node, index) => `${index === 0 ? 'M' : 'L'} ${node.left} ${index + 0.5}`).join(' ');
  });
  protected readonly stepCqw = STEP_CQW;

  /** La zone touchée, avec ce qu'on peut y faire. */
  protected readonly detail = computed(() => {
    const zone = this.selected();
    if (zone === null) {
      return null;
    }
    const node = this.nodes().find((candidate) => candidate.zone === zone);
    if (node === undefined) {
      return null;
    }
    const tier = zoneMaterial(zone);
    return { ...node, stock: tier === null ? null : this.ores.stock()[tier], farming: this.progression.farmZone() === zone };
  });

  ngAfterViewInit(): void {
    // On ouvre la carte sur la zone où l'on mine
    this.host.nativeElement.querySelector('.node.here')?.scrollIntoView({ block: 'center' });
  }

  protected select(zone: number): void {
    this.selected.set(this.selected() === zone ? null : zone);
  }

  /** Revient miner dans une zone passée : filons sans fin, son minerai, moins d'or. */
  protected farm(zone: number): void {
    if (this.echoes.enter(zone)) {
      this.sound.play('upgrade');
      this.navigation.open('mine');
    }
  }

  protected resume(): void {
    this.progression.stopFarm();
    this.sound.play('upgrade');
    this.navigation.open('mine');
  }

  protected close(): void {
    this.navigation.open('mine');
  }
}
