package com.theodanel.backend.security;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Refuse avant lecture un corps de requête trop gros, ou de taille inconnue (envoi « chunked ») : Jackson lirait
 * sinon tout en mémoire avant que la validation ne s'en mêle. Les navigateurs annoncent toujours la taille.
 */
public class BodySizeFilter extends OncePerRequestFilter {

	private final long maxBodyBytes;

	public BodySizeFilter(long maxBodyBytes) {
		this.maxBodyBytes = maxBodyBytes;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String method = request.getMethod();
		return !("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method));
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		long length = request.getContentLengthLong();
		boolean chunked = length < 0 && request.getHeader("Transfer-Encoding") != null;
		if (chunked) {
			ProblemResponses.write(response, HttpStatus.LENGTH_REQUIRED, "length-required",
					"Taille de la requête manquante");
			return;
		}
		if (length > maxBodyBytes) {
			ProblemResponses.write(response, HttpStatus.CONTENT_TOO_LARGE, "body-too-large", "Requête trop volumineuse");
			return;
		}
		chain.doFilter(request, response);
	}
}
