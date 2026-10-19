// Réglages du build de production. Remplacé par environment.development.ts avec `ng serve` (voir angular.json).
import { Environment } from './environment.model';

// Jeu en ligne allumé : le serveur tourne sur le Raspberry Pi de Théo (deploiement/raspberry-pi), derrière
// https://api.bouncylab.ovh. Cette adresse doit rester autorisée dans connect-src (public/_headers et nginx.conf).
export const environment: Environment = {
  testBanner: false,
  online: { enabled: true, apiUrl: 'https://api.bouncylab.ovh' },
};
