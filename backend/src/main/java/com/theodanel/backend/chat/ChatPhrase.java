package com.theodanel.backend.chat;

import java.util.Arrays;
import java.util.Optional;

/**
 * Phrases que les joueurs peuvent s'envoyer. Aucun texte libre : ni insulte, ni information personnelle, rien à
 * modérer. Le serveur ne connaît que les clés ; le texte affiché vit dans le jeu
 * (frontend/src/app/online/chat/chat-phrases.ts), qui doit garder les mêmes clés.
 */
public enum ChatPhrase {
	HELLO("hello"),
	GG("gg"),
	THANKS("thanks"),
	GOOD_LUCK("good-luck"),
	ZONE_CLEARED("zone-cleared"),
	EVOLVED("evolved"),
	LEGENDARY("legendary"),
	ABYSS("abyss"),
	ABYSS_RECORD("abyss-record"),
	STUCK("stuck"),
	TIP_PICKAXE("tip-pickaxe"),
	COMPANION("companion"),
	LAUGH("laugh"),
	WOW("wow"),
	SEE_YOU("see-you");

	private final String key;

	ChatPhrase(String key) {
		this.key = key;
	}

	public String key() {
		return key;
	}

	public static Optional<ChatPhrase> fromKey(String key) {
		return Arrays.stream(values()).filter(phrase -> phrase.key.equals(key)).findFirst();
	}
}
