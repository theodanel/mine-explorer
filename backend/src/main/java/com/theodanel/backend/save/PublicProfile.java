package com.theodanel.backend.save;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Ce qu'un autre joueur peut voir d'une partie : la zone, la forme du mineur et l'équipement porté, rien d'autre.
 * Les valeurs sont recopiées une à une depuis une liste blanche (emplacements, paliers, stats connus) : une clé
 * ajoutée à la main dans la sauvegarde ne sort jamais. Une partie illisible donne un profil vide, pas une erreur.
 * Formats tirés du front : equipment-save.ts, awakening-rules.ts, evolution.ts et progression-rules.ts.
 *
 * @param zone zone atteinte (1 pour une partie neuve)
 * @param form rang d'évolution du mineur (0 : Apprenti)
 * @param equipment pièces portées, dans l'ordre des emplacements
 */
public record PublicProfile(int zone, int form, List<Piece> equipment) {

	static final String EQUIPMENT_KEY = "mine-explorer.equipment";
	static final String AWAKENING_KEY = "mine-explorer.eveil";
	static final String EVOLUTION_KEY = "mine-explorer.evolution";

	static final List<String> SLOTS = List.of("helmet", "pickaxe", "bag", "gloves", "boots");
	static final Set<String> TIERS = Set.of("wood", "stone", "copper", "iron", "steel", "gold", "mithril", "crystal",
			"magma", "divine");
	static final List<String> STATS = List.of("strikePower", "miningSpeed", "critChance", "critDamage", "goldBonus");
	/** Bornes larges, seulement contre une valeur absurde : le profil est affiché tel quel. */
	static final int MAX_LEVEL = 1_000;
	static final int MAX_FORM = 100;
	static final int MAX_AWAKENING = 5;

	public static final PublicProfile EMPTY = new PublicProfile(1, 0, List.of());

	/** Une pièce portée : emplacement, palier, niveau, stats et palier d'Éveil (0 hors Divin). */
	public record Piece(String slot, String tier, int level, Map<String, Double> stats, int awakening) {
	}

	public static PublicProfile read(Map<String, String> data, JsonMapper json) {
		int zone = node(data, SaveMetrics.PROGRESS_KEY, json).map(progress -> intIn(progress.get("zone"), 1,
				SaveMetrics.MAX_ZONE, 1)).orElse(1);
		int form = Optional.ofNullable(data.get(EVOLUTION_KEY)).map(PublicProfile::parseForm).orElse(0);
		Map<String, Integer> awakening = node(data, AWAKENING_KEY, json).map(PublicProfile::awakeningLevels).orElse(Map.of());
		List<Piece> equipment = node(data, EQUIPMENT_KEY, json).map(save -> pieces(save.get("equipped"), awakening))
			.orElse(List.of());
		return new PublicProfile(zone, form, equipment);
	}

	private static List<Piece> pieces(JsonNode equipped, Map<String, Integer> awakening) {
		List<Piece> pieces = new ArrayList<>();
		if (equipped == null || !equipped.isObject()) {
			return pieces;
		}
		for (String slot : SLOTS) {
			JsonNode item = equipped.get(slot);
			if (item == null || !item.isObject()) {
				continue;
			}
			String tier = item.path("tier").asString("");
			int level = intIn(item.get("level"), 1, MAX_LEVEL, -1);
			if (!TIERS.contains(tier) || level < 0) {
				continue;
			}
			int awakened = "divine".equals(tier) ? awakening.getOrDefault(slot, 0) : 0;
			pieces.add(new Piece(slot, tier, level, stats(item.get("stats")), awakened));
		}
		return pieces;
	}

	private static Map<String, Double> stats(JsonNode stats) {
		Map<String, Double> values = new LinkedHashMap<>();
		if (stats == null || !stats.isObject()) {
			return values;
		}
		for (String stat : STATS) {
			JsonNode value = stats.get(stat);
			if (value != null && value.isNumber() && Double.isFinite(value.doubleValue()) && value.doubleValue() >= 0) {
				values.put(stat, value.doubleValue());
			}
		}
		return values;
	}

	private static Map<String, Integer> awakeningLevels(JsonNode state) {
		Map<String, Integer> levels = new LinkedHashMap<>();
		JsonNode node = state.get("levels");
		if (node == null || !node.isObject()) {
			return levels;
		}
		for (String slot : SLOTS) {
			int level = intIn(node.get(slot), 0, MAX_AWAKENING, 0);
			if (level > 0) {
				levels.put(slot, level);
			}
		}
		return levels;
	}

	private static int parseForm(String raw) {
		try {
			int form = Integer.parseInt(raw.trim());
			return Math.clamp(form, 0, MAX_FORM);
		}
		catch (NumberFormatException unreadable) {
			return 0;
		}
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
			// Partie abîmée : le profil montre ce qui reste lisible, sans faire échouer la requête
			return Optional.empty();
		}
	}

	private static int intIn(JsonNode value, int min, int max, int fallback) {
		if (value == null || !value.isIntegralNumber() || !value.canConvertToInt()) {
			return fallback;
		}
		int number = value.intValue();
		return number < min || number > max ? fallback : number;
	}
}
