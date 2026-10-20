import {
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  Injectable,
  InjectionToken,
  signal,
  untracked,
} from '@angular/core';

import { Abyss } from '../abyss/abyss';
import { Progression } from '../progression/progression';
import { readStorage, removeStorage, storageEntries, writeStorage } from '../shared/local-storage';
import { OnlineAccount } from './online-account';
import { OnlineApi } from './online-api';
import { collectSave, isCloudSave, isSaveKey, isSaveReceipt, progressLabel, SaveData } from './online-rules';

/**
 * Version du cloud sur laquelle cet appareil s'est basé. Hors du préfixe « mine-explorer. » : elle décrit la
 * synchronisation de cet appareil et ne part pas dans le cloud.
 */
const SYNC_KEY = 'mine-explorer-cloud';
/** Envoi régulier pendant le jeu ; aussi à chaque fois que l'onglet passe en arrière-plan. */
const UPLOAD_EVERY_MS = 5 * 60 * 1000;
/**
 * Nouveau filon ou record du Puits : la partie part peu après, pour que le classement suive le jeu. Les progrès
 * rapprochés partent ensemble : au plus un envoi par délai, loin de la limite d'écritures du serveur.
 */
export const RANKED_UPLOAD_DELAY_MS = 15 * 1000;
const STAGES_PER_ZONE = 15;

/** Rechargement de la page après avoir pris la partie du cloud, injecté pour les tests. */
export const RELOAD = new InjectionToken<() => void>('RELOAD', {
  providedIn: 'root',
  factory: () => () => window.location.reload(),
});

export type SyncState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'syncing' }
  | { readonly kind: 'synced'; readonly at: string }
  /** Deux parties différentes : le joueur choisit laquelle garder. */
  | { readonly kind: 'conflict'; readonly cloudVersion: number; readonly cloudLabel: string; readonly localLabel: string }
  /** Le serveur a jugé la progression impossible : la partie locale reste intacte. */
  | { readonly kind: 'refused' }
  | { readonly kind: 'error' };

/**
 * Synchronisation de la partie avec le cloud, pour un joueur connecté. La sauvegarde locale reste la source du jeu :
 * le cloud en garde une copie, et la rend sur un autre appareil. Rien n'est jamais écrasé sans l'accord du joueur.
 */
@Injectable({ providedIn: 'root' })
export class CloudSync {
  private readonly api = inject(OnlineApi);
  private readonly account = inject(OnlineAccount);
  private readonly reload = inject(RELOAD);
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<SyncState>({ kind: 'idle' });
  private started = false;
  private rankedUpload: ReturnType<typeof setTimeout> | null = null;

  readonly state = this.current.asReadonly();

