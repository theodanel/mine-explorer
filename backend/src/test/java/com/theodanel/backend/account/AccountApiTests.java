package com.theodanel.backend.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.test.web.servlet.ResultActions;

import com.theodanel.backend.save.SaveService;
import com.theodanel.backend.support.ApiTestSupport;

class AccountApiTests extends ApiTestSupport {

	@Autowired
	private FindByIndexNameSessionRepository<? extends Session> sessions;

	@Autowired
	private SaveService saves;

	@Autowired
	private PlayerIdentityRepository identities;

	@Test
	void premiereConnexionCreeLeCompteUneSeuleFois() {
		UUID first = newPlayer("google-123");
		UUID again = newPlayer("google-123");
		assertThat(again).isEqualTo(first);
		assertThat(accounts.get(first).getPseudo()).startsWith("Mineur-");
	}

	@Test
	void profilDuJoueurConnecte() throws Exception {
		UUID theo = newPlayer("theo");
		mockMvc.perform(get("/api/me").with(as(theo)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.pseudo").value(accounts.get(theo).getPseudo()))
			.andExpect(jsonPath("$.providers[0]").value("google"))
			// Jamais d'identifiant interne ni de compte Google dans le profil
			.andExpect(jsonPath("$.id").doesNotExist());
	}

	@Test
	void changerDePseudo() throws Exception {
		UUID theo = newPlayer("theo");
		rename(theo, "  Théo  ").andExpect(status().isOk()).andExpect(jsonPath("$.pseudo").value("Théo"));
	}

	@Test
	void pseudoDejaPrisMemeEnChangeantLaCasse() throws Exception {
		rename(newPlayer("alice"), "Théo").andExpect(status().isOk());
		rename(newPlayer("bob"), "THÉO").andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("pseudo-taken"));
	}

	@Test
	void pseudoInvalide() throws Exception {
		rename(newPlayer("theo"), "<b>x</b>")
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("pseudo-invalid"));
	}

	@Test
	void exportContientToutesLesDonnees() throws Exception {
		UUID theo = newPlayer("theo");
		mockMvc.perform(put("/api/save").with(as(theo)).with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content(saveBody(null, 2, 3, 0))).andExpect(status().isOk());

		mockMvc.perform(get("/api/me/export").with(as(theo)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.identities[0].subject").value("theo"))
			.andExpect(jsonPath("$.save.data['mine-explorer.coins']").value("1234"));
	}

	@Test
	void suppressionDuCompteEfface() throws Exception {
		UUID theo = newPlayer("theo");
		mockMvc.perform(put("/api/save").with(as(theo)).with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content(saveBody(null, 2, 3, 0))).andExpect(status().isOk());
		String otherDevice = openSession(theo);

		mockMvc.perform(delete("/api/me").with(as(theo)).with(csrf())).andExpect(status().isNoContent());

		assertThat(saves.find(theo)).isEmpty();
		assertThat(identities.findByPlayerId(theo)).isEmpty();
		assertThat(sessions.findById(otherDevice)).isNull();
		// La même identité Google recrée un compte neuf
		assertThat(newPlayer("theo")).isNotEqualTo(theo);
	}

	@Test
	void seDeconnecterPartoutFermeLesAutresSessions() throws Exception {
		UUID theo = newPlayer("theo");
		UUID alice = newPlayer("alice");
		String phone = openSession(theo);
		String aliceSession = openSession(alice);

		mockMvc.perform(post("/api/me/logout-everywhere").with(as(theo)).with(csrf()))
			.andExpect(status().isNoContent());

		assertThat(sessions.findById(phone)).isNull();
		// Les sessions des autres joueurs ne sont pas touchées
		assertThat(sessions.findById(aliceSession)).isNotNull();
	}

	@Test
	void ecritureSansJetonCsrfRefusee() throws Exception {
		mockMvc.perform(delete("/api/me").with(as(newPlayer("theo"))))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.code").value("csrf-invalid"));
	}

	private ResultActions rename(UUID player, String pseudo) throws Exception {
		return mockMvc.perform(put("/api/me/pseudo").with(as(player)).with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content(json.writeValueAsString(Map.of("pseudo", pseudo))));
	}

	/** Session ouverte sur un autre appareil, rangée en base comme le fait Spring Session à la connexion. */
	private String openSession(UUID player) {
		return openSession(sessions, player);
	}

	private static <S extends Session> String openSession(FindByIndexNameSessionRepository<S> repository, UUID player) {
		S session = repository.createSession();
		session.setAttribute(FindByIndexNameSessionRepository.PRINCIPAL_NAME_INDEX_NAME, player.toString());
		repository.save(session);
		return session.getId();
	}
}
