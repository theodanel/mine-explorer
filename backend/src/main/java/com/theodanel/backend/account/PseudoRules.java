package com.theodanel.backend.account;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

/** Règles du pseudo public, affiché dans le classement. */
public final class PseudoRules {

	public static final int MIN_LENGTH = 3;
	public static final int MAX_LENGTH = 20;

	/**
	 * Lettres (accents compris), chiffres, espace, tiret et soulignement. Pas de caractères invisibles, d'emoji ni
	 * de balises : le pseudo s'affiche chez les autres joueurs.
	 */
	private static final Pattern ALLOWED = Pattern.compile("[\\p{L}\\p{N}_\\- ]+");
	private static final Pattern SPACES = Pattern.compile(" {2,}");

	private PseudoRules() {
	}

	/**
	 * Pseudo nettoyé (Unicode NFC, espaces en trop retirés) s'il est acceptable, vide sinon. La normalisation NFC
	 * évite deux écritures invisiblement différentes du même « é ».
	 */
	public static Optional<String> normalize(String raw) {
		if (raw == null) {
			return Optional.empty();
		}
		String value = SPACES.matcher(Normalizer.normalize(raw, Normalizer.Form.NFC).strip()).replaceAll(" ");
		int length = value.codePointCount(0, value.length());
		if (length < MIN_LENGTH || length > MAX_LENGTH || !ALLOWED.matcher(value).matches()) {
			return Optional.empty();
		}
		return Optional.of(value);
	}

	/** Clé d'unicité, insensible à la casse. */
	static String key(String pseudo) {
		return pseudo.toLowerCase(Locale.ROOT);
	}
}
