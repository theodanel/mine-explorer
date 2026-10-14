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

	/** Le Puits commence au 5-1 : l'étage 1 vaut l'étape 61 (voir frontend/src/app/balance/abyss.ts). */
	static final int ABYSS_FIRST_FLOOR_STAGE = 61;
	/** Chaque étage du Puits avance de deux filons dans la courbe de la mine. */
	static final int ABYSS_STAGES_PER_FLOOR = 2;
	/** Étages de marge : un build fort descend un peu plus loin dans le Puits que dans la mine. */
	static final int ABYSS_FLOOR_MARGIN = 10;
	/** Garde-fou du jeu (MAX_FLOOR dans abyss-rules.ts). */
	static final int ABYSS_MAX_FLOOR = 500;

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

	/** Record du Puits atteignable avec cette progression dans la mine : 0 avant le 5-1. */
	public int maxAbyssRecord(int stagesReached) {
		if (stagesReached < ABYSS_FIRST_FLOOR_STAGE) {
			return 0;
		}
		int floorsInMine = (stagesReached - ABYSS_FIRST_FLOOR_STAGE) / ABYSS_STAGES_PER_FLOOR + 1;
		return Math.min(ABYSS_MAX_FLOOR, floorsInMine + ABYSS_FLOOR_MARGIN);
	}
}
