package com.theodanel.backend.league;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.theodanel.backend.error.ApiException;
import com.theodanel.backend.security.PlayerOidcUser;

/** Ligue de la semaine du joueur connecté, et sa récompense de fin de semaine. */
@RestController
public class LeagueController {

	private final LeagueService leagues;

	public LeagueController(LeagueService leagues) {
		this.leagues = leagues;
	}

	public record ClaimResponse(int shards) {
	}

	/** 404 tant que le joueur n'a pas de sauvegarde cloud : il entre en ligue à la première. */
	@GetMapping("/api/league")
	public LeagueService.LeagueView league(@AuthenticationPrincipal PlayerOidcUser user) {
		return leagues.view(user.getPlayerId())
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "league-none", "Pas encore de ligue : joue connecté"));
	}

	@PostMapping("/api/league/claim")
	public ClaimResponse claim(@AuthenticationPrincipal PlayerOidcUser user) {
		return new ClaimResponse(leagues.claim(user.getPlayerId()));
	}
}
