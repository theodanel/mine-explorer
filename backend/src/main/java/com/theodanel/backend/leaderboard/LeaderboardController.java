package com.theodanel.backend.leaderboard;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.theodanel.backend.error.ApiException;
import com.theodanel.backend.security.PlayerOidcUser;

/** Classements publics : seuls les pseudos et les valeurs sont visibles, jamais d'identifiant interne. */
@RestController
public class LeaderboardController {

	private final LeaderboardService leaderboards;

	public LeaderboardController(LeaderboardService leaderboards) {
		this.leaderboards = leaderboards;
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
