import { Environment } from './environment.model';

// `ng serve` : comptes allumés, avec le serveur lancé en local (backend, profil dev).
export const environment: Environment = {
  online: { enabled: true, apiUrl: 'http://localhost:8080' },
};
