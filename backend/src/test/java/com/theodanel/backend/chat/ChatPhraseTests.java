package com.theodanel.backend.chat;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;

import org.junit.jupiter.api.Test;

class ChatPhraseTests {

	@Test
	void memesClesQueLeJeu() {
		// Même liste que frontend/src/app/online/chat/chat-phrases.ts (vérifiée aussi par chat-phrases.spec.ts)
		assertThat(Arrays.stream(ChatPhrase.values()).map(ChatPhrase::key)).containsExactly("hello", "gg", "thanks",
				"good-luck", "zone-cleared", "evolved", "legendary", "abyss", "abyss-record", "stuck", "tip-pickaxe",
				"companion", "laugh", "wow", "see-you");
	}

	@Test
	void uneCleInconnueNEstPasUnePhrase() {
		assertThat(ChatPhrase.fromKey("gg")).contains(ChatPhrase.GG);
		assertThat(ChatPhrase.fromKey("Rejoins mon serveur")).isEmpty();
	}
}
