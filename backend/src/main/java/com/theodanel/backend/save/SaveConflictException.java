package com.theodanel.backend.save;

import java.time.Instant;

import org.springframework.http.HttpStatus;

import com.theodanel.backend.error.ApiException;

/** La partie a changé sur un autre appareil : le front propose de garder l'une ou l'autre. */
public class SaveConflictException extends ApiException {

	private final long currentVersion;
	private final Instant currentUpdatedAt;

	public SaveConflictException(long currentVersion, Instant currentUpdatedAt) {
		super(HttpStatus.CONFLICT, "save-conflict", "La sauvegarde a changé sur un autre appareil");
		this.currentVersion = currentVersion;
		this.currentUpdatedAt = currentUpdatedAt;
	}

	public long getCurrentVersion() {
		return currentVersion;
	}

	public Instant getCurrentUpdatedAt() {
		return currentUpdatedAt;
	}
}
