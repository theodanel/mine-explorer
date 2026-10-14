package com.theodanel.backend.security;

import java.util.UUID;

import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;

import com.theodanel.backend.account.AccountService;

/**
 * Après validation du jeton d'identité par Spring Security (signature, émetteur, audience, expiration, nonce),
 * relie le compte Google au joueur, créé à la première connexion.
 */
@Component
public class PlayerOidcUserService implements OAuth2UserService<OidcUserRequest, OidcUser> {

	private final OidcUserService delegate = new OidcUserService();
	private final AccountService accounts;

	public PlayerOidcUserService(AccountService accounts) {
		this.accounts = accounts;
	}

	@Override
	public OidcUser loadUser(OidcUserRequest request) {
		OidcUser user = delegate.loadUser(request);
		String provider = request.getClientRegistration().getRegistrationId();
		UUID playerId = accounts.findOrCreatePlayer(provider, user.getSubject());
		return new PlayerOidcUser(playerId, user.getAuthorities(), user.getIdToken());
	}
}
