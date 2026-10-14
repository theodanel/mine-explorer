package com.theodanel.backend.security;

import java.time.Clock;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limite de requêtes par clé (catégorie + adresse IP), en fenêtres fixes. En mémoire : suffisant pour une seule
 * machine ; avec plusieurs machines, chaque machine compterait de son côté (limite multipliée d'autant).
 */
final class RateLimiter {

	/** Au-delà, les fenêtres expirées sont purgées ; si toutes sont actives, on repart de zéro plutôt que saturer la mémoire. */
	static final int MAX_TRACKED_KEYS = 50_000;

	private record Window(long startMillis, int count) {
	}

	private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
	private final Duration window;
	private final Clock clock;

	RateLimiter(Duration window, Clock clock) {
		this.window = window;
		this.clock = clock;
	}

	/**
	 * Compte une requête. Renvoie 0 si elle passe, sinon le nombre de secondes avant la prochaine fenêtre
	 * (pour l'en-tête {@code Retry-After}).
	 */
	long acquire(String key, int limit) {
		long now = clock.millis();
		if (windows.size() >= MAX_TRACKED_KEYS) {
			evictExpired(now);
		}
		Window current = windows.compute(key, (k, existing) -> existing == null || isExpired(existing, now)
				? new Window(now, 1)
				: new Window(existing.startMillis(), existing.count() + 1));
		if (current.count() <= limit) {
			return 0;
		}
		long remainingMillis = current.startMillis() + window.toMillis() - now;
		return Math.max(1, Duration.ofMillis(remainingMillis).toSeconds() + 1);
	}

	int trackedKeys() {
		return windows.size();
	}

	private boolean isExpired(Window existing, long now) {
		return now - existing.startMillis() >= window.toMillis();
	}

	private void evictExpired(long now) {
		windows.values().removeIf(existing -> isExpired(existing, now));
		if (windows.size() >= MAX_TRACKED_KEYS) {
			windows.clear();
		}
	}
}
