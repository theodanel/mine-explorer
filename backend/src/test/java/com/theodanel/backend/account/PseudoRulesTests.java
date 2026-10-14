package com.theodanel.backend.account;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class PseudoRulesTests {

	@ParameterizedTest
	@ValueSource(strings = { "Théo", "Mineur_42", "La Pioche-dor", "abc" })
	void pseudosAcceptes(String pseudo) {
		assertThat(PseudoRules.normalize(pseudo)).contains(pseudo);
	}

	@ParameterizedTest
	@ValueSource(strings = { "", "ab", "  a ", "<script>", "un pseudo beaucoup trop long", "émoji 🙂", "tab\tici",
			"zéro​largeur" })
	void pseudosRefuses(String pseudo) {
		assertThat(PseudoRules.normalize(pseudo)).isEmpty();
	}

	@Test
	void espacesNettoyes() {
		assertThat(PseudoRules.normalize("  Mineur    fou  ")).contains("Mineur fou");
	}

	@Test
	void accentsNormalises() {
		// « é » en deux caractères (e + accent combinant) devient le « é » unique
		assertThat(PseudoRules.normalize("Théo")).contains("Théo");
	}

	@Test
	void nullRefuse() {
		assertThat(PseudoRules.normalize(null)).isEmpty();
	}

	@Test
	void cleInsensibleALaCasse() {
		assertThat(PseudoRules.key("ThÉo")).isEqualTo(PseudoRules.key("théo"));
	}
}
