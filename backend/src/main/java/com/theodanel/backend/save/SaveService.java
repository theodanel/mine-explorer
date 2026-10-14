package com.theodanel.backend.save;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theodanel.backend.config.MineProperties;
import com.theodanel.backend.error.ApiException;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** Lecture et écriture de la partie dans le cloud, avec verrou optimiste et contrôle de plausibilité. */
@Service
public class SaveService {

	private static final Logger LOG = LoggerFactory.getLogger(SaveService.class);
	private static final TypeReference<TreeMap<String, String>> DATA_TYPE = new TypeReference<>() {
	};

	/** Taille utile maximale d'une partie (somme des clés et valeurs) : une vraie partie pèse quelques dizaines de Ko. */
	static final int MAX_DATA_CHARS = 256 * 1024;

	private final CloudSaveRepository saves;
	private final PlausibilityRules plausibility;
	private final JsonMapper json;
	private final Clock clock;

	public SaveService(CloudSaveRepository saves, MineProperties properties, JsonMapper json, Clock clock) {
		this.saves = saves;
		this.plausibility = new PlausibilityRules(properties.antiCheat());
		this.json = json;
		this.clock = clock;
	}

	public record StoredSave(long version, Instant updatedAt, Map<String, String> data) {
	}

	@Transactional(readOnly = true)
	public Optional<StoredSave> find(UUID playerId) {
		return saves.findById(playerId)
			.map(save -> new StoredSave(save.getVersion(), save.getUpdatedAt(), json.readValue(save.getData(), DATA_TYPE)));
	}

	/**
	 * Remplace la partie du joueur. {@code expectedVersion} est la version sur laquelle l'appareil s'est basé : si
	 * un autre appareil a écrit entre-temps, l'envoi est refusé (409) au lieu d'écraser une progression.
	 */
	@Transactional
	public StoredSave replace(UUID playerId, Long expectedVersion, Map<String, String> data) {
		requireReasonableSize(data);
		Instant now = clock.instant();
		Optional<CloudSave> existing = saves.findById(playerId);
		existing.ifPresent(save -> requireVersion(save, expectedVersion));

		SaveMetrics metrics = SaveMetrics.read(data, json);
		Instant origin = existing.map(CloudSave::getPlayOrigin).orElseGet(plausibility::firstOrigin);
		requirePlausible(metrics, origin, now);

		CloudSave save = existing.orElseGet(() -> new CloudSave(playerId));
		TreeMap<String, String> sorted = new TreeMap<>(data);
		save.replace(json.writeValueAsString(sorted), metrics,
				plausibility.nextOrigin(origin, metrics.stagesReached(), now), now);
		CloudSave saved = saves.saveAndFlush(save);
		return new StoredSave(saved.getVersion(), saved.getUpdatedAt(), sorted);
	}

	private static void requireReasonableSize(Map<String, String> data) {
		long total = data.entrySet()
			.stream()
			.mapToLong(entry -> entry.getKey().length() + (long) entry.getValue().length())
			.sum();
		if (total > MAX_DATA_CHARS) {
			throw new ApiException(HttpStatus.CONTENT_TOO_LARGE, "save-too-large", "Sauvegarde trop volumineuse");
		}
	}

	private static void requireVersion(CloudSave save, Long expectedVersion) {
		if (!save.getVersion().equals(expectedVersion)) {
			throw new SaveConflictException(save.getVersion(), save.getUpdatedAt());
		}
	}

	private void requirePlausible(SaveMetrics metrics, Instant origin, Instant now) {
		int maxStages = plausibility.maxStages(origin, now);
		int maxRecord = plausibility.maxAbyssRecord(metrics.stagesReached());
		if (metrics.stagesReached() > maxStages || metrics.abyssRecord() > maxRecord) {
			// Pas d'identifiant de joueur dans le log : seules les valeurs utiles pour régler les seuils
			LOG.warn("Sauvegarde refusée : étapes {} (max {}), Puits {} (max {})", metrics.stagesReached(), maxStages,
					metrics.abyssRecord(), maxRecord);
			throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "implausible-progress",
					"Progression impossible dans le temps écoulé");
		}
	}
}
