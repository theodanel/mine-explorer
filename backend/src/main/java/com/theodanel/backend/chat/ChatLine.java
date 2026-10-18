package com.theodanel.backend.chat;

import java.time.Instant;
import java.util.UUID;

/** Message prêt à afficher, avec le pseudo actuel de son auteur. */
public record ChatLine(Long id, UUID playerId, String pseudo, String phrase, Instant sentAt) {
}
