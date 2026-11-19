package com.theodanel.backend.league;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.theodanel.backend.support.ApiTestSupport;

import tools.jackson.databind.JsonNode;

class LeagueApiTests extends ApiTestSupport {

	/** Du mercredi 14/10/2026 12 h (UTC) au lundi 19/10/2026 0 h, heure de Paris (22 h UTC la veille). */
	private static final Duration UNTIL_NEXT_MONDAY = Duration.ofDays(4).plusHours(10);

	private long save(UUID player, Long version, int zone, int stage) throws Exception {
		String body = mockMvc.perform(put("/api/save").with(as(player)).with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content(saveBody(version, zone, stage, 0)))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString();
		return json.readTree(body).get("version").asLong();
	}

	private UUID player(String subject, String pseudo) {
		UUID player = newPlayer(subject);
		accounts.rename(player, pseudo);
		return player;
	}

	@Test
	void pasDeLigueSansSauvegarde() throws Exception {
		mockMvc.perform(get("/api/league").with(as(newPlayer("neuf"))))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("league-none"));
	}

	@Test
	void premiereSauvegardeEnBronzeEtScoreDeLaSemaine() throws Exception {
		UUID alice = player("a", "Alice");
		clock.advance(Duration.ofHours(4));
		long version = save(alice, null, 2, 1);
		mockMvc.perform(get("/api/league").with(as(alice)))
			.andExpect(jsonPath("$.league").value("BRONZE"))
			.andExpect(jsonPath("$.me.score").value(0));

		clock.advance(Duration.ofHours(1));
		save(alice, version, 3, 1);
		String body = mockMvc.perform(get("/api/league").with(as(alice))).andReturn().getResponse().getContentAsString();
		JsonNode view = json.readTree(body);
		assertThat(view.get("me").get("score").asInt()).isPositive();
		assertThat(view.get("members").get(0).get("pseudo").asString()).isEqualTo("Alice");
	}

	@Test
	void finDeSemaineLeMeilleurMonteLeDernierDescendEtChacunEstRecompense() throws Exception {
		UUID alice = player("a", "Alice");
		UUID bob = player("b", "Bob");
		clock.advance(Duration.ofHours(4));
		long aliceVersion = save(alice, null, 2, 1);
		save(bob, null, 2, 1);
		// Alice gagne des filons dans la semaine, Bob non
		clock.advance(Duration.ofHours(1));
		save(alice, aliceVersion, 4, 1);

		clock.advance(UNTIL_NEXT_MONDAY);
		mockMvc.perform(get("/api/league").with(as(alice)))
			.andExpect(jsonPath("$.league").value("SILVER"))
			.andExpect(jsonPath("$.me.score").value(0))
			.andExpect(jsonPath("$.pending.shards").value(League.BRONZE.weeklyShards()))
			.andExpect(jsonPath("$.pending.to").value("SILVER"));
		// Bob, dernier mais déjà en Bronze, reste en Bronze, sans récompense : il n'a rien gagné
		mockMvc.perform(get("/api/league").with(as(bob)))
			.andExpect(jsonPath("$.league").value("BRONZE"))
			.andExpect(jsonPath("$.pending").doesNotExist());

		// La récompense ne se récupère qu'une fois
		mockMvc.perform(post("/api/league/claim").with(as(alice)).with(csrf()))
			.andExpect(jsonPath("$.shards").value(League.BRONZE.weeklyShards()));
		mockMvc.perform(post("/api/league/claim").with(as(alice)).with(csrf())).andExpect(jsonPath("$.shards").value(0));
	}
}
