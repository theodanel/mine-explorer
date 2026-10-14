package com.theodanel.backend.leaderboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.theodanel.backend.support.ApiTestSupport;

import tools.jackson.databind.JsonNode;

class LeaderboardApiTests extends ApiTestSupport {

	private UUID playerWith(String subject, String pseudo, int zone, int stage, int abyss) throws Exception {
		UUID player = newPlayer(subject);
		accounts.rename(player, pseudo);
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
}
