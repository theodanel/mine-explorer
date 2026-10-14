package com.theodanel.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;

import com.theodanel.backend.support.MutableClock;

class SessionLifetimeFilterTests {

	private final MutableClock clock = new MutableClock();
	private final SessionLifetimeFilter filter = new SessionLifetimeFilter(Duration.ofDays(60), clock);

	@Test
	void sessionRecenteGardee() throws Exception {
		MockHttpSession session = sessionCreatedDaysAgo(59);
		filter.doFilter(requestWith(session), new MockHttpServletResponse(), new MockFilterChain());
		assertThat(session.isInvalid()).isFalse();
	}

	@Test
	void sessionTropVieilleFermeeMemeSiUtiliseeChaqueJour() throws Exception {
		MockHttpSession session = sessionCreatedDaysAgo(61);
		filter.doFilter(requestWith(session), new MockHttpServletResponse(), new MockFilterChain());
		assertThat(session.isInvalid()).isTrue();
	}

	private static MockHttpSession sessionCreatedDaysAgo(int days) {
		long createdAt = MutableClock.START.minus(Duration.ofDays(days)).toEpochMilli();
		return new MockHttpSession() {
			@Override
			public long getCreationTime() {
				return createdAt;
			}
		};
	}

	private static MockHttpServletRequest requestWith(MockHttpSession session) {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.setSession(session);
		return request;
	}
}
