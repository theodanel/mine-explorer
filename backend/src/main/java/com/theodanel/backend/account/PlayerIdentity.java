package com.theodanel.backend.account;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Compte externe (Google, plus tard Apple) qui permet de se connecter en tant que ce joueur. */
@Entity
@Table(name = "player_identity")
public class PlayerIdentity {

	@Id
	private UUID id;

	@Column(name = "player_id", nullable = false)
	private UUID playerId;

	@Column(nullable = false, length = 20)
	private String provider;

	@Column(nullable = false)
	private String subject;

	@Column(name = "linked_at", nullable = false)
	private Instant linkedAt;

	protected PlayerIdentity() {
		// Requis par JPA
	}

	public PlayerIdentity(UUID id, UUID playerId, String provider, String subject, Instant linkedAt) {
		this.id = id;
		this.playerId = playerId;
		this.provider = provider;
		this.subject = subject;
		this.linkedAt = linkedAt;
	}

	public UUID getPlayerId() {
		return playerId;
	}

	public String getProvider() {
		return provider;
	}

	public String getSubject() {
		return subject;
	}

	public Instant getLinkedAt() {
		return linkedAt;
	}
}
