package com.theodanel.backend.account;

import java.util.Set;

/**
 * Titres que le serveur accepte : les identifiants des succès du jeu (frontend/src/app/balance/achievements.ts). Le
 * joueur choisit un identifiant, jamais un texte : le libellé affiché vient du jeu, rien d'écrit par un joueur ne passe
 * par ici.
 */
public final class TitleCatalog {

	/** Les mêmes identifiants que la liste du jeu, à tenir à jour ensemble. */
	public static final Set<String> IDS = Set.of("premiers-pas", "cinq-zones", "dix-zones", "quinze-zones",
			"vingt-zones", "gardien-5", "gardien-10", "gardien-19", "forge-100", "forge-1000", "forge-10000",
			"forge-50000", "jackpot-1", "jackpot-5", "puits-25", "puits-50", "puits-100", "puits-200", "panoplie-3",
			"panoplie-5", "panoplie-divine", "legende", "coeur-1", "coeur-5");

	/** Clé de la sauvegarde qui liste les succès gagnés (tableau JSON d'identifiants). */
	public static final String UNLOCKED_SAVE_KEY = "mine-explorer.succes";

	private TitleCatalog() {
	}

	public static boolean isKnown(String id) {
		return IDS.contains(id);
	}
}
