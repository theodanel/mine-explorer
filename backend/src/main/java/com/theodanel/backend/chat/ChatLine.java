package com.theodanel.backend.chat;

import java.time.Instant;
import java.util.UUID;

/** Message prêt à afficher, avec le pseudo et le titre actuels de son auteur. */
public record ChatLine(Long id, UUID playerId, String pseudo, String title, String text, Instant sentAt) {
}
