package com.theodanel.backend.chat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

	/** Derniers messages avec le pseudo actuel de leur auteur, du plus récent au plus ancien. */
	@Query("select new com.theodanel.backend.chat.ChatLine(m.id, m.playerId, p.pseudo, m.phrase, m.sentAt)"
			+ " from ChatMessage m join Player p on p.id = m.playerId order by m.id desc")
	List<ChatLine> latest(Limit limit);

	boolean existsByPlayerIdAndSentAtAfter(UUID playerId, Instant since);

	List<ChatMessage> findByPlayerIdOrderByIdAsc(UUID playerId);

	@Modifying
	@Query("delete from ChatMessage m where m.sentAt < :before")
	int deleteSentBefore(@Param("before") Instant before);
}
