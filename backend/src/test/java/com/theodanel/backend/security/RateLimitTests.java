package com.theodanel.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.theodanel.backend.support.ApiTestSupport;
import com.theodanel.backend.support.MutableClock;

@TestPropertySource(properties = { "mine.rate-limit.read-per-minute=3", "mine.rate-limit.login-per-minute=2" })
class RateLimitTests extends ApiTestSupport {

	@Test
	void auDelaDeLaLimiteRepond429() throws Exception {
		// Adresse propre à ce test : le compteur vit en mémoire pour tout le contexte
		for (int i = 0; i < 3; i++) {
			mockMvc.perform(get("/api/csrf").with(remoteAddr("10.0.0.1"))).andExpect(status().isOk());
		}
		mockMvc.perform(get("/api/csrf").with(remoteAddr("10.0.0.1")))
			.andExpect(status().isTooManyRequests())
			.andExpect(header().exists("Retry-After"))
			.andExpect(jsonPath("$.code").value("rate-limited"));
		// Une autre adresse n'est pas pénalisée
		mockMvc.perform(get("/api/csrf").with(remoteAddr("10.0.0.2"))).andExpect(status().isOk());
	}

	@Test
	void laConnexionALaSienne() throws Exception {
		for (int i = 0; i < 2; i++) {
			mockMvc.perform(get("/oauth2/authorization/google").with(remoteAddr("10.0.1.1")))
				.andExpect(status().isFound());
		}
		mockMvc.perform(get("/oauth2/authorization/google").with(remoteAddr("10.0.1.1")))
			.andExpect(status().isTooManyRequests());
	}

	@Test
	void laFenetreSeRouvre() {
		MutableClock time = new MutableClock();
		RateLimiter limiter = new RateLimiter(Duration.ofMinutes(1), time);
		assertThat(limiter.acquire("k", 1)).isZero();
		assertThat(limiter.acquire("k", 1)).isPositive();
		time.advance(Duration.ofMinutes(1));
		assertThat(limiter.acquire("k", 1)).isZero();
	}

	@Test
	void laMemoireResteBornee() {
		MutableClock time = new MutableClock();
		RateLimiter limiter = new RateLimiter(Duration.ofMinutes(1), time);
		for (int i = 0; i <= RateLimiter.MAX_TRACKED_KEYS; i++) {
			limiter.acquire("ip-" + i, 10);
		}
		assertThat(limiter.trackedKeys()).isLessThanOrEqualTo(RateLimiter.MAX_TRACKED_KEYS);
	}

	private static RequestPostProcessor remoteAddr(String address) {
		return request -> {
			request.setRemoteAddr(address);
			return request;
		};
	}
}
