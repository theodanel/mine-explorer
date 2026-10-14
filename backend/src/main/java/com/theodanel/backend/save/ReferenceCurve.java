package com.theodanel.backend.save;

/**
 * Progression du joueur simulé qui joue sans arrêt : étapes atteintes (1 au 1-1, 16 au 2-1) en fonction des heures
 * de jeu. Relevée avec {@code node --import ./tools/register-ts.mjs tools/simulate.mts continu 30} (frontend, le
 * 14/10/2026), à refaire après tout rééquilibrage qui accélère la progression.
 *
 * <p>Entre deux points, interpolation linéaire ; après le dernier, la pente du dernier segment continue.
 */
final class ReferenceCurve {

	/** Heures de jeu continu. Strictement croissantes. */
	private static final double[] HOURS = { 0, 0.05, 0.15, 0.417, 0.883, 1.8, 3.1, 4.5, 7.2, 11.1, 17.5, 50.4, 62.4,
			79.2, 105.6, 129.6, 165.6, 240, 405.6 };

	/** Étapes atteintes à ces heures : le début de chaque zone, de la 1 à la 19. */
	private static final int[] STAGES = { 1, 16, 31, 46, 61, 76, 91, 106, 121, 136, 151, 166, 181, 196, 211, 226, 241,
			256, 271 };

	private ReferenceCurve() {
	}

	/** Étapes atteignables après {@code hours} heures de jeu sans pause. */
	static double stagesAt(double hours) {
		if (hours <= 0) {
			return STAGES[0];
		}
		int last = HOURS.length - 1;
		int segment = last - 1;
		for (int i = 0; i < last; i++) {
			if (hours <= HOURS[i + 1]) {
				segment = i;
				break;
			}
		}
		return interpolate(hours, HOURS[segment], HOURS[segment + 1], STAGES[segment], STAGES[segment + 1]);
	}

	/** Heures de jeu sans pause nécessaires pour atteindre {@code stages} étapes (réciproque de {@link #stagesAt}). */
	static double hoursFor(int stages) {
		if (stages <= STAGES[0]) {
			return 0;
		}
		int last = STAGES.length - 1;
		int segment = last - 1;
		for (int i = 0; i < last; i++) {
			if (stages <= STAGES[i + 1]) {
				segment = i;
				break;
			}
		}
		return interpolate(stages, STAGES[segment], STAGES[segment + 1], HOURS[segment], HOURS[segment + 1]);
	}

	private static double interpolate(double x, double x0, double x1, double y0, double y1) {
		return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
	}
}
