package com.theodanel.backend.chat;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Signalement d'un message par un joueur, une seule fois par joueur et par message. */
@Entity
@Table(name = "chat_report")
public class ChatReport {

	@Embeddable
	public record Key(@Column(name = "message_id") Long messageId, @Column(name = "reporter_id") UUID reporterId)
			implements Serializable {
	}

	@EmbeddedId
	private Key key;

	@Column(name = "reported_at", nullable = false)
	private Instant reportedAt;

	protected ChatReport() {
		// Requis par JPA
	}

	public ChatReport(Long messageId, UUID reporterId, Instant reportedAt) {
		this.key = new Key(messageId, reporterId);
		this.reportedAt = reportedAt;
	}
}
