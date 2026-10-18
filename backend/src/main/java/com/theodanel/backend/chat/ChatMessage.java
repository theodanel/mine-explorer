package com.theodanel.backend.chat;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Un message de la discussion : qui, quoi (déjà filtré par {@link ChatRules}), quand, et s'il est caché. */
@Entity
@Table(name = "chat_message")
public class ChatMessage {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "player_id", nullable = false)
	private UUID playerId;

	@Column(nullable = false, length = 800)
	private String text;

	@Column(name = "sent_at", nullable = false)
	private Instant sentAt;

	@Column(nullable = false)
	private boolean hidden;

	protected ChatMessage() {
		// Requis par JPA
	}

	public ChatMessage(UUID playerId, String text, Instant sentAt) {
		this.playerId = playerId;
		this.text = text;
		this.sentAt = sentAt;
	}

	public Long getId() {
		return id;
	}

	public UUID getPlayerId() {
		return playerId;
	}

	public String getText() {
		return text;
	}

	public Instant getSentAt() {
		return sentAt;
	}

	public boolean isHidden() {
		return hidden;
	}

	public void hide() {
		hidden = true;
	}
}
