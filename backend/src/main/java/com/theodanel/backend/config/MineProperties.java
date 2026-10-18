package com.theodanel.backend.config;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Réglages propres au jeu (préfixe « mine »). Tous obligatoires : un oubli de configuration empêche le démarrage
 * au lieu de laisser tourner un serveur mal protégé.
 */
@Validated
@ConfigurationProperties("mine")
public record MineProperties(
		@Valid @NotNull Front front,
		@Valid @NotNull Limits limits,
		@Valid @NotNull RateLimit rateLimit,
		@Valid @NotNull Session session,
		@Valid @NotNull AntiCheat antiCheat,
		@Valid @NotNull Chat chat) {

	/**
	 * Discussion. {@code moderators} : identifiants des joueurs qui peuvent retirer un message ou couper un joueur
	 * (identifiant visible dans « Télécharger mes données »), vide par défaut.
	 */
	public record Chat(@NotNull List<UUID> moderators) {
	}

	/** Adresse du jeu : retour après connexion, et seule origine autorisée à appeler l'API avec ses cookies. */
	public record Front(@NotBlank String url, @NotEmpty List<@NotBlank String> allowedOrigins) {
	}

	public record Limits(@Positive long maxBodyBytes) {
	}

	/**
	 * Requêtes autorisées par minute et par adresse IP. Derrière le proxy, l'adresse est déjà celle du joueur :
	 * Tomcat la reprend de X-Forwarded-For, seulement quand la requête vient du proxy (voir application-prod).
	 */
	public record RateLimit(@Positive int loginPerMinute, @Positive int writePerMinute, @Positive int readPerMinute) {
	}

	/**
	 * {@code idleTimeout} : inactivité au bout de laquelle un joueur connecté est déconnecté (les sessions anonymes
	 * suivent {@code spring.session.timeout}, bien plus court). {@code maxLifetime} : durée de vie maximale d'une
	 * session, même utilisée chaque jour. {@code secureCookie} : cookie envoyé seulement en HTTPS ; désactivé
	 * uniquement en local, faute de HTTPS sur localhost.
	 */
	public record Session(@NotNull Duration idleTimeout, @NotNull Duration maxLifetime, @NotNull Boolean secureCookie) {
	}

	public record AntiCheat(@NotNull Instant releaseDate, @DecimalMin("1.0") double speedFactor,
			@NotNull Duration grace) {
	}
}
