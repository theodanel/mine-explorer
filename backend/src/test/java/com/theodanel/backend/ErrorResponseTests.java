package com.theodanel.backend;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

/** Une route inconnue répond 404 sans rien révéler du serveur (pas de trace d'exception). */
@SpringBootTest
@AutoConfigureMockMvc
class ErrorResponseTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void routeInconnueSansTraceInterne() throws Exception {
		mockMvc.perform(get("/route-inexistante"))
			.andExpect(status().isNotFound())
			.andExpect(content().string(not(containsString("Exception"))))
			.andExpect(content().string(not(containsString("at com."))));
	}

	@Test
	void consoleH2Fermee() throws Exception {
		mockMvc.perform(get("/h2-console")).andExpect(status().isNotFound());
	}
}
