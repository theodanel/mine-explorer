package com.theodanel.backend.save;

import java.time.Clock;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theodanel.backend.account.AccountService;
import com.theodanel.backend.account.TitleCatalog;
import com.theodanel.backend.config.MineProperties;
import com.theodanel.backend.error.ApiException;
import com.theodanel.backend.leaderboard.LeaderboardChanged;
import com.theodanel.backend.leaderboard.LeaderboardType;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** Lecture et écriture de la partie dans le cloud, avec verrou optimiste et contrôle de plausibilité. */
@Service
public class SaveService {

	private static final Logger LOG = LoggerFactory.getLogger(SaveService.class);
	private static final TypeReference<TreeMap<String, String>> DATA_TYPE = new TypeReference<>() {
	};
	private static final TypeReference<List<String>> UNLOCKED_TYPE = new TypeReference<>() {
	};

	/** Taille utile maximale d'une partie (somme des clés et valeurs) : une vraie partie pèse quelques dizaines de Ko. */
	static final int MAX_DATA_CHARS = 256 * 1024;

	private final CloudSaveRepository saves;
	private final AccountService accounts;
	private final PlausibilityRules plausibility;
	private final JsonMapper json;
	private final Clock clock;
	private final ApplicationEventPublisher events;

	public SaveService(CloudSaveRepository saves, AccountService accounts, MineProperties properties, JsonMapper json,
			Clock clock, ApplicationEventPublisher events) {
		this.saves = saves;
		this.accounts = accounts;
		this.plausibility = new PlausibilityRules(properties.antiCheat());
		this.json = json;
		this.clock = clock;
		this.events = events;
	}

	public record StoredSave(long version, Instant updatedAt, Map<String, String> data) {
	}

	/** Succès gagnés d'après la sauvegarde cloud (vide sans sauvegarde ou si la liste est illisible). */
	@Transactional(readOnly = true)
	public Set<String> unlockedAchievements(UUID playerId) {
		return find(playerId).map(save -> save.data().get(TitleCatalog.UNLOCKED_SAVE_KEY)).map(raw -> {
			try {
				return Set.copyOf(json.readValue(raw, UNLOCKED_TYPE));
			}
			catch (JacksonException unreadable) {
				LOG.warn("Liste des succès illisible dans une sauvegarde");
				return Set.<String>of();
			}
		}).orElse(Set.of());
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
		// Compte supprimé depuis un autre appareil : 401 « reconnecte-toi » plutôt qu'une erreur de clé étrangère
		Instant accountCreatedAt = accounts.get(playerId).getCreatedAt();

		SaveMetrics metrics = SaveMetrics.read(data, json);
		Instant origin = existing.map(CloudSave::getPlayOrigin).orElseGet(plausibility::firstOrigin);
		// Première liaison : la partie locale n'est jugée que depuis la mise en ligne du jeu, donc acceptée si elle a pu
		// être jouée ; c'est le classement qui la plafonne depuis la connexion
		requirePlausible(metrics, origin, now);

		CloudSave save = existing.orElseGet(() -> new CloudSave(playerId));
		boolean firstSave = existing.isEmpty();
		int previousStages = save.getStagesReached();
		int previousAbyss = save.getAbyssRecord();
		TreeMap<String, String> sorted = new TreeMap<>(data);
		// L'anti-triche suit la vraie progression ; le classement, celle qui a pu se faire depuis la première connexion
		save.replace(json.writeValueAsString(sorted), plausibility.ranked(metrics, accountCreatedAt, now),
				plausibility.nextOrigin(origin, metrics.stagesReached(), now), now);
		CloudSave saved = saveFirstWins(save);
		publishRankingChanges(saved, firstSave, previousStages, previousAbyss);
		return new StoredSave(saved.getVersion(), saved.getUpdatedAt(), sorted);
	}

	/** Un nouveau joueur, ou une valeur classée qui bouge : les pages Classement ouvertes se rafraîchissent. */
	private void publishRankingChanges(CloudSave saved, boolean firstSave, int previousStages, int previousAbyss) {
		Set<LeaderboardType> changed = EnumSet.noneOf(LeaderboardType.class);
		if (firstSave || saved.getStagesReached() != previousStages) {
			changed.add(LeaderboardType.DEPTH);
		}
		if (firstSave || saved.getAbyssRecord() != previousAbyss) {
			changed.add(LeaderboardType.ABYSS);
		}
		if (!changed.isEmpty()) {
			events.publishEvent(new LeaderboardChanged(changed));
		}
	}

	/**
	 * Deux appareils qui envoient chacun la toute première sauvegarde au même instant : le second bute sur la clé
	 * primaire. Même réponse qu'un conflit de version, pour que le front relise la partie du cloud.
	 */
	private CloudSave saveFirstWins(CloudSave save) {
		try {
			return saves.saveAndFlush(save);
		}
		catch (DataIntegrityViolationException concurrentFirstSave) {
			throw new ApiException(HttpStatus.CONFLICT, "save-conflict", "La sauvegarde a changé sur un autre appareil");
		}
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

	/**
	 * Seule la mine est contrôlée à l'envoi : un saut de progression impossible depuis la sauvegarde précédente est
	 * refusé. Le record du Puits n'est borné qu'au classement ({@link PlausibilityRules#ranked}).
	 */
	private void requirePlausible(SaveMetrics metrics, Instant origin, Instant now) {
		int maxStages = plausibility.maxAcceptedStages(origin, now);
		if (metrics.stagesReached() > maxStages) {
			// Pas d'identifiant de joueur dans le log : seules les valeurs utiles pour régler les seuils
			LOG.warn("Sauvegarde refusée : étapes {} (max {})", metrics.stagesReached(), maxStages);
			throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "implausible-progress",
					"Progression impossible dans le temps écoulé");
		}
	}
}
