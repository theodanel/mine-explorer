package com.theodanel.backend.support;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** Horloge que les tests avancent à la main, pour vérifier l'anti-triche sans attendre. */
public class MutableClock extends Clock {

	public static final Instant START = Instant.parse("2026-10-14T12:00:00Z");

	private Instant now = START;

	public void set(Instant instant) {
		now = instant;
	}

	public void advance(Duration duration) {
		now = now.plus(duration);
	}

	@Override
	public ZoneId getZone() {
		return ZoneOffset.UTC;
	}

	@Override
	public Clock withZone(ZoneId zone) {
		return this;
	}

	@Override
	public Instant instant() {
		return now;
	}
}
