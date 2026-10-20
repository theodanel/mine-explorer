package com.theodanel.backend.leaderboard;

import java.util.Set;

/** Une sauvegarde acceptée a changé une valeur classée : ces classements sont à rafraîchir chez ceux qui les regardent. */
public record LeaderboardChanged(Set<LeaderboardType> types) {

	public LeaderboardChanged {
		types = Set.copyOf(types);
	}
}
