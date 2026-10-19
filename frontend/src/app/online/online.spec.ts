// Comptes et synchronisation contre un faux serveur : mêmes routes, codes d'erreur et jeton CSRF que le backend.
import { TestBed } from '@angular/core/testing';

import { Overlays } from '../shared/overlays';
import { PlayerName } from '../shared/player-name';
import { AccountCard } from './account-card/account-card';
import { AccountPrompt } from './account-prompt/account-prompt';
import { Progression } from '../progression/progression';
import { CloudSync, RANKED_UPLOAD_DELAY_MS, RELOAD } from './cloud-sync';
import { NAVIGATE, OnlineAccount } from './online-account';
import { FETCH } from './online-api';
import { ONLINE_CONFIG } from './online-config';

const API = 'http://api.test';
const PROFILE = { pseudo: 'Mineur-12', createdAt: '2026-10-14T00:00:00Z', providers: ['google'] };

interface CloudCopy {
  version: number;
  data: Record<string, string>;
}

interface SaveBody {
  readonly expectedVersion: number | null;
  readonly data: Record<string, string>;
}

/** Faux backend : un joueur, une partie dans le cloud, un jeton CSRF qui peut expirer. */
class FakeServer {
  signedIn = true;
  cloud: CloudCopy | null = null;
  csrfToken = 'jeton-1';
  refuseProgress = false;
  readonly calls: string[] = [];

