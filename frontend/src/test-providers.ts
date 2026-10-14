import { EnvironmentProviders, Provider } from '@angular/core';

import { ONLINE_CONFIG } from './app/online/online-config';

// Fournisseurs communs à tous les tests (option « providersFile » de angular.json).
// Jeu en ligne éteint : aucun test n'appelle un vrai serveur ; ceux du jeu en ligne l'allument eux-mêmes.
const testProviders: (Provider | EnvironmentProviders)[] = [
  { provide: ONLINE_CONFIG, useValue: { enabled: false, apiUrl: '' } },
];

export default testProviders;
