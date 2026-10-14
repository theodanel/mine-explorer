package com.theodanel.backend.save;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.data.Offset.offset;

import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.Test;

import com.theodanel.backend.config.MineProperties;

class PlausibilityRulesTests {

	private static final Instant RELEASE = Instant.parse("2026-10-11T00:00:00Z");
	private final PlausibilityRules rules = new PlausibilityRules(
			new MineProperties.AntiCheat(RELEASE, 2, Duration.ofMinutes(15)));

	@Test
	void courbeEtReciproqueConcordent() {
		for (int stages = 1; stages <= 400; stages++) {
			assertThat(ReferenceCurve.stagesAt(ReferenceCurve.hoursFor(stages))).isCloseTo(stages,
					offset(1e-6));
		}
	}

	@Test
	void courbeCroissante() {
		double previous = 0;
		for (double hours = 0; hours < 1000; hours += 0.5) {
			double stages = ReferenceCurve.stagesAt(hours);
			assertThat(stages).isGreaterThanOrEqualTo(previous);
			previous = stages;
		}
	}

	@Test
	void unJoueurNormalPasse() {
		// Simulateur, profil continu : zone 5 à 53 min. Un joueur qui y est après 2 h réelles passe largement.
		Instant now = RELEASE.plus(Duration.ofDays(3));
		Instant origin = rules.nextOrigin(RELEASE, 16, now);
		Instant later = now.plus(Duration.ofHours(2));
		assertThat(rules.maxStages(origin, later)).isGreaterThanOrEqualTo(61);
	}

	@Test
	void unSautImpossibleEstDetecte() {
		Instant now = RELEASE.plus(Duration.ofDays(3));
		Instant origin = rules.nextOrigin(RELEASE, 16, now);
		// Zone 2 vers zone 10 (étape 136) en 10 minutes : il en faut 11 h au joueur simulé
		assertThat(rules.maxStages(origin, now.plus(Duration.ofMinutes(10)))).isLessThan(136);
	}

	@Test
	void laMargeNeSeCumulePasDEnvoiEnEnvoi() {
		// Un tricheur envoie chaque minute le maximum accepté : en 2 h il ne doit pas dépasser
		// ce qu'un joueur deux fois plus rapide que le simulé ferait en 2 h, plus une seule marge.
		Instant start = RELEASE.plus(Duration.ofDays(3));
		Instant origin = rules.nextOrigin(RELEASE, 1, start);
		Instant now = start;
		int stages = 1;
		for (int minute = 1; minute <= 120; minute++) {
			now = now.plus(Duration.ofMinutes(1));
			stages = rules.maxStages(origin, now);
			origin = rules.nextOrigin(origin, stages, now);
		}
		int bound = (int) Math.floor(ReferenceCurve.stagesAt(2 * 2 + 0.25));
		assertThat(stages).isLessThanOrEqualTo(bound);
	}

	@Test
	void premiereSauvegardeBorneeParLaMiseEnLigne() {
		// Une heure après la mise en ligne, personne n'a pu finir la zone 10
		assertThat(rules.maxStages(rules.firstOrigin(), RELEASE.plus(Duration.ofHours(1)))).isLessThan(136);
	}

	@Test
	void lOrigineNeReculeJamais() {
		Instant now = RELEASE.plus(Duration.ofDays(3));
		Instant origin = rules.nextOrigin(RELEASE, 151, now);
		// Une sauvegarde plus ancienne (moins avancée) ne rend pas de temps au joueur
		assertThat(rules.nextOrigin(origin, 16, now.plus(Duration.ofMinutes(1)))).isAfterOrEqualTo(origin);
	}

	@Test
	void recordDuPuitsSuitLaMine() {
		assertThat(rules.maxAbyssRecord(60)).isZero();
		assertThat(rules.maxAbyssRecord(61)).isEqualTo(1 + PlausibilityRules.ABYSS_FLOOR_MARGIN);
		assertThat(rules.maxAbyssRecord(100_000)).isEqualTo(PlausibilityRules.ABYSS_MAX_FLOOR);
	}

	@Test
	void classementDUnePartieTrafiqueeAvantConnexionPlafonne() {
		// Compte créé 20 jours après la sortie : la partie envoyée passe l'anti-triche (bornée depuis la sortie),
		// mais le classement n'affiche que ce qui est atteignable depuis la connexion
		Instant createdAt = RELEASE.plus(Duration.ofDays(20));
		SaveMetrics ranked = rules.ranked(new SaveMetrics(400, 200), createdAt, createdAt);
		assertThat(ranked.stagesReached()).isEqualTo(rules.maxStages(createdAt, createdAt)).isLessThan(46);
		assertThat(ranked.abyssRecord()).isZero();
	}

	@Test
	void partieHorsLigneHonneteRetrouveSaPlaceEnDeuxFoisMoinsDeTemps() {
		// Zone 9 (étape 121) : 7,2 h au joueur simulé, donc 3,6 h au plus rapide toléré
		Instant createdAt = RELEASE.plus(Duration.ofDays(20));
		SaveMetrics played = new SaveMetrics(121, 0);
		assertThat(rules.ranked(played, createdAt, createdAt.plus(Duration.ofHours(1))).stagesReached()).isLessThan(121);
		assertThat(rules.ranked(played, createdAt, createdAt.plus(Duration.ofMinutes(216))).stagesReached())
			.isEqualTo(121);
	}

	@Test
	void joueurConnecteDesLeDebutJamaisPlafonne() {
		Instant createdAt = RELEASE.plus(Duration.ofDays(20));
		for (int hours = 0; hours <= 400; hours += 5) {
			Instant now = createdAt.plus(Duration.ofHours(hours));
			// Progression la plus rapide que l'anti-triche accepte depuis la connexion
			SaveMetrics fastest = new SaveMetrics(rules.maxStages(createdAt, now), 0);
			assertThat(rules.ranked(fastest, createdAt, now)).isEqualTo(fastest);
		}
	}
}
