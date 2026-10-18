package com.theodanel.backend.save;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;

import com.theodanel.backend.error.ApiException;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Valeurs classées d'une sauvegarde, lues dans les clés du jeu. Formats tirés du front :
 * {@code mine-explorer.progress} = {@code {zone, stage, damage}} (progression-rules.ts) et
 * {@code mine-explorer.abyss} = {@code {record, …}} (abyss-rules.ts).
 *
 * @param stagesReached étapes atteintes depuis le début : 1 au 1-1, 16 au 2-1
 * @param abyssRecord record d'étages du Puits sans fond
 */
public record SaveMetrics(int stagesReached, int abyssRecord) {

	static final String PROGRESS_KEY = "mine-explorer.progress";
	static final String ABYSS_KEY = "mine-explorer.abyss";
	static final int STAGES_PER_ZONE = 15;
	/** Bien au-delà de la dernière zone dessinée : seul garde-fou contre un entier absurde, l'anti-triche fait le reste. */
	static final int MAX_ZONE = 10_000;

	static final SaveMetrics FRESH = new SaveMetrics(1, 0);

	/** Lit les valeurs classées ; une clé absente vaut une partie neuve, une clé illisible est refusée. */
	static SaveMetrics read(Map<String, String> data, JsonMapper json) {
		int stages = node(data, PROGRESS_KEY, json).map(SaveMetrics::stagesOf).orElse(FRESH.stagesReached());
		int record = node(data, ABYSS_KEY, json).map(SaveMetrics::recordOf).orElse(FRESH.abyssRecord());
		return new SaveMetrics(stages, record);
	}

	private static Optional<JsonNode> node(Map<String, String> data, String key, JsonMapper json) {
		String raw = data.get(key);
		if (raw == null) {
			return Optional.empty();
		}
		try {
			return Optional.of(json.readTree(raw));
		}
		catch (JacksonException unreadable) {
			throw invalid();
		}
	}

	private static int stagesOf(JsonNode progress) {
		int zone = intIn(progress.get("zone"), 1, MAX_ZONE);
		int stage = intIn(progress.get("stage"), 1, STAGES_PER_ZONE);
		return (zone - 1) * STAGES_PER_ZONE + stage;
	}

	private static int recordOf(JsonNode abyss) {
		return intIn(abyss.get("record"), 0, PlausibilityRules.ABYSS_MAX_FLOOR);
	}

	private static int intIn(JsonNode value, int min, int max) {
		if (value == null || !value.isIntegralNumber() || !value.canConvertToInt()) {
			throw invalid();
		}
		int number = value.intValue();
		if (number < min || number > max) {
			throw invalid();
		}
		return number;
	}

	private static ApiException invalid() {
		return new ApiException(HttpStatus.BAD_REQUEST, "save-invalid", "Sauvegarde illisible");
	}
}
