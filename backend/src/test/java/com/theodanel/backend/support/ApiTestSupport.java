package com.theodanel.backend.support;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.theodanel.backend.account.AccountService;
import com.theodanel.backend.security.PlayerOidcUser;

import tools.jackson.databind.json.JsonMapper;

/**
 * Base des tests d'API : contexte complet (sécurité, Flyway, sessions en base) sur H2, base vidée et horloge remise
 * à zéro avant chaque test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(ApiTestSupport.ClockConfig.class)
public abstract class ApiTestSupport {

	@TestConfiguration
	static class ClockConfig {

		@Bean
		@Primary
		MutableClock testClock() {
			return new MutableClock();
		}
	}

	@Autowired
	protected MockMvc mockMvc;

	@Autowired
	protected MutableClock clock;

	@Autowired
	protected AccountService accounts;

	@Autowired
	protected JsonMapper json;

	@Autowired
	private JdbcTemplate jdbc;

	@BeforeEach
	void resetState() {
		jdbc.update("delete from player");
		jdbc.update("delete from spring_session");
		clock.set(MutableClock.START);
	}

	/** Joueur créé comme à sa première connexion Google. */
	protected UUID newPlayer(String googleSubject) {
		return accounts.findOrCreatePlayer("google", googleSubject);
	}

	/** Requête faite par ce joueur, connecté avec Google. */
	protected RequestPostProcessor as(UUID playerId) {
		OidcIdToken idToken = OidcIdToken.withTokenValue("jeton-de-test")
			.subject("sub-" + playerId)
			.issuedAt(Instant.now())
			.expiresAt(Instant.now().plusSeconds(60))
			.build();
		PlayerOidcUser user = new PlayerOidcUser(playerId, List.of(new SimpleGrantedAuthority("OIDC_USER")), idToken);
		return authentication(new OAuth2AuthenticationToken(user, user.getAuthorities(), "google"));
	}

	/** Corps d'un envoi de sauvegarde avec la progression donnée. */
	protected String saveBody(Long expectedVersion, int zone, int stage, int abyssRecord) {
		Map<String, Object> body = new HashMap<>();
		body.put("expectedVersion", expectedVersion);
		body.put("data", Map.of(
				"mine-explorer.progress", "{\"zone\":" + zone + ",\"stage\":" + stage + ",\"damage\":0}",
				"mine-explorer.abyss", "{\"record\":" + abyssRecord + ",\"day\":\"\",\"runsUsed\":0,\"active\":null}",
				"mine-explorer.coins", "1234"));
		return json.writeValueAsString(body);
	}
}
