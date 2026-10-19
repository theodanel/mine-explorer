package com.theodanel.backend.leaderboard;

import java.util.List;
import java.util.Locale;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.theodanel.backend.error.ApiException;
import com.theodanel.backend.security.PlayerOidcUser;

/** Classements publics : seuls les pseudos et les valeurs sont visibles, jamais d'identifiant interne. */
@RestController
public class LeaderboardController {

	private final LeaderboardService leaderboards;
	private final LeaderboardEvents events;

	public LeaderboardController(LeaderboardService leaderboards, LeaderboardEvents events) {
		this.leaderboards = leaderboards;
		this.events = events;
	}

	/** Flux des classements qui changent, pour les rafraîchir en direct (voir {@link LeaderboardEvents}). */
	@GetMapping(path = "/api/leaderboard/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public SseEmitter events(HttpServletResponse response) {
		// Nginx (Proxy Manager) garderait sinon les messages en mémoire tampon au lieu de les transmettre
		response.setHeader("X-Accel-Buffering", "no");
		return events.subscribe();
	}

	/** {@code me} : la place du joueur connecté, null s'il n'est pas connecté ou n'a pas de sauvegarde. */
	public record LeaderboardResponse(List<LeaderboardService.Entry> top, LeaderboardService.Entry me) {
	}

	@GetMapping("/api/leaderboard/{type}")
	public LeaderboardResponse leaderboard(@PathVariable String type, @AuthenticationPrincipal PlayerOidcUser user) {
		LeaderboardType leaderboard = parse(type);
		LeaderboardService.Entry me = user == null ? null
				: leaderboards.rankOf(leaderboard, user.getPlayerId()).orElse(null);
		return new LeaderboardResponse(leaderboards.top(leaderboard), me);
	}

	private static LeaderboardType parse(String type) {
		for (LeaderboardType candidate : LeaderboardType.values()) {
			if (candidate.name().toLowerCase(Locale.ROOT).equals(type)) {
				return candidate;
			}
		}
		throw new ApiException(HttpStatus.NOT_FOUND, "leaderboard-unknown", "Classement inconnu");
	}
}
