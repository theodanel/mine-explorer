package com.theodanel.backend.error;

import org.springframework.http.HttpStatus;

/**
 * Erreur métier attendue, renvoyée telle quelle au client. {@code code} est stable et lisible par le front ;
 * {@code title} est un message en français sans détail interne.
 */
public class ApiException extends RuntimeException {

	private final HttpStatus status;
	private final String code;

	public ApiException(HttpStatus status, String code, String title) {
		super(title);
		this.status = status;
		this.code = code;
	}

	public HttpStatus getStatus() {
		return status;
	}

	public String getCode() {
		return code;
	}
}
