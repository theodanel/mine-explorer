package com.theodanel.backend.leaderboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import com.theodanel.backend.support.ApiTestSupport;

import tools.jackson.databind.JsonNode;

class LeaderboardApiTests extends ApiTestSupport {

	/** Temps de jeu depuis la connexion : assez pour que le classement affiche toutes les parties des tests (zone 9). */
	private static final Duration PLAYED_SINCE_LOGIN = Duration.ofHours(4);

	@Autowired
	private LeaderboardEvents events;

	@Autowired
	private org.springframework.jdbc.core.JdbcTemplate jdbc;

	/**
	 * Les changements laissés en attente par les tests précédents (toutes classes confondues : le service est partagé)
	 * partiraient dans le premier flux ouvert ici : on les envoie d'abord, à personne.
	 */
	@BeforeEach
	void drainPendingChanges() {
		events.flush();
	}

	@AfterEach
	void closeStreams() {
		events.closeAll();
	}

	private UUID playerWith(String subject, String pseudo, int zone, int stage, int abyss) throws Exception {
		UUID player = newPlayer(subject);
		accounts.rename(player, pseudo);
		clock.advance(PLAYED_SINCE_LOGIN);
		mockMvc.perform(put("/api/save").with(as(player)).with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content(saveBody(null, zone, stage, abyss))).andExpect(status().isOk());
		return player;
	}

