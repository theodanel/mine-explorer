package com.theodanel.backend.error;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.theodanel.backend.save.SaveConflictException;

/**
 * Toutes les erreurs de l'API en {@link ProblemDetail} (RFC 9457) : un statut, un titre en français et un code
 * stable, jamais de trace ni de message d'exception. Les erreurs du framework (JSON illisible, validation, méthode
 * non permise…) passent par {@link ResponseEntityExceptionHandler}, qui ne révèle rien non plus.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger LOG = LoggerFactory.getLogger(ApiExceptionHandler.class);

	@ExceptionHandler(ApiException.class)
	ResponseEntity<ProblemDetail> handleApi(ApiException exception) {
		return problem(exception.getStatus(), exception.getCode(), exception.getMessage(), Map.of());
	}

	/** Le front reçoit la version du cloud pour proposer au joueur de garder l'une ou l'autre partie. */
	@ExceptionHandler(SaveConflictException.class)
	ResponseEntity<ProblemDetail> handleSaveConflict(SaveConflictException exception) {
		return problem(exception.getStatus(), exception.getCode(), exception.getMessage(),
				Map.of("currentVersion", exception.getCurrentVersion(), "currentUpdatedAt",
						exception.getCurrentUpdatedAt().toString()));
	}

	/** Deux appareils ont écrit en même temps : même réponse qu'un conflit de version détecté avant l'écriture. */
	@ExceptionHandler(ObjectOptimisticLockingFailureException.class)
	ResponseEntity<ProblemDetail> handleOptimisticLock() {
		return problem(HttpStatus.CONFLICT, "save-conflict", "La sauvegarde a changé sur un autre appareil",
				Map.of());
	}

	/** Dernier filet : l'erreur complète va dans les logs du serveur, le client ne reçoit qu'un message générique. */
	@ExceptionHandler(Exception.class)
	ResponseEntity<ProblemDetail> handleUnexpected(Exception exception) {
		LOG.error("Erreur inattendue", exception);
		return problem(HttpStatus.INTERNAL_SERVER_ERROR, "internal-error", "Erreur interne du serveur", Map.of());
	}

	public static ResponseEntity<ProblemDetail> problem(HttpStatus status, String code, String title,
			Map<String, Object> properties) {
		ProblemDetail body = ProblemDetail.forStatus(status);
		body.setTitle(title);
		body.setProperty("code", code);
		properties.forEach(body::setProperty);
		return ResponseEntity.status(status).body(body);
	}
}
