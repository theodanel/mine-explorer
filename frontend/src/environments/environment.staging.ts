import { Environment } from './environment.model';

// Site de test (branche staging, https://staging.mine.bouncylab.ovh) : son propre serveur et sa propre base sur le
// Raspberry Pi, pour que les essais ne touchent jamais les vrais comptes, le classement ni la discussion.
// Cette adresse doit rester autorisée dans connect-src (public/_headers et nginx.conf).
export const environment: Environment = {
  testBanner: true,
  online: { enabled: true, apiUrl: 'https://api-staging.bouncylab.ovh' },
};
