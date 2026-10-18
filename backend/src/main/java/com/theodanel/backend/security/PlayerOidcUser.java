package com.theodanel.backend.security;

import java.io.Serial;
import java.util.Collection;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.StandardClaimNames;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;

/**
 * Utilisateur connecté, gardé dans la session. Porte l'identifiant interne du joueur : toutes les routes
 * {@code /api/me/**} et {@code /api/save} le lisent ici, jamais dans l'URL ou le corps de la requête (anti-IDOR).
 */
public class PlayerOidcUser extends DefaultOidcUser {

	@Serial
	private static final long serialVersionUID = 1L;

	private final UUID playerId;

	public PlayerOidcUser(UUID playerId, Collection<? extends GrantedAuthority> authorities, OidcIdToken idToken) {
		super(authorities, idToken, StandardClaimNames.SUB);
		this.playerId = playerId;
	}

	public UUID getPlayerId() {
		return playerId;
	}

	/**
	 * Nom de l'utilisateur pour Spring Security, donc clé d'index des sessions en base : l'identifiant du joueur,
	 * commun à tous ses fournisseurs, pour pouvoir fermer toutes ses sessions d'un coup.
	 */
	@Override
	public String getName() {
		return playerId.toString();
	}
}
