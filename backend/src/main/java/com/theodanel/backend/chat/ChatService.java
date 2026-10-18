package com.theodanel.backend.chat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theodanel.backend.error.ApiException;

/**
 * Discussion entre joueurs, faite de phrases prédéfinies. Un joueur connecté envoie au plus un message toutes les
 * {@link #COOLDOWN} ; les messages de plus de {@link #RETENTION} sont effacés à chaque envoi.
 */
@Service
public class ChatService {

	/** Messages renvoyés à chaque lecture : de quoi remplir la fenêtre, pas plus. */
	static final int VISIBLE_MESSAGES = 40;
	/** Délai entre deux messages d'un même joueur : empêche d'inonder la discussion. */
	static final Duration COOLDOWN = Duration.ofSeconds(5);
	/** Durée de conservation, annoncée dans les règles de confidentialité. */
	static final Duration RETENTION = Duration.ofDays(7);

	private final ChatMessageRepository messages;
	private final Clock clock;

	public ChatService(ChatMessageRepository messages, Clock clock) {
		this.messages = messages;
		this.clock = clock;
	}

	/** Message vu par un joueur ({@code mine} : c'est le sien), du plus ancien au plus récent. */
	public record Message(long id, String pseudo, String phrase, Instant sentAt, boolean mine) {
	}

	@Transactional(readOnly = true)
	public List<Message> latest(UUID viewer) {
		List<ChatLine> lines = messages.latest(Limit.of(VISIBLE_MESSAGES));
		return lines.reversed()
			.stream()
			.map(line -> new Message(line.id(), line.pseudo(), line.phrase(), line.sentAt(),
					line.playerId().equals(viewer)))
			.toList();
	}

	@Transactional
	public void send(UUID playerId, String phraseKey) {
		ChatPhrase phrase = ChatPhrase.fromKey(phraseKey)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "chat-phrase-unknown", "Phrase inconnue"));
		Instant now = clock.instant();
		if (messages.existsByPlayerIdAndSentAtAfter(playerId, now.minus(COOLDOWN))) {
			throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "chat-too-fast", "Un message toutes les "
					+ COOLDOWN.toSeconds() + " secondes");
		}
		messages.deleteSentBefore(now.minus(RETENTION));
		messages.save(new ChatMessage(playerId, phrase, now));
	}

	/** Messages du joueur, pour l'export de ses données. */
	@Transactional(readOnly = true)
	public List<ChatMessage> sentBy(UUID playerId) {
		return messages.findByPlayerIdOrderByIdAsc(playerId);
	}
}
