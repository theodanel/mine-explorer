package com.theodanel.backend.chat;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ChatRulesTests {

	private final ChatRules rules = ChatRules.withDefaultWords();

	private String text(String raw) {
		return rules.check(raw).text();
	}

	private String refusal(String raw) {
		ChatRules.Refusal refusal = rules.check(raw).refusal();
		return refusal == null ? null : refusal.code();
	}

	@Test
	void garderLesEmojisEtTenirSurUneLigne() {
		assertThat(text("  coucou \n\n à tous 🎉🐣  ")).isEqualTo("coucou à tous 🎉🐣");
		assertThat(refusal("   \n ")).isEqualTo("chat-empty");
	}

	@Test
	void compterLesEmojisPourUnCaractere() {
		assertThat(refusal("🎉".repeat(ChatRules.MAX_LENGTH))).isNull();
		assertThat(refusal("🎉".repeat(ChatRules.MAX_LENGTH + 1))).isEqualTo("chat-too-long");
	}

	@Test
	void masquerLesGrosMotsMemeDeguises() {
		assertThat(text("Connard")).isEqualTo("*******");
		assertThat(text("c0nnnaaard")).isEqualTo("**********");
		assertThat(text("bande d'ENCULÉS")).isEqualTo("bande d'*******");
		// Les espaces répétés sont d'abord réduits à un seul
		assertThat(text("ta   gueule")).isEqualTo("*********");
	}

	@Test
	void neMasquerQueDesMotsEntiers() {
		assertThat(text("je suis content, contre le gardien")).isEqualTo("je suis content, contre le gardien");
		assertThat(text("quelle classe")).isEqualTo("quelle classe");
	}

	@Test
	void refuserLiensEtCoordonnees() {
		assertThat(refusal("https://site.fr")).isEqualTo("chat-link");
		assertThat(refusal("rejoins discord.gg/abc")).isEqualTo("chat-link");
		assertThat(refusal("écris-moi a.b@gmail.com")).isEqualTo("chat-personal-info");
		assertThat(refusal("appelle le 0612345678")).isEqualTo("chat-personal-info");
		// Des nombres du jeu ne sont pas des numéros de téléphone
		assertThat(refusal("zone 11, 2 500 000 de puissance")).isNull();
	}
}
