package com.theodanel.backend.security;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;

import com.theodanel.backend.support.ApiTestSupport;

import tools.jackson.databind.JsonNode;

/** Protections transverses : authentification, CSRF, CORS, en-têtes, flux OAuth, taille des requêtes. */
class SecurityTests extends ApiTestSupport {

	private static final String FRONT = "https://mine.example.test";

	@Test
	void apiSansConnexionRepond401EnJson() throws Exception {
		mockMvc.perform(get("/api/me"))
			.andExpect(status().isUnauthorized())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("unauthenticated"))
			// Pas de redirection vers une page de connexion
			.andExpect(header().doesNotExist(HttpHeaders.LOCATION));
	}

	/**
	 * Parcours réel du front : lire le jeton, puis le renvoyer dans l'en-tête annoncé avec le cookie de session reçu
	 * (Spring Session lit la session dans ce cookie, pas dans la session du conteneur).
	 */
	@Test
	void jetonCsrfLuPuisRenvoye() throws Exception {
		MockHttpServletResponse response = mockMvc.perform(get("/api/csrf"))
			.andExpect(status().isOk())
			.andExpect(cookie().httpOnly("MINE_SESSION", true))
			.andExpect(cookie().secure("MINE_SESSION", true))
			.andExpect(cookie().sameSite("MINE_SESSION", "Lax"))
			.andReturn()
			.getResponse();
		JsonNode csrf = json.readTree(response.getContentAsString());

		mockMvc.perform(put("/api/save").cookie(response.getCookie("MINE_SESSION")).with(as(newPlayer("theo")))
			.header(csrf.get("headerName").asString(), csrf.get("token").asString())
			.contentType(MediaType.APPLICATION_JSON)
			.content(saveBody(null, 1, 1, 0)))
			.andExpect(status().isOk());
	}

	@Test
	void ecritureSansCsrfRefuseeMemeConnecte() throws Exception {
		mockMvc.perform(put("/api/save").with(as(newPlayer("theo")))
			.contentType(MediaType.APPLICATION_JSON)
			.content(saveBody(null, 1, 1, 0)))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.code").value("csrf-invalid"));
	}

	@Test
	void corsAccepteLAdresseDuJeu() throws Exception {
		mockMvc.perform(options("/api/save")
			.header(HttpHeaders.ORIGIN, FRONT)
			.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PUT")
			.header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, SecurityConfig.CSRF_HEADER))
			.andExpect(status().isOk())
			.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONT))
			.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
	}

	@Test
	void corsRefuseUnAutreSite() throws Exception {
		mockMvc.perform(options("/api/save")
			.header(HttpHeaders.ORIGIN, "https://site-malveillant.example")
			.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PUT"))
			.andExpect(status().isForbidden())
			.andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
		mockMvc.perform(get("/api/csrf").header(HttpHeaders.ORIGIN, "https://site-malveillant.example"))
			.andExpect(status().isForbidden());
	}

	@Test
	void connexionGoogleAvecPkceEtState() throws Exception {
		mockMvc.perform(get("/oauth2/authorization/google"))
			.andExpect(status().isFound())
			.andExpect(header().string(HttpHeaders.LOCATION, startsWith("https://accounts.google.com/")))
			.andExpect(header().string(HttpHeaders.LOCATION, containsString("code_challenge_method=S256")))
			.andExpect(header().string(HttpHeaders.LOCATION, containsString("state=")))
			.andExpect(header().string(HttpHeaders.LOCATION, containsString("nonce=")))
			.andExpect(header().string(HttpHeaders.LOCATION, containsString("scope=openid")));
	}

	@Test
	void pasDePageDeConnexionGeneree() throws Exception {
		mockMvc.perform(get("/login")).andExpect(status().isUnauthorized());
	}

	@Test
	void enTetesDeSecurite() throws Exception {
		mockMvc.perform(get("/api/csrf"))
			.andExpect(header().string("X-Content-Type-Options", "nosniff"))
			.andExpect(header().string("X-Frame-Options", "DENY"))
			.andExpect(header().string("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"))
			.andExpect(header().string("Referrer-Policy", "no-referrer"))
			.andExpect(header().string(HttpHeaders.CACHE_CONTROL, containsString("no-store")));
	}

	@Test
	void santeSansDetail() throws Exception {
		mockMvc.perform(get("/actuator/health"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("UP"))
			.andExpect(jsonPath("$.components").doesNotExist());
		mockMvc.perform(get("/actuator/env")).andExpect(status().isUnauthorized());
	}

	@Test
	void corpsTropGrosRefuseAvantLecture() throws Exception {
		mockMvc.perform(put("/api/save")
			.contentType(MediaType.APPLICATION_JSON)
			.content(new byte[600_000]))
			.andExpect(status().is(HttpStatus.CONTENT_TOO_LARGE.value()))
			.andExpect(jsonPath("$.code").value("body-too-large"));
	}

	@Test
	void classementPublic() throws Exception {
		mockMvc.perform(get("/api/leaderboard/depth")).andExpect(status().isOk());
	}
}
