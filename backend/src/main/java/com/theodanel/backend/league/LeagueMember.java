package com.theodanel.backend.league;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Place d'un joueur dans la ligue de la semaine. */
@Entity
@Table(name = "league_member")
public class LeagueMember {

	@Id
	@Column(name = "player_id")
	private UUID playerId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private League league;

	@Column(name = "week_start", nullable = false)
	private LocalDate weekStart;

	@Column(name = "base_stages", nullable = false)
	private int baseStages;

	@Column(name = "pending_shards", nullable = false)
	private int pendingShards;

	@Enumerated(EnumType.STRING)
	@Column(name = "pending_from", length = 10)
	private League pendingFrom;

	@Enumerated(EnumType.STRING)
	@Column(name = "pending_to", length = 10)
	private League pendingTo;

	protected LeagueMember() {
		// Requis par JPA
	}

	LeagueMember(UUID playerId, LocalDate weekStart, int baseStages) {
		this.playerId = playerId;
		this.league = League.BRONZE;
		this.weekStart = weekStart;
		this.baseStages = baseStages;
	}

	public UUID getPlayerId() {
		return playerId;
	}

	public League getLeague() {
		return league;
	}

	public LocalDate getWeekStart() {
		return weekStart;
	}

	public int getBaseStages() {
		return baseStages;
	}

	public int getPendingShards() {
		return pendingShards;
	}

	public League getPendingFrom() {
		return pendingFrom;
	}

	public League getPendingTo() {
		return pendingTo;
	}

	/** Fin de semaine : la récompense attend le jeu, la ligue change, le score repart de zéro. */
	void closeWeek(League next, int shards, LocalDate newWeek, int currentStages) {
		this.pendingShards += shards;
		this.pendingFrom = league;
		this.pendingTo = next;
		this.league = next;
		this.weekStart = newWeek;
		this.baseStages = currentStages;
	}

	int claim() {
		int shards = pendingShards;
		pendingShards = 0;
		pendingFrom = null;
		pendingTo = null;
		return shards;
	}
}
