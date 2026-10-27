package com.theodanel.backend.account;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Un joueur : un pseudo public et rien d'autre de personnel. */
@Entity
@Table(name = "player")
public class Player {

	@Id
	private UUID id;

	@Column(nullable = false, length = PseudoRules.MAX_LENGTH)
	private String pseudo;

	@Column(name = "pseudo_key", nullable = false, length = PseudoRules.MAX_LENGTH)
	private String pseudoKey;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	/** Titre porté : un identifiant de {@link TitleCatalog}, ou null. */
	@Column(length = 40)
	private String title;

	protected Player() {
		// Requis par JPA
	}

	public Player(UUID id, String pseudo, Instant createdAt) {
		this.id = id;
		this.createdAt = createdAt;
		rename(pseudo);
	}

	public UUID getId() {
		return id;
	}

	public String getPseudo() {
		return pseudo;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public String getTitle() {
		return title;
	}

	/** Le titre doit déjà être vérifié par {@link AccountService#wearTitle}. */
	void wearTitle(String newTitle) {
		this.title = newTitle;
	}

	/** Le pseudo doit déjà être validé par {@link PseudoRules#normalize}. */
	final void rename(String newPseudo) {
		this.pseudo = newPseudo;
		this.pseudoKey = PseudoRules.key(newPseudo);
	}
}
