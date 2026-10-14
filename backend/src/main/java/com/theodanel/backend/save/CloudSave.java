package com.theodanel.backend.save;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/** Partie d'un joueur dans le cloud : une seule par joueur, identifiée par lui. */
@Entity
@Table(name = "cloud_save")
public class CloudSave {

	/** Longueur de la colonne : la taille utile est bornée plus bas par SaveService. */
	static final int MAX_STORED_LENGTH = 1_048_576;

	@Id
	@Column(name = "player_id")
	private UUID playerId;

	/** Clés « mine-explorer.* » du localStorage, en objet JSON. */
	@Column(nullable = false, length = MAX_STORED_LENGTH)
	private String data;

	@Version
	private Long version;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@Column(name = "stages_reached", nullable = false)
	private int stagesReached;

	@Column(name = "stages_reached_at", nullable = false)
	private Instant stagesReachedAt;

	@Column(name = "abyss_record", nullable = false)
	private int abyssRecord;

	@Column(name = "abyss_record_at", nullable = false)
	private Instant abyssRecordAt;

	@Column(name = "play_origin", nullable = false)
	private Instant playOrigin;

	protected CloudSave() {
		// Requis par JPA
	}

	CloudSave(UUID playerId) {
		this.playerId = playerId;
	}

	/**
	 * Remplace la partie. La date d'une valeur classée ne change que si la valeur change : à égalité dans le
	 * classement, le premier à l'avoir atteinte reste devant.
	 */
	void replace(String newData, SaveMetrics metrics, Instant origin, Instant now) {
		if (stagesReachedAt == null || metrics.stagesReached() != stagesReached) {
			stagesReachedAt = now;
		}
		if (abyssRecordAt == null || metrics.abyssRecord() != abyssRecord) {
			abyssRecordAt = now;
		}
		this.data = newData;
		this.stagesReached = metrics.stagesReached();
		this.abyssRecord = metrics.abyssRecord();
		this.playOrigin = origin;
		this.updatedAt = now;
	}

	public UUID getPlayerId() {
		return playerId;
	}

	public String getData() {
		return data;
	}

	public Long getVersion() {
		return version;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public int getStagesReached() {
		return stagesReached;
	}

	public int getAbyssRecord() {
		return abyssRecord;
	}

	public Instant getPlayOrigin() {
		return playOrigin;
	}
}