  constructor() {
    if (!this.account.enabled) {
      return;
    }
    effect(() => {
      if (this.account.signedIn() && !this.started) {
        this.started = true;
        void this.firstSync();
      } else if (!this.account.signedIn()) {
        this.started = false;
      }
    });
    this.uploadOnRankedProgress();
    const timer = setInterval(() => void this.upload(), UPLOAD_EVERY_MS);
    const onVisibilityChange = () => {
      if (this.document.hidden) {
        void this.upload();
      }
    };
    this.document.addEventListener('visibilitychange', onVisibilityChange);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      if (this.rankedUpload !== null) {
        clearTimeout(this.rankedUpload);
      }
      this.document.removeEventListener('visibilitychange', onVisibilityChange);
    });
  }

  /**
   * À la connexion : premier envoi si le cloud est vide (reprise de la partie locale), envoi normal si cet appareil
   * connaît déjà la version du cloud, choix du joueur sinon.
   */
  async firstSync(): Promise<void> {
    this.current.set({ kind: 'syncing' });
    const result = await this.api.get('/api/save');
    if (!result.ok && result.status === 404) {
      await this.send(null);
      return;
    }
    if (!result.ok || !isCloudSave(result.body)) {
      this.current.set({ kind: 'error' });
      return;
    }
    if (this.knownVersion() === result.body.version) {
      await this.send(result.body.version);
      return;
    }
    this.askChoice(result.body.version, result.body.data);
  }

  /** Envoi de la partie locale, si le joueur est connecté et qu'aucun choix n'est en attente. */
  async upload(): Promise<void> {
    const kind = this.current().kind;
    if (!this.account.signedIn() || kind === 'conflict' || kind === 'syncing' || kind === 'idle') {
      return;
    }
    await this.send(this.knownVersion());
  }

  /** Le joueur garde la partie de cet appareil : elle remplace celle du cloud. */
  async keepLocal(): Promise<void> {
    const state = this.current();
    if (state.kind === 'conflict') {
      await this.send(state.cloudVersion);
    }
  }

  /** Le joueur garde la partie du cloud : elle remplace celle de cet appareil, puis le jeu redémarre dessus. */
  async keepCloud(): Promise<void> {
    this.current.set({ kind: 'syncing' });
    const result = await this.api.get('/api/save');
    if (!result.ok || !isCloudSave(result.body)) {
      this.current.set({ kind: 'error' });
      return;
    }
    this.replaceLocal(result.body.data);
    this.rememberVersion(result.body.version);
    this.reload();
  }

  /** Chaque valeur classée qui monte (profondeur, record du Puits) programme un envoi, s'il n'y en a pas déjà un. */
  private uploadOnRankedProgress(): void {
    const progression = inject(Progression);
    const abyss = inject(Abyss);
    const depth = computed(() => {
      const { zone, stage } = progression.progress();
      return (zone - 1) * STAGES_PER_ZONE + stage;
    });
    let first = true;
    effect(() => {
      depth();
      abyss.record();
      // Au lancement, la partie part déjà avec la première synchronisation
      if (first) {
        first = false;
        return;
      }
      untracked(() => this.scheduleRankedUpload());
    });
  }

  private scheduleRankedUpload(): void {
    if (this.rankedUpload !== null) {
      return;
    }
    this.rankedUpload = setTimeout(() => {
      this.rankedUpload = null;
      void this.upload();
    }, RANKED_UPLOAD_DELAY_MS);
  }

  /** Après une suppression de compte ou une déconnexion : cet appareil ne connaît plus de version du cloud. */
  forget(): void {
    removeStorage(SYNC_KEY);
    this.current.set({ kind: 'idle' });
  }

  private async send(expectedVersion: number | null): Promise<void> {
    this.current.set({ kind: 'syncing' });
    const result = await this.api.write('PUT', '/api/save', { expectedVersion, data: this.localSave() });
    if (result.ok && isSaveReceipt(result.body)) {
      this.rememberVersion(result.body.version);
      this.current.set({ kind: 'synced', at: result.body.updatedAt });
    } else if (!result.ok && result.code === 'save-conflict') {
      await this.firstSync();
    } else if (!result.ok && result.code === 'implausible-progress') {
      this.current.set({ kind: 'refused' });
    } else {
      this.current.set({ kind: 'error' });
    }
  }

  private askChoice(cloudVersion: number, cloudData: SaveData): void {
    this.current.set({
      kind: 'conflict',
      cloudVersion,
      cloudLabel: progressLabel(cloudData),
      localLabel: progressLabel(this.localSave()),
    });
  }

  private localSave(): SaveData {
    return collectSave(storageEntries());
  }

  /** Remplace toutes les clés du jeu, y compris en retirant celles que la partie du cloud n'a pas. */
  private replaceLocal(data: SaveData): void {
    for (const key of Object.keys(this.localSave())) {
      if (!(key in data)) {
        removeStorage(key);
      }
    }
    for (const [key, value] of Object.entries(data)) {
      if (isSaveKey(key)) {
        writeStorage(key, value);
      }
    }
  }

  private knownVersion(): number | null {
    const raw = readStorage(SYNC_KEY);
    const version = raw === null ? NaN : Number(raw);
    return Number.isSafeInteger(version) && version >= 0 ? version : null;
  }

  private rememberVersion(version: number): void {
    writeStorage(SYNC_KEY, String(version));
  }
}
