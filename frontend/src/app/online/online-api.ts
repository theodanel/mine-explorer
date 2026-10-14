import { inject, Injectable, InjectionToken } from '@angular/core';

import { ONLINE_CONFIG } from './online-config';

/** Appel réseau, injecté pour que les tests simulent le serveur. */
export const FETCH = new InjectionToken<typeof fetch>('FETCH', {
  providedIn: 'root',
  factory: () => (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
});

/** Réponse du serveur : le corps JSON en cas de succès, le statut et le code d'erreur sinon (0 hors connexion). */
export type ApiResult = { readonly ok: true; readonly body: unknown } | ApiFailure;
export interface ApiFailure {
  readonly ok: false;
  readonly status: number;
  readonly code: string | null;
  readonly body: unknown;
}

type Method = 'GET' | 'PUT' | 'POST' | 'DELETE';

/**
 * Accès à l'API du serveur. La session est un cookie HttpOnly que le navigateur envoie seul ({@code credentials}),
 * jamais lu ici. Chaque écriture porte le jeton CSRF, demandé une fois puis redemandé s'il a expiré (par exemple
 * après la connexion, qui en génère un nouveau).
 */
@Injectable({ providedIn: 'root' })
export class OnlineApi {
  private readonly config = inject(ONLINE_CONFIG);
  private readonly fetchFn = inject(FETCH);
  private csrf: { readonly headerName: string; readonly token: string } | null = null;

  get(path: string): Promise<ApiResult> {
    return this.send('GET', path);
  }

  async write(method: Exclude<Method, 'GET'>, path: string, body?: unknown): Promise<ApiResult> {
    const first = await this.sendWithCsrf(method, path, body);
    if (first.ok || first.code !== 'csrf-invalid') {
      return first;
    }
    this.csrf = null;
    return this.sendWithCsrf(method, path, body);
  }

  /** Adresse de la connexion Google : une vraie navigation, le serveur renvoie ensuite vers le jeu. */
  signInUrl(): string {
    return `${this.config.apiUrl}/oauth2/authorization/google`;
  }

  private async sendWithCsrf(method: Method, path: string, body: unknown): Promise<ApiResult> {
    if (this.csrf === null) {
      const response = await this.send('GET', '/api/csrf');
      if (!response.ok) {
        return response;
      }
      if (!isCsrf(response.body)) {
        return { ok: false, status: 0, code: 'bad-response', body: response.body };
      }
      this.csrf = response.body;
    }
    return this.send(method, path, body, { [this.csrf.headerName]: this.csrf.token });
  }

  private async send(method: Method, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<ApiResult> {
    let response: Response;
    try {
      response = await this.fetchFn(`${this.config.apiUrl}${path}`, {
        method,
        credentials: 'include',
        headers: body === undefined ? headers : { ...headers, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      // Hors connexion ou serveur injoignable : le jeu continue en local
      return { ok: false, status: 0, code: 'network', body: null };
    }
    const parsed = await readJson(response);
    if (response.ok) {
      return { ok: true, body: parsed };
    }
    return { ok: false, status: response.status, code: errorCode(parsed), body: parsed };
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '');
  if (text === '') {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function errorCode(body: unknown): string | null {
  if (typeof body === 'object' && body !== null && 'code' in body && typeof body.code === 'string') {
    return body.code;
  }
  return null;
}

function isCsrf(value: unknown): value is { headerName: string; token: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'headerName' in value &&
    typeof value.headerName === 'string' &&
    'token' in value &&
    typeof value.token === 'string'
  );
}
