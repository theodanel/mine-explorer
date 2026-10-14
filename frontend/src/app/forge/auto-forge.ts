import { computed, DestroyRef, DOCUMENT, inject, Injectable, signal } from '@angular/core';

import { sellPrice } from '../equipment/equipment-rules';
import { Inventory } from '../equipment/inventory';
import { readStorage, writeStorage } from '../shared/local-storage';
import { ForgeFilters, hasFilters, isValidFilters, NO_FILTERS, passesFilters } from './auto-forge-rules';
import { Workshop } from '../workshop/workshop';

const STORAGE_KEY = 'mine-explorer.auto-forge';
/**
 * La forge automatique vérifie souvent si elle peut tirer ; c'est l'animation de forge (0,9 s, voir Inventory)
 * qui fixe le rythme : un tirage ne part qu'une fois le précédent montré.
 */
const FORGE_INTERVAL_MS = 250;

interface AutoForgeSettings {
  readonly enabled: boolean;
  readonly filters: ForgeFilters;
}

const DEFAULT_SETTINGS: AutoForgeSettings = { enabled: false, filters: NO_FILTERS };

/**
 * Forge automatique, comme dans les jeux idle : tant qu'il y a des éclats, la forge tire des objets.
 * Avec des filtres, un objet qui ne les passe pas est vendu tout seul ; sinon il est proposé et la forge
 * attend la décision du joueur. Sans filtre, chaque objet est proposé, et la forge reprend après la vente.
 */
@Injectable({ providedIn: 'root' })
export class AutoForge {
  private readonly inventory = inject(Inventory);
  private readonly workshop = inject(Workshop);
  private readonly document = inject(DOCUMENT);
  private readonly settings = signal<AutoForgeSettings>(loadSettings());
  private readonly soldCount = signal(0);
  private readonly soldGold = signal(0);
  private readonly lastSoldState = signal<{ readonly id: string; readonly price: number } | null>(null);

  readonly enabled = computed(() => this.settings().enabled);
  readonly filters = computed(() => this.settings().filters);
  readonly filtered = computed(() => hasFilters(this.filters()));
  /** Ventes automatiques depuis le lancement du jeu, pour voir ce que les filtres écartent. */
  readonly autoSold = this.soldCount.asReadonly();
  readonly autoSoldGold = this.soldGold.asReadonly();
  /** Dernier objet vendu par les filtres, pour l'afficher dans l'animation de forge. */
  readonly lastSold = this.lastSoldState.asReadonly();

  constructor() {
    const timer = setInterval(() => this.tick(), FORGE_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  setEnabled(enabled: boolean): void {
    this.save({ ...this.settings(), enabled });
  }

  setFilters(filters: ForgeFilters): void {
    this.save({ ...this.settings(), filters });
  }

  /** Un tirage si la forge est libre ; l'objet est vendu s'il ne passe pas les filtres. */
  tick(): void {
    // Onglet caché : la mine est arrêtée, la forge aussi
    if (!this.enabled() || this.document.hidden || !this.inventory.canForge()) {
      return;
    }
    if (!this.inventory.forge()) {
      return;
    }
    const item = this.inventory.pending();
    if (item !== null && this.filtered() && !passesFilters(item, this.filters(), this.inventory.equipped(), this.workshop.levels())) {
      const price = sellPrice(item);
      this.inventory.sellPending();
      this.soldCount.update((count) => count + 1);
      this.soldGold.update((gold) => gold + price);
      this.lastSoldState.set({ id: item.id, price });
    }
  }

  private save(next: AutoForgeSettings): void {
    this.settings.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadSettings(): AutoForgeSettings {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return DEFAULT_SETTINGS;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value === 'object' && value !== null) {
      const { enabled, filters } = value as Record<string, unknown>;
      if (typeof enabled === 'boolean' && isValidFilters(filters)) {
        // Réglages d'avant l'option « toujours montrer » : elle part désactivée
        return { enabled, filters: { ...filters, keepFromTier: filters.keepFromTier ?? null } };
      }
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Réglages de la forge automatique invalides ignorés');
  return DEFAULT_SETTINGS;
}
