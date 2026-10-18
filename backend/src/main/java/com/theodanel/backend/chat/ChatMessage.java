package com.theodanel.backend.chat;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Un message de la discussion : qui, quelle phrase prédéfinie, quand. */
@Entity
@Table(name = "chat_message")
public class ChatMessage {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "player_id", nullable = false)
	private UUID playerId;

	@Column(nullable = false, length = 32)
	private String phrase;

	@Column(name = "sent_at", nullable = false)
	private Instant sentAt;

	protected ChatMessage() {
		// Requis par JPA
	}

	public ChatMessage(UUID playerId, ChatPhrase phrase, Instant sentAt) {
		this.playerId = playerId;
		this.phrase = phrase.key();
		this.sentAt = sentAt;
	}

	public Long getId() {
		return id;
	}

	public UUID getPlayerId() {
		return playerId;
	}

	public String getPhrase() {
		return phrase;
	}

	public Instant getSentAt() {
		return sentAt;
	}
}
