package com.theodanel.backend.leaderboard;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;

import jakarta.persistence.EntityManager;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Classements entre joueurs, lus dans les sauvegardes cloud. Seules des sauvegardes acceptées par l'anti-triche y
 * figurent. À égalité, le premier à avoir atteint la valeur passe devant.
 */
@Service
public class LeaderboardService {

	/** Lignes affichées : assez pour se situer, peu pour une requête légère et publique. */
	static final int TOP_SIZE = 100;

	/** {@code title} : identifiant du titre porté, ou null. */
	public record Entry(int rank, String pseudo, int value, String title) {
	}

	private final EntityManager entityManager;

	public LeaderboardService(EntityManager entityManager) {
		this.entityManager = entityManager;
	}

	@Transactional(readOnly = true)
	public List<Entry> top(LeaderboardType type) {
		Columns columns = Columns.of(type);
		List<Object[]> rows = entityManager
			.createQuery("select p.pseudo, s." + columns.value() + ", p.title from CloudSave s join Player p on p.id = s.playerId"
					+ " order by s." + columns.value() + " desc, s." + columns.reachedAt() + " asc, s.playerId asc",
					Object[].class)
			.setMaxResults(TOP_SIZE)
			.getResultList();
		return IntStream.range(0, rows.size())
			.mapToObj(index -> new Entry(index + 1, (String) rows.get(index)[0], (Integer) rows.get(index)[1],
					(String) rows.get(index)[2]))
			.toList();
	}

	/** Place du joueur, même hors du haut du classement ; vide s'il n'a pas de sauvegarde. */
	@Transactional(readOnly = true)
	public Optional<Entry> rankOf(LeaderboardType type, UUID playerId) {
		Columns columns = Columns.of(type);
		List<Object[]> mine = entityManager
			.createQuery("select p.pseudo, s." + columns.value() + ", s." + columns.reachedAt() + ", p.title"
					+ " from CloudSave s join Player p on p.id = s.playerId where s.playerId = :playerId", Object[].class)
			.setParameter("playerId", playerId)
			.getResultList();
		if (mine.isEmpty()) {
			return Optional.empty();
		}
		Object[] row = mine.getFirst();
		// Mêmes critères que top(), identifiant compris : sinon deux joueurs à égalité parfaite (même valeur, même
		// instant) auraient chacun un rang différent de leur ligne dans le haut du classement
		long ahead = entityManager
			.createQuery("select count(s) from CloudSave s where s." + columns.value() + " > :value or (s."
					+ columns.value() + " = :value and (s." + columns.reachedAt() + " < :reachedAt or (s."
					+ columns.reachedAt() + " = :reachedAt and s.playerId < :playerId)))", Long.class)
			.setParameter("value", row[1])
			.setParameter("reachedAt", row[2])
			.setParameter("playerId", playerId)
			.getSingleResult();
		return Optional.of(new Entry(Math.toIntExact(ahead + 1), (String) row[0], (Integer) row[1], (String) row[3]));
	}

	/**
	 * Colonnes de chaque classement. Les noms viennent de cette énumération, jamais de la requête HTTP : la
	 * concaténation dans le JPQL ne peut pas être détournée (les valeurs, elles, passent en paramètres).
	 */
	private record Columns(String value, String reachedAt) {

		static Columns of(LeaderboardType type) {
			return switch (type) {
				case DEPTH -> new Columns("stagesReached", "stagesReachedAt");
				case ABYSS -> new Columns("abyssRecord", "abyssRecordAt");
			};
		}
	}
}
