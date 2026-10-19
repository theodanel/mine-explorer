package com.theodanel.backend.save;

import java.time.Duration;
import java.time.Instant;

import com.theodanel.backend.config.MineProperties;

/**
 * Anti-triche de niveau 1 (« plausibilité ») : le serveur ne recalcule pas la partie, il refuse une progression
 * qu'aucun joueur n'aurait pu atteindre dans le temps écoulé.
 *
 * <p>Chaque sauvegarde garde une <b>origine de jeu</b> : l'instant le plus tardif où un joueur aurait dû commencer à
 * jouer sans pause pour avoir sa progression. Une nouvelle sauvegarde est acceptée si elle ne dépasse pas ce que le
 * joueur simulé ({@link ReferenceCurve}) atteint depuis cette origine, avec un joueur {@code speedFactor} fois plus
 * rapide et une marge fixe. La marge ne se cumule pas d'un envoi à l'autre : l'origine n'avance que d'après la
 * progression réellement envoyée, jamais d'après la marge accordée.
 *
 * <p>Fonctions pures, sans Spring : testées seules.
 */
public final class PlausibilityRules {

	/**
	 * Le Puits ne suit pas la mine : son premier étage se cale sur la force du joueur (firstFloorHp dans
	 * frontend/src/app/balance/abyss.ts), un joueur fort descend donc très bas dès sa zone. Ce qui le borne, c'est le
	 * temps : 3 descentes par jour (ABYSS_DAILY_RUNS), une toutes les 8 h en moyenne, de 30 s chacune.
	 */
	static final double ABYSS_HOURS_PER_RUN = 8;
	/** Étages qu'une descente de 30 s peut franchir au plus, même en cassant chaque étage en une demi-seconde. */
	static final int ABYSS_MAX_FLOORS_PER_RUN = 60;
	/** Garde-fou du jeu (MAX_FLOOR dans abyss-rules.ts). */
	static final int ABYSS_MAX_FLOOR = 500;

	/**
	 * Marge d'une zone au-dessus du joueur de référence, à l'envoi seulement. Sans elle, l'origine recalée à chaque
	 * sauvegarde ne laissait aucun jeu : en zone 11, un filon prend plus d'une heure au joueur de référence, et un vrai
	 * joueur bien équipé qui allait plus vite était refusé. Elle ne se cumule pas : l'origine ne suit que la
	 * progression envoyée.
	 */
	static final int STAGE_MARGIN = 15;

	private static final double SECONDS_PER_HOUR = 3600;

	private final Instant releaseDate;
	private final double speedFactor;
	private final Duration grace;

	public PlausibilityRules(MineProperties.AntiCheat settings) {
		this.releaseDate = settings.releaseDate();
		this.speedFactor = settings.speedFactor();
		this.grace = settings.grace();
	}

	/** Première sauvegarde du compte : la partie locale a pu commencer dès la mise en ligne du jeu. */
	public Instant firstOrigin() {
		return releaseDate;
	}

	/** Plus grand nombre d'étapes acceptable à {@code now} pour une partie d'origine {@code origin}. */
	public int maxStages(Instant origin, Instant now) {
		double hours = Math.max(0, Duration.between(origin, now).toMillis() / 1000.0 / SECONDS_PER_HOUR);
		double graceHours = grace.toMillis() / 1000.0 / SECONDS_PER_HOUR;
		return (int) Math.floor(ReferenceCurve.stagesAt(hours * speedFactor + graceHours));
	}

	/** Plus grand nombre d'étapes accepté à l'envoi : la courbe de référence, plus une zone de marge. */
	public int maxAcceptedStages(Instant origin, Instant now) {
		return maxStages(origin, now) + STAGE_MARGIN;
	}

	/**
	 * Origine après une sauvegarde acceptée : l'instant le plus tardif compatible avec la progression envoyée, sans
	 * jamais reculer.
	 */
	public Instant nextOrigin(Instant origin, int stagesReached, Instant now) {
		long minimalPlayMillis = Math.round(ReferenceCurve.hoursFor(stagesReached) / speedFactor * SECONDS_PER_HOUR
				* 1000);
		Instant latest = now.minusMillis(minimalPlayMillis);
		return latest.isAfter(origin) ? latest : origin;
	}

	/**
	 * Valeurs affichées au classement : jamais plus que ce qu'un joueur aurait pu atteindre depuis la création de son
	 * compte (sa première connexion). Une partie trafiquée en local avant la connexion, puis envoyée, ne fait donc
	 * gagner aucune place ; une vraie partie jouée hors ligne remonte à sa place au fil du temps, sans jamais être
	 * perdue (la sauvegarde, elle, est gardée entière).
	 */
	public SaveMetrics ranked(SaveMetrics metrics, Instant accountCreatedAt, Instant now) {
		int stages = Math.min(metrics.stagesReached(), maxStages(accountCreatedAt, now));
		int record = Math.min(metrics.abyssRecord(), maxAbyssRecord(accountCreatedAt, now));
		return new SaveMetrics(stages, record);
	}

	/** Record du Puits atteignable entre {@code since} et {@code now} : les descentes possibles, au plus profond. */
	public int maxAbyssRecord(Instant since, Instant now) {
		double hours = Math.max(0, Duration.between(since, now).toMillis() / 1000.0 / SECONDS_PER_HOUR);
		long runs = (long) Math.ceil(hours / ABYSS_HOURS_PER_RUN);
		return (int) Math.min(ABYSS_MAX_FLOOR, runs * ABYSS_MAX_FLOORS_PER_RUN);
	}
}
