package com.theodanel.backend.save;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import com.theodanel.backend.support.ApiTestSupport;

class SaveApiTests extends ApiTestSupport {

	private ResultActions putSave(UUID player, String body) throws Exception {
		return mockMvc.perform(put("/api/save").with(as(player)).with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content(body));
	}

	@Test
	void premierEnvoiPuisRelectureSurUnAutreAppareil() throws Exception {
		UUID theo = newPlayer("theo");

		putSave(theo, saveBody(null, 3, 4, 0)).andExpect(status().isOk()).andExpect(jsonPath("$.version").value(0));

		mockMvc.perform(get("/api/save").with(as(theo)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.version").value(0))
			.andExpect(jsonPath("$.data['mine-explorer.coins']").value("1234"))
			.andExpect(jsonPath("$.data['mine-explorer.progress']").value(containsString("\"zone\":3")));
	}

	@Test
	void sansSauvegardeRepond404() throws Exception {
		mockMvc.perform(get("/api/save").with(as(newPlayer("neuf"))))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("no-save"));
	}

	@Test
	void unJoueurNeVoitNiNEcraseLaPartieDUnAutre() throws Exception {
		UUID alice = newPlayer("alice");
		UUID bob = newPlayer("bob");
		putSave(alice, saveBody(null, 5, 1, 0)).andExpect(status().isOk());

		// Bob n'a aucun moyen de désigner la partie d'Alice : il ne lit que la sienne, absente
		mockMvc.perform(get("/api/save").with(as(bob))).andExpect(status().isNotFound());

		// Son envoi crée sa propre partie, celle d'Alice ne bouge pas
		putSave(bob, saveBody(null, 1, 2, 0)).andExpect(status().isOk());
		mockMvc.perform(get("/api/save").with(as(alice)))
			.andExpect(jsonPath("$.data['mine-explorer.progress']").value(containsString("\"zone\":5")));
	}

	@Test
	void unAppareilEnRetardEstRefuseAvecLaVersionDuCloud() throws Exception {
		UUID theo = newPlayer("theo");
		putSave(theo, saveBody(null, 2, 1, 0)).andExpect(status().isOk());
		clock.advance(Duration.ofMinutes(10));
		putSave(theo, saveBody(0L, 2, 5, 0)).andExpect(jsonPath("$.version").value(1));

		// Le téléphone, resté sur la version 0, ne doit pas écraser la progression du PC
		putSave(theo, saveBody(0L, 2, 2, 0))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("save-conflict"))
			.andExpect(jsonPath("$.currentVersion").value(1));
	}

	@Test
	void uneProgressionImpossibleEstRefusee() throws Exception {
		UUID theo = newPlayer("theo");
		putSave(theo, saveBody(null, 2, 1, 0)).andExpect(status().isOk());
		clock.advance(Duration.ofMinutes(5));

		// De la zone 2 à la zone 15 en 5 minutes : refusé, la partie du cloud reste intacte
		putSave(theo, saveBody(0L, 15, 1, 0))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.code").value("implausible-progress"));
		mockMvc.perform(get("/api/save").with(as(theo))).andExpect(jsonPath("$.version").value(0));
	}

	@Test
	void unRecordDuPuitsSansProgressionEstRefuse() throws Exception {
		putSave(newPlayer("theo"), saveBody(null, 3, 1, 40))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.code").value("implausible-progress"));
	}

	@Test
	void cleEtrangereAuJeuRefusee() throws Exception {
		String body = json.writeValueAsString(Map.of("data", Map.of("autre.cle", "1")));
		putSave(newPlayer("theo"), body)
			.andExpect(status().isBadRequest())
			// Message générique : ni la clé refusée, ni le nom des champs, ni l'exception
			.andExpect(content().string(not(containsString("autre.cle"))))
			.andExpect(content().string(not(containsString("Exception"))));
	}

	@Test
	void progressionIllisibleRefusee() throws Exception {
		String body = json.writeValueAsString(Map.of("data", Map.of("mine-explorer.progress", "{\"zone\":\"9\"}")));
		putSave(newPlayer("theo"), body).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("save-invalid"));
	}

	@Test
	void tropDeClesRefusees() throws Exception {
		Map<String, String> data = new HashMap<>();
		for (int i = 0; i <= SaveController.MAX_KEYS; i++) {
			data.put("mine-explorer.cle-" + i, "1");
		}
		putSave(newPlayer("theo"), json.writeValueAsString(Map.of("data", data))).andExpect(status().isBadRequest());
	}

	@Test
	void sansConnexionRefuse() throws Exception {
		mockMvc.perform(get("/api/save")).andExpect(status().isUnauthorized());
		mockMvc.perform(put("/api/save").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void sansVersionAttendueUnePartieExistanteNestPasEcrasee() throws Exception {
		UUID theo = newPlayer("theo");
		putSave(theo, saveBody(null, 2, 1, 0)).andExpect(status().isOk());
		// Un appareil qui croit envoyer la première sauvegarde ne doit pas écraser celle du cloud
		putSave(theo, saveBody(null, 1, 1, 0))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.currentVersion").value(0));
	}

	@Test
	void versionNegativeRefusee() throws Exception {
		putSave(newPlayer("theo"), saveBody(-1L, 1, 1, 0)).andExpect(status().isBadRequest());
	}

	@Test
	void valeursHorsBornesRefusees() throws Exception {
		UUID theo = newPlayer("theo");
		putSave(theo, saveBody(null, 0, 1, 0)).andExpect(jsonPath("$.code").value("save-invalid"));
		putSave(theo, saveBody(null, 1, 16, 0)).andExpect(jsonPath("$.code").value("save-invalid"));
		putSave(theo, saveBody(null, 1, 1, -1)).andExpect(jsonPath("$.code").value("save-invalid"));
		putSave(theo, saveBody(null, 1, 1, 501)).andExpect(jsonPath("$.code").value("save-invalid"));
		// Entier qui dépasse un int Java : refusé, pas tronqué
		String overflow = json.writeValueAsString(Map.of("data",
				Map.of("mine-explorer.progress", "{\"zone\":4294967297,\"stage\":1}")));
		putSave(theo, overflow).andExpect(jsonPath("$.code").value("save-invalid"));
	}

	@Test
	void sauvegardeTropVolumineuseRefusee() throws Exception {
		Map<String, String> data = new HashMap<>();
		String value = "x".repeat(SaveController.MAX_VALUE_CHARS);
		for (int i = 0; i < 5; i++) {
			data.put("mine-explorer.gros-" + i, value);
		}
		putSave(newPlayer("theo"), json.writeValueAsString(Map.of("data", data)))
			.andExpect(status().isContentTooLarge())
			.andExpect(jsonPath("$.code").value("save-too-large"));
	}

	@Test
	void compteSupprimeDepuisUnAutreAppareil() throws Exception {
		UUID theo = newPlayer("theo");
		accounts.delete(theo);
		// La session encore ouverte ne peut pas recréer de partie orpheline : 401 pour se reconnecter, pas 500
		putSave(theo, saveBody(null, 1, 1, 0))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("account-gone"));
	}
}
