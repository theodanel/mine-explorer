package com.theodanel.backend.security;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Donne au front le jeton CSRF à renvoyer dans l'en-tête {@value SecurityConfig#CSRF_HEADER} de chaque écriture.
 * Lisible seulement par l'adresse du jeu (CORS) : un autre site ne peut pas le récupérer. À redemander après la
 * connexion, qui en génère un nouveau.
 */
@RestController
public class CsrfController {

	public record CsrfResponse(String headerName, String token) {
	}

	@GetMapping("/api/csrf")
	public CsrfResponse csrf(CsrfToken token) {
		return new CsrfResponse(token.getHeaderName(), token.getToken());
	}
}
