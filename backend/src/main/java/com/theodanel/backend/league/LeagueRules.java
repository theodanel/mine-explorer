package com.theodanel.backend.league;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

/** Règles pures de la ligue : la semaine (heure de Paris) et qui monte ou descend. */
public final class LeagueRules {

	public static final ZoneId PARIS = ZoneId.of("Europe/Paris");
	/** Les 20 % du haut montent, les 20 % du bas descendent, au moins un joueur de chaque côté. */
	static final double MOVE_SHARE = 0.2;

	private LeagueRules() {
	}

	/** Lundi de la semaine en cours, heure de Paris : la semaine change le lundi à 0 h. */
	public static LocalDate weekStart(Instant now) {
		return now.atZone(PARIS).toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
	}

	/** Joueurs qui montent : 20 % du haut (au moins 1), seulement ceux qui ont joué cette semaine. */
	public static int promoteCount(int members) {
		return members == 0 ? 0 : Math.max(1, (int) Math.floor(members * MOVE_SHARE));
	}

	/**
	 * Joueurs qui descendent : 20 % du bas (au moins 1), sans jamais toucher un joueur qui monte : seul dans sa ligue, on
	 * ne descend pas.
	 */
	public static int demoteCount(int members) {
		return Math.min(promoteCount(members), Math.max(members - promoteCount(members), 0));
	}

	/**
	 * Mouvement d'un joueur selon sa place (0 = premier) dans sa ligue triée par score décroissant : +1 monte, -1
	 * descend, 0 reste. Un joueur qui n'a rien gagné de la semaine ne monte pas.
	 */
	public static int movement(int rank, int members, int score) {
		if (rank < promoteCount(members) && score > 0) {
			return 1;
		}
		return rank >= members - demoteCount(members) ? -1 : 0;
	}

	/** Classement d'une ligue : score décroissant, puis le premier entré devant (ordre stable de la liste). */
	public record Standing(java.util.UUID playerId, int score) {
	}

	public static List<Standing> sorted(List<Standing> standings) {
		return standings.stream().sorted((a, b) -> Integer.compare(b.score(), a.score())).toList();
	}
}
