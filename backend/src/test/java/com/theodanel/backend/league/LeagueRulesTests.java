package com.theodanel.backend.league;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;

class LeagueRulesTests {

	@Test
	void laSemaineCommenceLeLundiAZeroHeureDeParis() {
		// Dimanche 18/10/2026 23 h 30 à Paris (21 h 30 UTC) : encore la semaine du lundi 12
		assertThat(LeagueRules.weekStart(Instant.parse("2026-10-18T21:30:00Z"))).isEqualTo(LocalDate.of(2026, 10, 12));
		// Lundi 19/10/2026 0 h 30 à Paris (dimanche 22 h 30 UTC) : nouvelle semaine
		assertThat(LeagueRules.weekStart(Instant.parse("2026-10-18T22:30:00Z"))).isEqualTo(LocalDate.of(2026, 10, 19));
	}

	@Test
	void vingtPourCentMontentEtDescendentAuMoinsUn() {
		assertThat(LeagueRules.promoteCount(10)).isEqualTo(2);
		assertThat(LeagueRules.demoteCount(10)).isEqualTo(2);
		assertThat(LeagueRules.promoteCount(3)).isEqualTo(1);
		assertThat(LeagueRules.demoteCount(3)).isEqualTo(1);
		// Seul dans sa ligue : il peut monter, jamais descendre
		assertThat(LeagueRules.promoteCount(1)).isEqualTo(1);
		assertThat(LeagueRules.demoteCount(1)).isZero();
	}

	@Test
	void unJoueurSansFilonsDeLaSemaineNeMontePas() {
		assertThat(LeagueRules.movement(0, 5, 12)).isEqualTo(1);
		assertThat(LeagueRules.movement(0, 5, 0)).isZero();
		assertThat(LeagueRules.movement(4, 5, 3)).isEqualTo(-1);
		assertThat(LeagueRules.movement(2, 5, 3)).isZero();
	}
}