  readonly fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method = init?.method ?? 'GET';
    const path = String(input).replace(API, '');
    this.calls.push(`${method} ${path}`);
    expect(init?.credentials).toBe('include');
    if (path === '/api/csrf') {
      return json(200, { headerName: 'X-XSRF-TOKEN', token: this.csrfToken });
    }
    const headers = (init?.headers ?? {}) as Record<string, string>;
    if (method !== 'GET' && headers['X-XSRF-TOKEN'] !== this.csrfToken) {
      return json(403, { code: 'csrf-invalid' });
    }
    if (!this.signedIn) {
      return json(401, { code: 'unauthenticated' });
    }
    const body = init?.body === undefined ? null : (JSON.parse(String(init.body)) as SaveBody);
    return this.route(method, path, body);
  };

  private route(method: string, path: string, body: SaveBody | null): Response {
    if (path === '/api/me') {
      return json(200, PROFILE);
    }
    if (path === '/api/save' && method === 'GET') {
      return this.cloud === null ? json(404, { code: 'no-save' }) : json(200, { ...this.cloud, updatedAt: 'maintenant' });
    }
    if (path === '/api/save' && method === 'PUT' && body !== null) {
      if (this.cloud !== null && this.cloud.version !== body.expectedVersion) {
        return json(409, { code: 'save-conflict', currentVersion: this.cloud.version });
      }
      if (this.refuseProgress) {
        return json(422, { code: 'implausible-progress' });
      }
      this.cloud = { version: this.cloud === null ? 0 : this.cloud.version + 1, data: body.data };
      return json(200, { version: this.cloud.version, updatedAt: 'maintenant' });
    }
    if (path === '/api/logout') {
      this.signedIn = false;
      return new Response(null, { status: 204 });
    }
    return json(404, { code: 'not-found' });
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Laisse passer les appels au faux serveur et les effets qui en découlent. */
async function settle(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe('Jeu en ligne', () => {
  let server: FakeServer;
  let reloads: number;
  let navigations: string[];

  function setup(enabled = true): { account: OnlineAccount; sync: CloudSync } {
    TestBed.configureTestingModule({
      providers: [
        { provide: ONLINE_CONFIG, useValue: { enabled, apiUrl: API } },
        { provide: FETCH, useValue: server.fetch },
        { provide: RELOAD, useValue: () => reloads++ },
        { provide: NAVIGATE, useValue: (url: string) => navigations.push(url) },
      ],
    });
    return { account: TestBed.inject(OnlineAccount), sync: TestBed.inject(CloudSync) };
  }

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('mine-explorer.progress', '{"zone":4,"stage":2,"damage":0}');
    localStorage.setItem('mine-explorer.coins', '500');
    server = new FakeServer();
    reloads = 0;
    navigations = [];
  });

  it('éteint, ne fait aucun appel réseau', async () => {
    const { account } = setup(false);
    await settle();
    expect(account.state().kind).toBe('disabled');
    expect(server.calls).toEqual([]);
  });

  it('non connecté : propose la connexion Google', async () => {
    server.signedIn = false;
    const { account } = setup();
    await settle();
    expect(account.state().kind).toBe('signed-out');
    account.signIn();
    expect(navigations).toEqual([`${API}/oauth2/authorization/google`]);
  });

  it('serveur injoignable : le jeu continue hors ligne', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ONLINE_CONFIG, useValue: { enabled: true, apiUrl: API } },
        { provide: FETCH, useValue: () => Promise.reject(new TypeError('Failed to fetch')) },
      ],
    });
    const account = TestBed.inject(OnlineAccount);
    await settle();
    expect(account.state().kind).toBe('offline');
  });

  it('première connexion : la partie locale part dans le cloud', async () => {
    const { sync } = setup();
    await settle();
    expect(TestBed.inject(PlayerName).label()).toBe('Mineur-12');
    expect(sync.state().kind).toBe('synced');
    // Les autres services du jeu ajoutent aussi leurs clés de départ (compagnons…) : on vérifie celles de la partie
    expect(server.cloud?.data).toMatchObject({
      'mine-explorer.progress': '{"zone":4,"stage":2,"damage":0}',
      'mine-explorer.coins': '500',
    });
    expect(localStorage.getItem('mine-explorer-cloud')).toBe('0');
  });

  it('autre appareil avec une partie différente : le joueur choisit, rien n\'est écrasé avant', async () => {
    server.cloud = { version: 3, data: { 'mine-explorer.progress': '{"zone":9,"stage":1,"damage":0}' } };
    const { sync } = setup();
    await settle();
    expect(sync.state()).toEqual({ kind: 'conflict', cloudVersion: 3, cloudLabel: '9-1', localLabel: '4-2' });
    expect(server.cloud.version).toBe(3);

    await sync.keepCloud();
    expect(localStorage.getItem('mine-explorer.progress')).toBe('{"zone":9,"stage":1,"damage":0}');
    // Les clés absentes de la partie du cloud disparaissent : pas de mélange des deux parties
    expect(localStorage.getItem('mine-explorer.coins')).toBeNull();
    expect(localStorage.getItem('mine-explorer-cloud')).toBe('3');
    expect(reloads).toBe(1);
  });

  it('garder la partie de cet appareil la renvoie au cloud', async () => {
    server.cloud = { version: 3, data: {} };
    const { sync } = setup();
    await settle();
    await sync.keepLocal();
    expect(sync.state().kind).toBe('synced');
    expect(server.cloud.version).toBe(4);
    expect(server.cloud.data['mine-explorer.coins']).toBe('500');
  });

  it('progression refusée par le serveur : la partie locale reste intacte', async () => {
    server.refuseProgress = true;
    const { sync } = setup();
    await settle();
    expect(sync.state().kind).toBe('refused');
    expect(localStorage.getItem('mine-explorer.progress')).toBe('{"zone":4,"stage":2,"damage":0}');
  });

  it('jeton CSRF expiré : redemandé une fois, puis l\'envoi passe', async () => {
    const { sync } = setup();
    await settle();
    server.csrfToken = 'jeton-2';
    localStorage.setItem('mine-explorer.coins', '900');
    await sync.upload();
    expect(server.cloud?.data['mine-explorer.coins']).toBe('900');
    expect(server.calls.filter((call) => call === 'GET /api/csrf')).toHaveLength(2);
  });

  it('nouveau filon : la partie repart peu après, pour que le classement suive', async () => {
    const { sync } = setup();
    await settle();
    expect(sync.state().kind).toBe('synced');
    expect(server.cloud?.version).toBe(0);
    vi.useFakeTimers();
    try {
      TestBed.inject(Progression).hit(Number.MAX_SAFE_INTEGER);
      TestBed.tick();
      await vi.advanceTimersByTimeAsync(RANKED_UPLOAD_DELAY_MS - 1);
      expect(server.cloud?.version).toBe(0);
      await vi.advanceTimersByTimeAsync(1);
    } finally {
      vi.useRealTimers();
    }
    await settle();
    expect(server.cloud?.version).toBe(1);
  });

  it('déconnexion : cet appareil oublie la version du cloud', async () => {
    const { account, sync } = setup();
    await settle();
    sync.forget();
    await account.signOut();
    expect(account.state().kind).toBe('signed-out');
    expect(localStorage.getItem('mine-explorer-cloud')).toBeNull();
    expect(TestBed.inject(PlayerName).label()).toBe('Petit mineur');
  });

  it('la carte Compte propose la connexion, puis montre le pseudo et la sauvegarde', async () => {
    server.signedIn = false;
    setup();
    const fixture = TestBed.createComponent(AccountCard);
    await settle();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Continuer avec Google');

    server.signedIn = true;
    await TestBed.inject(OnlineAccount).refresh();
    await settle();
    fixture.detectChanges();
    expect(root.textContent).toContain('Mineur-12');
    expect(root.textContent).toContain('Sauvegarde automatique');
  });

  it('propose de relier un compte après la première évolution, puis se tait 3 jours après « Plus tard »', async () => {
    server.signedIn = false;
    localStorage.setItem('mine-explorer.evolution', '1');
    setup();
    const fixture = TestBed.createComponent(AccountPrompt);
    await settle();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Ne perds pas ta partie');

    (root.querySelector('.later') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.textContent).not.toContain('Ne perds pas ta partie');
    expect(TestBed.inject(Overlays).shown()).toBeNull();
  });

  it('ne dérange pas un joueur qui débute', async () => {
    server.signedIn = false;
    setup();
    const fixture = TestBed.createComponent(AccountPrompt);
    await settle();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Ne perds pas ta partie');
  });
});
