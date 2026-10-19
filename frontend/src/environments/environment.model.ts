// Forme commune des réglages par build : environment.ts en production, environment.staging.ts sur le site de test,
// environment.development.ts avec ng serve.

export interface Environment {
  /** Site de test : un bandeau « Version de test » le distingue du vrai jeu. */
  readonly testBanner: boolean;
  /** Comptes, sauvegarde cloud et classement. */
  readonly online: {
    readonly enabled: boolean;
    /** Adresse du serveur, sans barre finale. */
    readonly apiUrl: string;
  };
}
