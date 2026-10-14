package com.theodanel.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.UnaryOperator;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.theodanel.backend.support.ApiTestSupport;

/**
 * Parcours complet de la connexion Google, avec un faux Google local (point d'échange du code et clés publiques) :
 * vérifie que la configuration réelle refuse un jeton d'identité mal signé, destiné à une autre appli, périmé,
 * d'un autre émetteur ou rejoué depuis une autre connexion (nonce), et qu'une réponse sans le bon state est rejetée.
 */
class GoogleLoginFlowTests extends ApiTestSupport {

	private static final String ISSUER = "https://accounts.google.com";
	private static final String CLIENT_ID = "test-client";
	private static final String FRONT = "https://mine.example.test";
	private static final String FAILURE = FRONT + "/?connexion=echec";

	private static final RSAKey GOOGLE_KEY = generateKey("cle-google");
	private static final RSAKey OTHER_KEY = generateKey("cle-google");
	private static final FakeGoogle GOOGLE = new FakeGoogle();

	@Autowired
	private JdbcTemplate jdbc;

	@DynamicPropertySource
	static void fakeGoogleEndpoints(DynamicPropertyRegistry registry) {
		registry.add("spring.security.oauth2.client.provider.google.token-uri", () -> GOOGLE.url("/token"));
		registry.add("spring.security.oauth2.client.provider.google.jwk-set-uri", () -> GOOGLE.url("/jwks"));
		registry.add("spring.security.oauth2.client.provider.google.user-info-uri", () -> GOOGLE.url("/userinfo"));
	}

	@AfterAll
	static void stopFakeGoogle() {
		GOOGLE.server.stop(0);
	}

	@Test
	void connexionValideOuvreUneSessionNeuveDe14Jours() throws Exception {
		Authorization authorization = startLogin();
		GOOGLE.nextIdToken.set(idToken(authorization.nonce(), UnaryOperator.identity(), GOOGLE_KEY));

		MockHttpServletResponse callback = finishLogin(authorization, authorization.state())
			.andExpect(status().isFound())
			.andExpect(header().string("Location", FRONT))
			.andReturn()
			.getResponse();

		Cookie loggedIn = callback.getCookie(SecurityConfig.SESSION_COOKIE);
		assertThat(loggedIn).isNotNull();
		// Nouvel identifiant de session à la connexion : un identifiant posé avant (fixation de session) ne sert à rien
		assertThat(loggedIn.getValue()).isNotEqualTo(authorization.sessionCookie().getValue());
		// PKCE : le secret gardé en session accompagne l'échange du code
		assertThat(GOOGLE.lastTokenRequest.get()).contains("code_verifier=");
		mockMvc.perform(get("/api/me").cookie(loggedIn)).andExpect(status().isOk());
		assertThat(jdbc.queryForObject("select max_inactive_interval from spring_session", Integer.class))
			.isEqualTo(Duration.ofDays(14).toSeconds());
	}

	@Test
	void sessionAnonymeCourte() throws Exception {
		startLogin();
		assertThat(jdbc.queryForObject("select max_inactive_interval from spring_session", Integer.class))
			.isEqualTo(Duration.ofMinutes(30).toSeconds());
	}

	@Test
	void signatureDUneAutreCleRefusee() throws Exception {
		refused(claims -> claims, OTHER_KEY);
	}

	@Test
	void jetonPourUneAutreAppliRefuse() throws Exception {
		refused(claims -> claims.audience("autre-appli"), GOOGLE_KEY);
	}

	@Test
	void autreEmetteurRefuse() throws Exception {
		refused(claims -> claims.issuer("https://faux-google.example"), GOOGLE_KEY);
	}

	@Test
	void jetonPerimeRefuse() throws Exception {
		refused(claims -> claims.issueTime(Date.from(Instant.now().minus(Duration.ofHours(2))))
			.expirationTime(Date.from(Instant.now().minus(Duration.ofHours(1)))), GOOGLE_KEY);
	}

	@Test
	void nonceDUneAutreConnexionRefuse() throws Exception {
		refused(claims -> claims.claim("nonce", "nonce-rejoue"), GOOGLE_KEY);
	}

