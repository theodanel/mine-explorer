// Réglages du build de production. Remplacé par environment.development.ts avec `ng serve` (voir angular.json).
import { Environment } from './environment.model';

// Éteint en production tant que le serveur n'est pas hébergé : aucun écran de compte ni appel réseau.
// Pour l'allumer : enabled: true, apiUrl: 'https://api.bouncylab.ovh', et connect-src dans public/_headers.
export const environment: Environment = {
  online: { enabled: false, apiUrl: '' },
};
