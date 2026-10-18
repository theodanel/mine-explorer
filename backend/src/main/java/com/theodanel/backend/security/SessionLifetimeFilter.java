package com.theodanel.backend.security;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Durée de vie maximale d'une session : l'expiration par inactivité ne suffit pas pour un joueur qui revient
 * chaque jour, dont la session (et un cookie volé) resterait valable indéfiniment. Passé ce délai, la session est
 * détruite et le joueur se reconnecte.
 */
public class SessionLifetimeFilter extends OncePerRequestFilter {

	private final Duration maxLifetime;
	private final Clock clock;

	public SessionLifetimeFilter(Duration maxLifetime, Clock clock) {
		this.maxLifetime = maxLifetime;
		this.clock = clock;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		HttpSession session = request.getSession(false);
		if (session != null && clock.millis() - session.getCreationTime() > maxLifetime.toMillis()) {
			session.invalidate();
		}
		chain.doFilter(request, response);
	}
}
