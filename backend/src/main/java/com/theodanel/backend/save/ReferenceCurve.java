package com.theodanel.backend.save;

/**
 * Progression du joueur simulé qui joue sans arrêt : étapes atteintes (1 au 1-1, 16 au 2-1) en fonction des heures
 * de jeu. Relevée avec {@code node --import ./tools/register-ts.mjs tools/simulate.mts continu 12} (frontend, le
 * 20/10/2026), à refaire après tout rééquilibrage qui accélère la progression. Celle du 14/10/2026 datait d'avant les
 * zones 11 à 20 et les étoiles du Cœur du monde : le jeu était devenu 2 à 3 fois plus rapide qu'elle, et de vrais
 * joueurs étaient refusés (zone 13) ou classés trop bas (zone 17 affichée en 13).
 *
 * <p>Au-delà de la zone 20, la Renaissance (25/10/2026) : le joueur renaît et redescend plus loin à chaque vie. Les
 * points suivants sont la meilleure profondeur du même joueur continu, renaissances comprises
 * ({@code tools/simulate.mts continu 40}) : zone 23 en 16 jours, 25 en 22, 27 en 29, 28 en 34, 30 en 39.
 *
 * <p>Entre deux points, interpolation linéaire ; après le dernier, la pente du dernier segment continue.
 */
final class ReferenceCurve {

	/** Heures de jeu continu. Strictement croissantes. */
	private static final double[] HOURS = { 0, 0.033, 0.117, 0.333, 0.65, 1.3, 2.1, 3.0, 5.1, 7.5, 12.0, 17.7, 21.6,
			52.8, 57.6, 67.2, 81.6, 120, 177.6, 264, 384, 528, 696, 816, 936 };

	/** Étapes atteintes à ces heures : le début de chaque zone, de la 1 à la 20, puis des zones 23, 25, 27, 28 et 30. */
	private static final int[] STAGES = { 1, 16, 31, 46, 61, 76, 91, 106, 121, 136, 151, 166, 181, 196, 211, 226, 241,
			256, 271, 286, 331, 361, 391, 406, 436 };

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
