package com.theodanel.backend.leaderboard;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.theodanel.backend.support.ApiTestSupport;

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
}