	@Test
	void classementParProfondeurPuisAnciennete() throws Exception {
		playerWith("a", "Alice", 5, 2, 0);
		clock.advance(Duration.ofMinutes(1));
		playerWith("b", "Bob", 9, 1, 0);
		clock.advance(Duration.ofMinutes(1));
		// Même progression qu'Alice, mais atteinte après elle
		UUID carol = playerWith("c", "Carol", 5, 2, 0);

		mockMvc.perform(get("/api/leaderboard/depth").with(as(carol)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.top[0].pseudo").value("Bob"))
			.andExpect(jsonPath("$.top[0].value").value(121))
			.andExpect(jsonPath("$.top[1].pseudo").value("Alice"))
			.andExpect(jsonPath("$.top[2].pseudo").value("Carol"))
			.andExpect(jsonPath("$.top[2].rank").value(3))
			.andExpect(jsonPath("$.me.rank").value(3))
			// Seuls pseudo, rang et valeur sont publics
			.andExpect(jsonPath("$.top[0].playerId").doesNotExist());
	}

	@Test
	void leClassementMontreLeTitrePorte() throws Exception {
		UUID alice = playerWith("a", "Alice", 5, 2, 0);
		jdbc.update("update player set title = 'forge-100' where id = ?", alice);
		mockMvc.perform(get("/api/leaderboard/depth"))
			.andExpect(jsonPath("$.top[0].title").value("forge-100"));
	}

	@Test
	void classementDuPuits() throws Exception {
		playerWith("a", "Alice", 8, 1, 12);
		playerWith("b", "Bob", 9, 1, 3);
		mockMvc.perform(get("/api/leaderboard/abyss"))
			.andExpect(jsonPath("$.top[0].pseudo").value("Alice"))
			.andExpect(jsonPath("$.top[0].value").value(12))
			.andExpect(jsonPath("$.me").doesNotExist());
	}

	@Test
	void joueurSansSauvegardeHorsClassement() throws Exception {
		mockMvc.perform(get("/api/leaderboard/depth").with(as(newPlayer("neuf"))))
			.andExpect(jsonPath("$.top").isEmpty())
			.andExpect(jsonPath("$.me").doesNotExist());
	}

	@Test
	void classementInconnu() throws Exception {
		mockMvc.perform(get("/api/leaderboard/or")).andExpect(status().isNotFound());
	}

	@Test
	void unePartieRefuseeNEntrePasAuClassement() throws Exception {
		UUID cheater = newPlayer("x");
		mockMvc.perform(put("/api/save").with(as(cheater)).with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content(json.writeValueAsString(Map.of("data",
					Map.of("mine-explorer.progress", "{\"zone\":9000,\"stage\":1,\"damage\":0}")))))
			.andExpect(status().isUnprocessableContent());
		mockMvc.perform(get("/api/leaderboard/depth")).andExpect(jsonPath("$.top").isEmpty());
	}

	@Test
	void egaliteParfaiteMemeRangDansLeHautEtPourLeJoueur() throws Exception {
		// Même valeur atteinte au même instant : le rang personnel doit être celui de la ligne du haut du classement
		UUID first = playerWith("a", "Alice", 5, 2, 0);
		UUID second = playerWith("b", "Bob", 5, 2, 0);
		for (UUID player : List.of(first, second)) {
			String pseudo = accounts.get(player).getPseudo();
			String body = mockMvc.perform(get("/api/leaderboard/depth").with(as(player)))
				.andReturn()
				.getResponse()
				.getContentAsString();
			JsonNode response = json.readTree(body);
			int rankInTop = 0;
			for (JsonNode entry : response.get("top")) {
				if (entry.get("pseudo").asString().equals(pseudo)) {
					rankInTop = entry.get("rank").asInt();
				}
			}
			assertThat(response.get("me").get("rank").asInt()).isEqualTo(rankInTop);
		}
	}

	@Test
	void partieTrafiqueeAvantConnexionSansPlaceGagnee() throws Exception {
		// Alice joue connectée depuis 4 h et atteint la zone 9
		playerWith("a", "Alice", 9, 1, 0);
		// Mallory se connecte avec une partie locale trafiquée (zone 13), acceptée par l'anti-triche
		UUID mallory = newPlayer("m");
		accounts.rename(mallory, "Mallory");
		putSave(mallory, null, 13, 1, 0).andExpect(status().isOk());

		mockMvc.perform(get("/api/leaderboard/depth").with(as(mallory)))
			.andExpect(jsonPath("$.top[0].pseudo").value("Alice"))
			.andExpect(jsonPath("$.me.rank").value(2))
			// Affichée au niveau d'un joueur qui vient de commencer, pas à sa zone trafiquée
			.andExpect(jsonPath("$.me.value").value(40));
		// La partie, elle, est gardée entière
		mockMvc.perform(get("/api/save").with(as(mallory)))
			.andExpect(jsonPath("$.data['mine-explorer.progress']").value(containsString("\"zone\":13")));

		// Elle remonte ensuite au rythme du jeu, à chaque envoi
		clock.advance(Duration.ofHours(2));
		putSave(mallory, 0L, 13, 1, 0).andExpect(status().isOk());
		mockMvc.perform(get("/api/leaderboard/depth").with(as(mallory)))
			.andExpect(jsonPath("$.me.value").value(114))
			.andExpect(jsonPath("$.me.rank").value(2));
	}

	@Test
	void leFluxPrevientQuandUnClassementChange() throws Exception {
		MvcResult stream = mockMvc.perform(get("/api/leaderboard/events"))
			.andExpect(request().asyncStarted())
			.andReturn();
		assertThat(stream.getResponse().getContentType()).startsWith("text/event-stream");
		assertThat(stream.getResponse().getHeader("X-Accel-Buffering")).isEqualTo("no");

		UUID alice = playerWith("a", "Alice", 5, 2, 0);
		events.flush();
		String afterFirstSave = stream.getResponse().getContentAsString();
		// Un nouveau joueur entre dans les deux classements ; le flux ne dit que lesquels, sans aucune donnée de joueur
		assertThat(afterFirstSave).contains("event:changed\ndata:depth").contains("event:changed\ndata:abyss")
			.doesNotContain("Alice");

		// Même progression renvoyée : aucun classement ne bouge, rien n'est envoyé
		long version = versionOf(putSave(alice, 0L, 5, 2, 0).andExpect(status().isOk()));
		events.flush();
		assertThat(stream.getResponse().getContentAsString()).isEqualTo(afterFirstSave);

		// Le Puits seul progresse : seul son classement est à relire
		putSave(alice, version, 5, 2, 7).andExpect(status().isOk());
		events.flush();
		assertThat(stream.getResponse().getContentAsString().substring(afterFirstSave.length()))
			.isEqualTo("event:changed\ndata:abyss\n\n");
	}

	@Test
	void uneSauvegardeRefuseeNePrevientPersonne() throws Exception {
		MvcResult stream = mockMvc.perform(get("/api/leaderboard/events")).andReturn();
		String opened = stream.getResponse().getContentAsString();
		putSave(newPlayer("x"), null, 9000, 1, 0).andExpect(status().isUnprocessableContent());
		events.flush();
		assertThat(stream.getResponse().getContentAsString()).isEqualTo(opened);
	}

	private long versionOf(ResultActions response) throws Exception {
		return json.readTree(response.andReturn().getResponse().getContentAsString()).get("version").asLong();
	}

	private ResultActions putSave(UUID player, Long expectedVersion, int zone, int stage, int abyss) throws Exception {
		return mockMvc.perform(put("/api/save").with(as(player)).with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content(saveBody(expectedVersion, zone, stage, abyss)));
	}
}