	@Test
	void stateInconnuRefuseSansAppelerGoogle() throws Exception {
		Authorization authorization = startLogin();
		GOOGLE.lastTokenRequest.set(null);
		finishLogin(authorization, "state-forge").andExpect(header().string("Location", FAILURE));
		assertThat(GOOGLE.lastTokenRequest.get()).isNull();
		assertThat(jdbc.queryForObject("select count(*) from player", Integer.class)).isZero();
	}

	private void refused(UnaryOperator<JWTClaimsSet.Builder> tamper, RSAKey key) throws Exception {
		Authorization authorization = startLogin();
		GOOGLE.nextIdToken.set(idToken(authorization.nonce(), tamper, key));
		finishLogin(authorization, authorization.state()).andExpect(header().string("Location", FAILURE));
		assertThat(jdbc.queryForObject("select count(*) from player", Integer.class)).isZero();
	}

	private record Authorization(Cookie sessionCookie, String state, String nonce) {
	}

	private Authorization startLogin() throws Exception {
		MockHttpServletResponse response = mockMvc.perform(get("/oauth2/authorization/google"))
			.andExpect(status().isFound())
			.andReturn()
			.getResponse();
		MultiValueMap<String, String> query = UriComponentsBuilder.fromUriString(response.getHeader("Location"))
			.build()
			.getQueryParams();
		return new Authorization(response.getCookie(SecurityConfig.SESSION_COOKIE), decode(query.getFirst("state")),
				decode(query.getFirst("nonce")));
	}

	private ResultActions finishLogin(Authorization authorization, String state)
			throws Exception {
		return mockMvc.perform(get("/login/oauth2/code/google").cookie(authorization.sessionCookie())
			.param("code", "code-de-test")
			.param("state", state));
	}

	private static String idToken(String nonce, UnaryOperator<JWTClaimsSet.Builder> tamper, RSAKey key)
			throws JOSEException {
		Instant now = Instant.now();
		JWTClaimsSet.Builder claims = new JWTClaimsSet.Builder().issuer(ISSUER)
			.audience(CLIENT_ID)
			.subject("google-sub-1")
			.issueTime(Date.from(now))
			.expirationTime(Date.from(now.plus(Duration.ofMinutes(5))))
			.claim("nonce", nonce);
		SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(),
				tamper.apply(claims).build());
		jwt.sign(new RSASSASigner(key));
		return jwt.serialize();
	}

	private static String decode(String value) {
		return URLDecoder.decode(value, StandardCharsets.UTF_8);
	}

	private static RSAKey generateKey(String keyId) {
		try {
			return new RSAKeyGenerator(2048).keyID(keyId).generate();
		}
		catch (JOSEException impossible) {
			throw new IllegalStateException(impossible);
		}
	}

	/** Points d'accès de Google utilisés après le retour du joueur : échange du code et clés publiques. */
	private static final class FakeGoogle {

		final AtomicReference<String> nextIdToken = new AtomicReference<>();
		final AtomicReference<String> lastTokenRequest = new AtomicReference<>();
		final HttpServer server;

		FakeGoogle() {
			try {
				server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
			}
			catch (IOException cannotListen) {
				throw new IllegalStateException(cannotListen);
			}
			server.createContext("/token", exchange -> {
				lastTokenRequest.set(readBody(exchange));
				respond(exchange, """
						{"access_token":"acces-de-test","token_type":"Bearer","expires_in":3600,"scope":"openid",\
						"id_token":"%s"}""".formatted(nextIdToken.get()));
			});
			server.createContext("/jwks", exchange -> respond(exchange, new JWKSet(GOOGLE_KEY.toPublicJWK()).toString()));
			server.createContext("/userinfo", exchange -> respond(exchange, "{\"sub\":\"google-sub-1\"}"));
			server.start();
		}

		String url(String path) {
			return "http://127.0.0.1:" + server.getAddress().getPort() + path;
		}

		private static String readBody(HttpExchange exchange) throws IOException {
			try (InputStream body = exchange.getRequestBody()) {
				return new String(body.readAllBytes(), StandardCharsets.UTF_8);
			}
		}

		private static void respond(HttpExchange exchange, String json) throws IOException {
			byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().set("Content-Type", "application/json");
			exchange.sendResponseHeaders(200, bytes.length);
			try (OutputStream out = exchange.getResponseBody()) {
				out.write(bytes);
			}
		}
	}
}
