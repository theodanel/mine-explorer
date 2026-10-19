package com.theodanel.backend.leaderboard;

import java.io.IOException;
import java.time.Duration;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.annotation.PreDestroy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.theodanel.backend.error.ApiException;

/**
 * Classements en direct (Server-Sent Events) : chaque page Classement ouverte garde un flux, et reçoit le nom du
 * classement qui vient de changer pour le relire. Le flux ne porte aucune donnée de joueur : il est public, et la
 * page relit le classement par l'API habituelle (avec sa place, si elle est connectée).
 * <p>
 * Les changements sont regroupés et envoyés toutes les {@value #FLUSH_MS} ms : cent sauvegardes dans la même
 * seconde ne déclenchent qu'un rafraîchissement par classement.
 */
@Service
public class LeaderboardEvents {

	private static final Logger LOG = LoggerFactory.getLogger(LeaderboardEvents.class);

	/** Flux ouverts au plus en même temps : chacun garde une connexion sur le Raspberry Pi. */
	static final int MAX_LISTENERS = 500;
	static final long FLUSH_MS = 2_000;
	/**
	 * Un commentaire vide garde la connexion ouverte : Nginx Proxy Manager coupe une réponse muette au bout de 60 s,
	 * Cloudflare au bout de 100 s.
	 */
	static final long HEARTBEAT_MS = 25_000;
	/** Le navigateur rouvre seul le flux à la fin : une durée finie libère les connexions oubliées. */
	private static final Duration STREAM_LIFETIME = Duration.ofMinutes(30);
	/** Délai avant que le navigateur ne se reconnecte après une coupure. */
	private static final long RECONNECT_MS = 3_000;
	static final String CHANGED_EVENT = "changed";

	private final Set<SseEmitter> listeners = ConcurrentHashMap.newKeySet();
	private final Set<LeaderboardType> pending = ConcurrentHashMap.newKeySet();

	public SseEmitter subscribe() {
		if (listeners.size() >= MAX_LISTENERS) {
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "leaderboard-busy",
					"Trop de classements ouverts, réessaie dans un instant");
		}
		SseEmitter emitter = new SseEmitter(STREAM_LIFETIME.toMillis());
		emitter.onCompletion(() -> listeners.remove(emitter));
		emitter.onTimeout(emitter::complete);
		emitter.onError(error -> listeners.remove(emitter));
		listeners.add(emitter);
		// Premier message tout de suite : le proxy transmet les en-têtes et le navigateur sait que le flux est ouvert
		send(emitter, SseEmitter.event().reconnectTime(RECONNECT_MS).comment("ouvert"));
		return emitter;
	}

	/** Après validation de la transaction seulement : une sauvegarde annulée ne fait rien relire. */
	@TransactionalEventListener
	void onChange(LeaderboardChanged change) {
		pending.addAll(change.types());
	}

	@Scheduled(fixedDelay = FLUSH_MS)
	void flush() {
		Set<LeaderboardType> changed = EnumSet.noneOf(LeaderboardType.class);
		for (LeaderboardType type : LeaderboardType.values()) {
			if (pending.remove(type)) {
				changed.add(type);
			}
		}
		for (LeaderboardType type : changed) {
			broadcast(SseEmitter.event().name(CHANGED_EVENT).data(type.name().toLowerCase(Locale.ROOT)));
		}
	}

	@Scheduled(fixedDelay = HEARTBEAT_MS)
	void heartbeat() {
		broadcast(SseEmitter.event().comment(""));
	}

	int listenerCount() {
		return listeners.size();
	}

	/** À l'arrêt du serveur : les flux se ferment, sinon l'arrêt attendrait leur fin. */
	@PreDestroy
	void closeAll() {
		listeners.forEach(SseEmitter::complete);
		listeners.clear();
	}

	private void broadcast(SseEmitter.SseEventBuilder event) {
		for (SseEmitter emitter : listeners) {
			send(emitter, event);
		}
	}

	private void send(SseEmitter emitter, SseEmitter.SseEventBuilder event) {
		try {
			emitter.send(event);
		}
		catch (IOException | IllegalStateException closed) {
			// Page fermée ou réseau coupé : le flux est retiré, le navigateur en rouvrira un s'il est encore là
			LOG.debug("Flux de classement fermé : {}", closed.getClass().getSimpleName());
			listeners.remove(emitter);
		}
	}
}
