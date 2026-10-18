package com.theodanel.backend.chat;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Joueur coupé de la discussion par un modérateur : il lit toujours, mais n'écrit plus. */
@Entity
@Table(name = "chat_mute")
public class ChatMute {

	@Id
	@Column(name = "player_id")
	private UUID playerId;

	@Column(name = "muted_at", nullable = false)
	private Instant mutedAt;

	protected ChatMute() {
		// Requis par JPA
	}

	public ChatMute(UUID playerId, Instant mutedAt) {
		this.playerId = playerId;
		this.mutedAt = mutedAt;
	}
}
