package com.theodanel.backend.chat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theodanel.backend.config.MineProperties;
import com.theodanel.backend.error.ApiException;

/**
 * Discussion entre joueurs, en texte libre. Protections, sans en faire trop : message filtré par {@link ChatRules}
 * (longueur, liens, coordonnées, gros mots), un message toutes les {@link #COOLDOWN}, signalement par les joueurs
 * (caché à {@link #REPORTS_TO_HIDE} signalements), et pour les modérateurs : supprimer un message, couper un joueur.
 */
@Service
public class ChatService {

	/** Messages renvoyés à chaque lecture : de quoi remplir la fenêtre, pas plus. */
	static final int VISIBLE_MESSAGES = 50;
	/** Délai entre deux messages d'un même joueur : empêche d'inonder la discussion. */
	static final Duration COOLDOWN = Duration.ofSeconds(5);
	/** Durée de conservation, annoncée dans les règles de confidentialité. */
	static final Duration RETENTION = Duration.ofDays(7);
	/** Joueurs différents qui doivent signaler un message pour le cacher sans attendre un modérateur. */
	static final int REPORTS_TO_HIDE = 3;

	private final ChatMessageRepository messages;
	private final ChatReportRepository reports;
	private final ChatMuteRepository mutes;
	private final ChatRules rules = ChatRules.withDefaultWords();
	private final Set<UUID> moderators;
	private final Clock clock;

	public ChatService(ChatMessageRepository messages, ChatReportRepository reports, ChatMuteRepository mutes,
			MineProperties properties, Clock clock) {
		this.messages = messages;
		this.reports = reports;
		this.mutes = mutes;
		this.moderators = Set.copyOf(properties.chat().moderators());
		this.clock = clock;
	}

	/** Message vu par un joueur ({@code mine} : c'est le sien), du plus ancien au plus récent. */
	public record Message(long id, String pseudo, String title, String text, Instant sentAt, boolean mine) {
	}

	/** Ce que voit un joueur : les messages, et ce qu'il a le droit de faire. */
	public record View(List<Message> messages, boolean canWrite, boolean moderator) {
	}

	@Transactional(readOnly = true)
	public View view(UUID viewer) {
		List<Message> latest = messages.latestVisible(Limit.of(VISIBLE_MESSAGES))
			.reversed()
			.stream()
			.map(line -> new Message(line.id(), line.pseudo(), line.title(), line.text(), line.sentAt(), line.playerId().equals(viewer)))
			.toList();
		boolean canWrite = viewer != null && !mutes.existsById(viewer);
		return new View(latest, canWrite, isModerator(viewer));
	}

	@Transactional
	public void send(UUID playerId, String rawText) {
		if (mutes.existsById(playerId)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "chat-muted", "Tu ne peux plus écrire dans la discussion");
		}
		ChatRules.Checked checked = rules.check(rawText);
		if (checked.refusal() != null) {
			throw new ApiException(HttpStatus.BAD_REQUEST, checked.refusal().code(), checked.refusal().message());
		}
		Instant now = clock.instant();
		if (messages.existsByPlayerIdAndSentAtAfter(playerId, now.minus(COOLDOWN))) {
			throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "chat-too-fast",
					"Un message toutes les " + COOLDOWN.toSeconds() + " secondes");
		}
		messages.deleteSentBefore(now.minus(RETENTION));
		messages.save(new ChatMessage(playerId, checked.text(), now));
	}

	/** Signalement par un joueur : le message est caché dès {@link #REPORTS_TO_HIDE} joueurs différents. */
	@Transactional
	public void report(UUID reporter, long messageId) {
		ChatMessage message = find(messageId);
		if (message.getPlayerId().equals(reporter)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "chat-report-own", "On ne signale pas son propre message");
		}
		ChatReport.Key key = new ChatReport.Key(messageId, reporter);
		if (!reports.existsById(key)) {
			reports.save(new ChatReport(messageId, reporter, clock.instant()));
		}
		if (reports.countByKeyMessageId(messageId) >= REPORTS_TO_HIDE) {
			message.hide();
		}
	}

	/** Modérateur : retire un message de la discussion. */
	@Transactional
	public void remove(UUID moderator, long messageId) {
		requireModerator(moderator);
		find(messageId).hide();
	}

	/** Modérateur : coupe l'auteur d'un message (il n'écrit plus) et retire tous ses messages. */
	@Transactional
	public void muteAuthor(UUID moderator, long messageId) {
		requireModerator(moderator);
		UUID author = find(messageId).getPlayerId();
		if (!mutes.existsById(author)) {
			mutes.save(new ChatMute(author, clock.instant()));
		}
		messages.hideAllFrom(author);
	}

	/** Messages du joueur, pour l'export de ses données. */
	@Transactional(readOnly = true)
	public List<ChatMessage> sentBy(UUID playerId) {
		return messages.findByPlayerIdOrderByIdAsc(playerId);
	}

	private boolean isModerator(UUID playerId) {
		return playerId != null && moderators.contains(playerId);
	}

	private void requireModerator(UUID playerId) {
		if (!isModerator(playerId)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "chat-not-moderator", "Réservé aux modérateurs");
		}
	}

	private ChatMessage find(long messageId) {
		return messages.findById(messageId)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "chat-message-unknown", "Message introuvable"));
	}
}
