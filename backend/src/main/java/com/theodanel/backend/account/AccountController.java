package com.theodanel.backend.account;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.theodanel.backend.save.SaveService;
import com.theodanel.backend.security.PlayerOidcUser;

/** Compte du joueur connecté. Comme pour la sauvegarde, le joueur vient toujours de la session. */
@RestController
@RequestMapping("/api/me")
public class AccountController {

	private final AccountService accounts;
	private final SaveService saves;
	private final FindByIndexNameSessionRepository<? extends Session> sessions;

	public AccountController(AccountService accounts, SaveService saves,
			FindByIndexNameSessionRepository<? extends Session> sessions) {
		this.accounts = accounts;
		this.saves = saves;
		this.sessions = sessions;
	}

	public record Profile(String pseudo, Instant createdAt, List<String> providers) {
	}

	public record RenameRequest(@NotNull String pseudo) {
	}

	public record IdentityExport(String provider, String subject, Instant linkedAt) {
	}

	public record SaveExport(long version, Instant updatedAt, Map<String, String> data) {
	}

	/** Toutes les données gardées sur le joueur (droit d'accès et de portabilité, RGPD). */
	public record AccountExport(UUID id, String pseudo, Instant createdAt, List<IdentityExport> identities,
			SaveExport save) {
	}

	@GetMapping
	public Profile me(@AuthenticationPrincipal PlayerOidcUser user) {
		Player player = accounts.get(user.getPlayerId());
		List<String> providers = accounts.identitiesOf(player.getId())
			.stream()
			.map(PlayerIdentity::getProvider)
			.toList();
		return new Profile(player.getPseudo(), player.getCreatedAt(), providers);
	}

	@PutMapping("/pseudo")
	public Profile rename(@AuthenticationPrincipal PlayerOidcUser user, @Valid @RequestBody RenameRequest request) {
		accounts.rename(user.getPlayerId(), request.pseudo());
		return me(user);
	}

	@GetMapping("/export")
	public AccountExport export(@AuthenticationPrincipal PlayerOidcUser user) {
		Player player = accounts.get(user.getPlayerId());
		List<IdentityExport> identities = accounts.identitiesOf(player.getId())
			.stream()
			.map(identity -> new IdentityExport(identity.getProvider(), identity.getSubject(), identity.getLinkedAt()))
			.toList();
		SaveExport save = saves.find(player.getId())
			.map(stored -> new SaveExport(stored.version(), stored.updatedAt(), stored.data()))
			.orElse(null);
		return new AccountExport(player.getId(), player.getPseudo(), player.getCreatedAt(), identities, save);
	}

	/** Supprime le compte, sa partie et toutes ses sessions, sur tous les appareils. */
	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@AuthenticationPrincipal PlayerOidcUser user, HttpServletRequest request) {
		accounts.delete(user.getPlayerId());
		closeAllSessions(user, request);
	}

	/** « Se déconnecter partout » : appareil perdu, ordinateur partagé. */
	@PostMapping("/logout-everywhere")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void logoutEverywhere(@AuthenticationPrincipal PlayerOidcUser user, HttpServletRequest request) {
		closeAllSessions(user, request);
	}

	private void closeAllSessions(PlayerOidcUser user, HttpServletRequest request) {
		HttpSession current = request.getSession(false);
		String currentId = current == null ? null : current.getId();
		sessions.findByPrincipalName(user.getName())
			.keySet()
			.stream()
			.filter(id -> !id.equals(currentId))
			.forEach(sessions::deleteById);
		// La session en cours est fermée par le conteneur, pour qu'elle ne soit pas réenregistrée en fin de requête
		if (current != null) {
			current.invalidate();
		}
		SecurityContextHolder.clearContext();
	}
}
