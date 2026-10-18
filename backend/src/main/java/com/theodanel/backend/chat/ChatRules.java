package com.theodanel.backend.chat;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Règles d'un message de la discussion, pures et testées seules : longueur, caractères, liens, coordonnées et gros
 * mots. Un message refusé reçoit un code d'erreur que le jeu explique au joueur ; un gros mot est masqué par des
 * étoiles plutôt que de refuser tout le message.
 */
public final class ChatRules {

	/** Assez pour une phrase, pas pour un pavé : compté en caractères visibles (un emoji compte pour un). */
	public static final int MAX_LENGTH = 200;

	/** Liens : un lien attire vers un site inconnu (arnaque, hameçonnage), jamais utile dans le jeu. */
	private static final Pattern LINK = Pattern.compile(
			"(?i)(https?://|www\\.|\\b[a-z0-9-]+\\.(com|fr|net|org|io|gg|be|ch|ca|xyz|me|tv|ly|link|app)\\b|discord\\.gg)");
	/** Coordonnées : adresse e-mail ou numéro de téléphone, à ne pas partager avec des inconnus (souvent mineurs). */
	private static final Pattern EMAIL = Pattern.compile("[^\\s@]+@[^\\s@]+\\.[^\\s@]+");
	private static final Pattern PHONE = Pattern.compile("(\\+?\\d[\\s.-]?){9,}");
	/** Caractères de contrôle et de mise en forme invisibles (sauts de ligne compris) : un message tient sur une ligne. */
	private static final Pattern CONTROL = Pattern.compile("[\\p{Cc}\\p{Zl}\\p{Zp}\\u200B\\u2060\\uFEFF\\u202A-\\u202E\\u2066-\\u2069]");
	private static final Pattern SPACES = Pattern.compile("\\s+");

	private final List<Pattern> forbiddenWords;

	private ChatRules(List<Pattern> forbiddenWords) {
		this.forbiddenWords = forbiddenWords;
	}

	/** Règles avec la liste de mots interdits du jeu ({@code chat/mots-interdits.txt}). */
	public static ChatRules withDefaultWords() {
		try (InputStream input = ChatRules.class.getResourceAsStream("/chat/mots-interdits.txt")) {
			if (input == null) {
				throw new IllegalStateException("Liste chat/mots-interdits.txt introuvable");
			}
			return withWords(new String(input.readAllBytes(), StandardCharsets.UTF_8).lines()
				.map(String::strip)
				.filter(line -> !line.isEmpty() && !line.startsWith("#"))
				.toList());
		}
		catch (IOException error) {
			throw new UncheckedIOException(error);
		}
	}

	static ChatRules withWords(List<String> words) {
		return new ChatRules(words.stream().map(ChatRules::wordPattern).toList());
	}

	/** Refus d'un message, avec le code renvoyé au jeu. */
	public record Refusal(String code, String message) {
	}

	/** Message prêt à enregistrer, ou le motif du refus. */
	public record Checked(String text, Refusal refusal) {

		static Checked accepted(String text) {
			return new Checked(text, null);
		}

		static Checked refused(String code, String message) {
			return new Checked(null, new Refusal(code, message));
		}
	}

	public Checked check(String raw) {
		String text = SPACES.matcher(CONTROL.matcher(raw == null ? "" : raw).replaceAll(" ")).replaceAll(" ").strip();
		if (text.isEmpty()) {
			return Checked.refused("chat-empty", "Message vide");
		}
		if (text.codePointCount(0, text.length()) > MAX_LENGTH) {
			return Checked.refused("chat-too-long", "Message trop long");
		}
		// Coordonnées d'abord : une adresse e-mail contient aussi un nom de domaine
		if (EMAIL.matcher(text).find() || PHONE.matcher(text).find()) {
			return Checked.refused("chat-personal-info", "Pas d'adresse e-mail ni de numéro de téléphone");
		}
		if (LINK.matcher(text).find()) {
			return Checked.refused("chat-link", "Les liens ne sont pas autorisés");
		}
		return Checked.accepted(maskForbiddenWords(text));
	}

	private String maskForbiddenWords(String text) {
		String result = text;
		for (Pattern word : forbiddenWords) {
			Matcher matcher = word.matcher(result);
			StringBuilder masked = new StringBuilder();
			while (matcher.find()) {
				matcher.appendReplacement(masked, "*".repeat(matcher.group().codePointCount(0, matcher.group().length())));
			}
			matcher.appendTail(masked);
			result = masked.toString();
		}
		return result;
	}

	/**
	 * Un mot interdit, reconnu sans tenir compte des majuscules, des accents ni des lettres répétées ou remplacées par
	 * des chiffres courants (« c0nnnard »), et seulement en mot entier (« classe » ne contient pas d'insulte).
	 */
	private static Pattern wordPattern(String word) {
		StringBuilder pattern = new StringBuilder("(?<![\\p{L}\\p{N}])");
		for (char letter : stripAccents(word.toLowerCase(Locale.ROOT)).toCharArray()) {
			pattern.append(variants(letter)).append('+');
		}
		// Pluriel compris (« connards »)
		pattern.append("[sx]?(?![\\p{L}\\p{N}])");
		return Pattern.compile(pattern.toString(), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
	}

	private static String variants(char letter) {
		return switch (letter) {
			case 'a' -> "[aàâä@4]";
			case 'e' -> "[eéèêë3€]";
			case 'i' -> "[iîï1!|]";
			case 'o' -> "[oôö0]";
			case 'u' -> "[uùûü]";
			case 'c' -> "[cç]";
			case 's' -> "[s$5]";
			case 't' -> "[t7]";
			case ' ' -> "\\s";
			default -> Pattern.quote(String.valueOf(letter));
		};
	}

	private static String stripAccents(String text) {
		return Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
	}
}
