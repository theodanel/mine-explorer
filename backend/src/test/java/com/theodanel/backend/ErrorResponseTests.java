package com.theodanel.backend;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

import com.theodanel.backend.support.ApiTestSupport;

/**
 * Une route inconnue est refusée sans rien révéler du serveur (pas de trace d'exception). Tout ce qui n'est pas
 * explicitement ouvert est refusé avant même de savoir si la route existe : 401, et non 404.
 */
class ErrorResponseTests extends ApiTestSupport {

	@Test
	void routeInconnueSansTraceInterne() throws Exception {
		mockMvc.perform(get("/route-inexistante"))
			.andExpect(status().isUnauthorized())
			.andExpect(content().string(not(containsString("Exception"))))
			.andExpect(content().string(not(containsString("at com."))));
	}

	@Test
	void routeApiInconnueSansTraceInterne() throws Exception {
		mockMvc.perform(get("/api/inexistante").with(as(newPlayer("theo"))))
			.andExpect(status().isNotFound())
			.andExpect(content().string(not(containsString("Exception"))));
	}

	@Test
	void consoleH2Fermee() throws Exception {
		mockMvc.perform(get("/h2-console")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/h2-console").with(as(newPlayer("theo")))).andExpect(status().isForbidden());
	}
}
