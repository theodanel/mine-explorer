package com.theodanel.backend.chat;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.ResultActions;

import com.theodanel.backend.support.ApiTestSupport;
import com.theodanel.backend.support.MutableClock;

class ChatApiTests extends ApiTestSupport {

	/** Modérateur déclaré dans application-test.properties. */
	private static final UUID MODERATOR = UUID.fromString("00000000-0000-0000-0000-00000000000a");

	@Autowired
	private JdbcTemplate jdbc;

	private ResultActions send(UUID player, String text) throws Exception {
		return mockMvc.perform(post("/api/chat").with(as(player)).with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content(json.writeValueAsString(Map.of("text", text))));
	}

	private long lastMessageId() {
		return jdbc.queryForObject("select max(id) from chat_message", Long.class);
	}

	private UUID moderator() {
		jdbc.update("insert into player (id, pseudo, pseudo_key, created_at) values (?, 'Modo', 'modo', ?)", MODERATOR,
				Timestamp.from(MutableClock.START));
		return MODERATOR;
	}

	@Test
	void unJoueurConnecteEcritCeQuIlVeutEtToutLeMondeLit() throws Exception {
		UUID alice = newPlayer("a");
		accounts.rename(alice, "Alice");
		send(alice, "  Salut   tout le monde 👋⛏️  ").andExpect(status().isNoContent());

		// Lecture publique, sans session : pseudo et texte, jamais d'identifiant de joueur
		mockMvc.perform(get("/api/chat"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.messages[0].pseudo").value("Alice"))
			.andExpect(jsonPath("$.messages[0].text").value("Salut tout le monde 👋⛏️"))
			.andExpect(jsonPath("$.messages[0].mine").value(false))
			.andExpect(jsonPath("$.messages[0].playerId").doesNotExist())
			.andExpect(jsonPath("$.canWrite").value(false));
		mockMvc.perform(get("/api/chat").with(as(alice)))
			.andExpect(jsonPath("$.messages[0].mine").value(true))
			.andExpect(jsonPath("$.canWrite").value(true))
			.andExpect(jsonPath("$.moderator").value(false));
	}

	@Test
	void grosMotsMasquesLiensEtCoordonneesRefuses() throws Exception {
		UUID alice = newPlayer("a");
		send(alice, "t'es un CONNARD").andExpect(status().isNoContent());
		mockMvc.perform(get("/api/chat")).andExpect(jsonPath("$.messages[0].text").value("t'es un *******"));

		clock.advance(Duration.ofSeconds(6));
		send(alice, "viens sur www.arnaque.com").andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("chat-link"));
		send(alice, "mon numéro 06 12 34 56 78").andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("chat-personal-info"));
		send(alice, "a".repeat(201)).andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("chat-too-long"));
	}

	@Test
	void pasDEnvoiSansCompteNiSansJetonCsrf() throws Exception {
		UUID alice = newPlayer("a");
		mockMvc.perform(post("/api/chat").with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"text\":\"salut\"}")).andExpect(status().isUnauthorized());
		mockMvc.perform(post("/api/chat").with(as(alice))
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"text\":\"salut\"}")).andExpect(status().isForbidden());
	}

	@Test
	void unMessageToutesLesCinqSecondes() throws Exception {
		UUID alice = newPlayer("a");
		send(alice, "salut").andExpect(status().isNoContent());
		send(alice, "ça va ?").andExpect(status().isTooManyRequests())
			.andExpect(jsonPath("$.code").value("chat-too-fast"));
		clock.advance(Duration.ofSeconds(6));
		send(alice, "ça va ?").andExpect(status().isNoContent());
	}

	@Test
	void troisSignalementsCachentLeMessage() throws Exception {
		UUID alice = newPlayer("a");
		send(alice, "message pénible").andExpect(status().isNoContent());
		long id = lastMessageId();
		mockMvc.perform(post("/api/chat/" + id + "/report").with(as(alice)).with(csrf()))
			.andExpect(status().isBadRequest());
		for (String subject : new String[] { "b", "c" }) {
			mockMvc.perform(post("/api/chat/" + id + "/report").with(as(newPlayer(subject))).with(csrf()))
				.andExpect(status().isNoContent());
		}
		mockMvc.perform(get("/api/chat")).andExpect(jsonPath("$.messages.length()").value(1));
		mockMvc.perform(post("/api/chat/" + id + "/report").with(as(newPlayer("d"))).with(csrf()))
			.andExpect(status().isNoContent());
		mockMvc.perform(get("/api/chat")).andExpect(jsonPath("$.messages.length()").value(0));
	}

	@Test
	void leModerateurRetireUnMessageEtCoupeSonAuteur() throws Exception {
		UUID alice = newPlayer("a");
		UUID bob = newPlayer("b");
		UUID moderator = moderator();
		mockMvc.perform(get("/api/chat").with(as(moderator))).andExpect(jsonPath("$.moderator").value(true));

		send(alice, "premier").andExpect(status().isNoContent());
		long first = lastMessageId();
		// Un joueur ordinaire ne peut ni retirer ni couper
		mockMvc.perform(delete("/api/chat/" + first).with(as(bob)).with(csrf())).andExpect(status().isForbidden());
		mockMvc.perform(delete("/api/chat/" + first).with(as(moderator)).with(csrf())).andExpect(status().isNoContent());
		mockMvc.perform(get("/api/chat")).andExpect(jsonPath("$.messages.length()").value(0));

		clock.advance(Duration.ofSeconds(6));
		send(alice, "deuxième").andExpect(status().isNoContent());
		mockMvc.perform(post("/api/chat/" + lastMessageId() + "/mute-author").with(as(moderator)).with(csrf()))
			.andExpect(status().isNoContent());
		clock.advance(Duration.ofSeconds(6));
		send(alice, "troisième").andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("chat-muted"));
		mockMvc.perform(get("/api/chat").with(as(alice)))
			.andExpect(jsonPath("$.messages.length()").value(0))
			.andExpect(jsonPath("$.canWrite").value(false));
	}

	@Test
	void messagesEffacesApresSeptJoursEtAvecLeCompte() throws Exception {
		UUID alice = newPlayer("a");
		UUID bob = newPlayer("b");
		send(alice, "ancien").andExpect(status().isNoContent());
		clock.advance(Duration.ofDays(8));
		send(bob, "récent").andExpect(status().isNoContent());
		mockMvc.perform(get("/api/chat"))
			.andExpect(jsonPath("$.messages.length()").value(1))
			.andExpect(jsonPath("$.messages[0].text").value("récent"));

		mockMvc.perform(delete("/api/me").with(as(bob)).with(csrf())).andExpect(status().isNoContent());
		mockMvc.perform(get("/api/chat")).andExpect(jsonPath("$.messages.length()").value(0));
	}

	@Test
	void lExportDuCompteContientSesMessages() throws Exception {
		UUID alice = newPlayer("a");
		send(alice, "merci !").andExpect(status().isNoContent());
		mockMvc.perform(get("/api/me/export").with(as(alice)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.chatMessages[0].text").value("merci !"));
	}
}
