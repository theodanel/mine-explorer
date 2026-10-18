package com.theodanel.backend.security;

import java.io.IOException;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

/**
 * Réponses d'erreur écrites par les filtres, avant Spring MVC : même forme que les {@code ProblemDetail} de l'API.
 * Le titre et le code sont des constantes du code, jamais une donnée reçue : pas d'échappement JSON à gérer.
 */
final class ProblemResponses {

	private ProblemResponses() {
	}

	static void write(HttpServletResponse response, HttpStatus status, String code, String title) throws IOException {
		response.setStatus(status.value());
		response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
		response.setCharacterEncoding("UTF-8");
		response.getWriter()
			.write("{\"status\":" + status.value() + ",\"title\":\"" + title + "\",\"code\":\"" + code + "\"}");
	}
}
