package com.theodanel.backend.save;

import java.time.Instant;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.theodanel.backend.error.ApiException;
import com.theodanel.backend.security.PlayerOidcUser;

/**
 * Partie du joueur connecté. Aucun identifiant dans l'URL : le joueur vient de la session, un joueur ne peut donc
 * ni lire ni écrire la partie d'un autre (anti-IDOR par construction).
 */
@RestController
@RequestMapping("/api/save")
public class SaveController {

	/** Clés du localStorage du jeu : préfixe fixe, minuscules, chiffres et tirets. */
	static final String KEY_PATTERN = "mine-explorer\\.[a-z0-9-]{1,40}";
	static final int MAX_KEYS = 64;
	static final int MAX_VALUE_CHARS = 64 * 1024;

	private final SaveService saves;

	public SaveController(SaveService saves) {
		this.saves = saves;
	}

	public record SaveRequest(
			/** Version sur laquelle l'appareil s'est basé ; null pour le tout premier envoi. */
			@PositiveOrZero Long expectedVersion,
			@NotNull @Size(max = MAX_KEYS) Map<@NotNull @Pattern(regexp = KEY_PATTERN) String,
					@NotNull @Size(max = MAX_VALUE_CHARS) String> data) {
	}

	public record SaveResponse(long version, Instant updatedAt, Map<String, String> data) {
	}

	public record SaveReceipt(long version, Instant updatedAt) {
	}

	@GetMapping
	public SaveResponse get(@AuthenticationPrincipal PlayerOidcUser user) {
		return saves.find(user.getPlayerId())
			.map(save -> new SaveResponse(save.version(), save.updatedAt(), save.data()))
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "no-save", "Aucune sauvegarde dans le cloud"));
	}

	@PutMapping
	public SaveReceipt put(@AuthenticationPrincipal PlayerOidcUser user, @Valid @RequestBody SaveRequest request) {
		SaveService.StoredSave saved = saves.replace(user.getPlayerId(), request.expectedVersion(), request.data());
		return new SaveReceipt(saved.version(), saved.updatedAt());
	}
}
