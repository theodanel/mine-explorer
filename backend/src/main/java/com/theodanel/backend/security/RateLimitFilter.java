package com.theodanel.backend.security;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.util.Set;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import com.theodanel.backend.config.MineProperties;

/**
 * Limite de requêtes par adresse IP, avant toute autre étape (session, sécurité, base) : une rafale coûte le
 * moins possible au serveur. Trois budgets : connexion (le plus serré, contre la force brute et l'abus du flux
 * OAuth), écriture et lecture de l'API.
 */
public class RateLimitFilter extends OncePerRequestFilter {

	private static final Logger LOG = LoggerFactory.getLogger(RateLimitFilter.class);
	private static final Duration WINDOW = Duration.ofMinutes(1);
	private static final Set<String> WRITE_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

	private final MineProperties.RateLimit limits;
	private final RateLimiter limiter;

	public RateLimitFilter(MineProperties.RateLimit limits, Clock clock) {
		this.limits = limits;
		this.limiter = new RateLimiter(WINDOW, clock);
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return category(request) == null;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String category = category(request);
		long retryAfter = limiter.acquire(category + ':' + clientIp(request), limitOf(category));
		if (retryAfter == 0) {
			chain.doFilter(request, response);
			return;
		}
		LOG.warn("Limite de requêtes atteinte ({})", category);
		response.setHeader(HttpHeaders.RETRY_AFTER, Long.toString(retryAfter));
		ProblemResponses.write(response, HttpStatus.TOO_MANY_REQUESTS, "rate-limited",
				"Trop de requêtes, réessaie dans un instant");
	}

	/** Catégorie de budget, ou null pour une requête non limitée (contrôle de santé de l'hébergeur). */
	private static String category(HttpServletRequest request) {
		String path = request.getRequestURI().substring(request.getContextPath().length());
		if (path.startsWith("/oauth2/") || path.startsWith("/login/")) {
			return "login";
		}
		if (path.startsWith("/api/")) {
			return WRITE_METHODS.contains(request.getMethod()) ? "write" : "read";
		}
		return null;
	}

	private int limitOf(String category) {
		return switch (category) {
			case "login" -> limits.loginPerMinute();
			case "write" -> limits.writePerMinute();
			default -> limits.readPerMinute();
		};
	}

	/**
	 * Adresse du joueur. Derrière le proxy de l'hébergeur, l'adresse de la connexion est celle du proxy : on lit
	 * alors l'en-tête qu'il pose. Cet en-tête n'est lu que s'il est configuré, sinon un client pourrait l'inventer
	 * pour changer d'adresse à chaque requête.
	 */
	private String clientIp(HttpServletRequest request) {
		String header = limits.clientIpHeader();
		if (header != null && !header.isBlank()) {
			String value = request.getHeader(header);
			if (value != null && !value.isBlank()) {
				return value.strip();
			}
		}
		return request.getRemoteAddr();
	}
}
