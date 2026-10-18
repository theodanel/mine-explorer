// Forme commune des réglages par build (environment.ts en production, environment.development.ts avec ng serve).

export interface Environment {
  /** Comptes, sauvegarde cloud et classement. */
  readonly online: {
    readonly enabled: boolean;
    /** Adresse du serveur, sans barre finale. */
    readonly apiUrl: string;
  };
}
