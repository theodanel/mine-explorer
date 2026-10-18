package com.theodanel.backend.chat;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import com.theodanel.backend.support.ApiTestSupport;

class ChatApiTests extends ApiTestSupport {

	private ResultActions send(UUID player, String phrase) throws Exception {
		return mockMvc.perform(post("/api/chat").with(as(player)).with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"phrase\":\"" + phrase + "\"}"));
	}

	@Test
	void unJoueurConnecteEnvoieUnePhraseQueToutLeMondeLit() throws Exception {
		UUID alice = newPlayer("a");
		accounts.rename(alice, "Alice");
		send(alice, "gg").andExpect(status().isNoContent());

		// Lecture publique, sans session : pseudo et phrase, jamais d'identifiant interne
		mockMvc.perform(get("/api/chat"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.messages[0].pseudo").value("Alice"))
			.andExpect(jsonPath("$.messages[0].phrase").value("gg"))
			.andExpect(jsonPath("$.messages[0].mine").value(false))
			.andExpect(jsonPath("$.messages[0].playerId").doesNotExist());
		mockMvc.perform(get("/api/chat").with(as(alice)))
			.andExpect(jsonPath("$.messages[0].mine").value(true));
	}

	@Test
	void aucunTexteLibreNiEnvoiSansCompte() throws Exception {
		UUID alice = newPlayer("a");
		send(alice, "Rejoins-moi sur mon serveur !").andExpect(status().isBadRequest());
		mockMvc.perform(post("/api/chat").with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"phrase\":\"gg\"}")).andExpect(status().isUnauthorized());
		// Sans jeton CSRF, même connecté
		mockMvc.perform(post("/api/chat").with(as(alice))
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"phrase\":\"gg\"}")).andExpect(status().isForbidden());
	}

	@Test
	void unMessageToutesLesCinqSecondes() throws Exception {
		UUID alice = newPlayer("a");
		send(alice, "hello").andExpect(status().isNoContent());
		send(alice, "gg").andExpect(status().isTooManyRequests())
			.andExpect(jsonPath("$.code").value("chat-too-fast"));
		clock.advance(Duration.ofSeconds(6));
		send(alice, "gg").andExpect(status().isNoContent());
	}

	@Test
	void lesMessagesDePlusDeSeptJoursSontEffacesEtLeCompteSupprimeEmporteSesMessages() throws Exception {
		UUID alice = newPlayer("a");
		UUID bob = newPlayer("b");
		send(alice, "hello").andExpect(status().isNoContent());
		clock.advance(Duration.ofDays(8));
		send(bob, "wow").andExpect(status().isNoContent());
		mockMvc.perform(get("/api/chat"))
			.andExpect(jsonPath("$.messages.length()").value(1))
			.andExpect(jsonPath("$.messages[0].phrase").value("wow"));

		mockMvc.perform(delete("/api/me").with(as(bob)).with(csrf())).andExpect(status().isNoContent());
		mockMvc.perform(get("/api/chat")).andExpect(jsonPath("$.messages.length()").value(0));
	}

	@Test
	void lExportDuCompteContientSesMessages() throws Exception {
		UUID alice = newPlayer("a");
		send(alice, "thanks").andExpect(status().isNoContent());
		mockMvc.perform(get("/api/me/export").with(as(alice)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.chatMessages[0].phrase").value("thanks"));
	}
}
