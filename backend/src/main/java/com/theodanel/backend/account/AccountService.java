package com.theodanel.backend.account;

import java.security.SecureRandom;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import java.util.random.RandomGenerator;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theodanel.backend.error.ApiException;

/** Création des comptes à la première connexion, pseudo et suppression. */
@Service
public class AccountService {

	/** Pseudo provisoire « Mineur-123456 », que le joueur peut changer. */
	private static final String DEFAULT_PSEUDO_PREFIX = "Mineur-";
	private static final int DEFAULT_PSEUDO_BOUND = 1_000_000;
	private static final int DEFAULT_PSEUDO_ATTEMPTS = 10;

	private final PlayerRepository players;
	private final PlayerIdentityRepository identities;
	private final Clock clock;
	private final RandomGenerator random = new SecureRandom();

	public AccountService(PlayerRepository players, PlayerIdentityRepository identities, Clock clock) {
		this.players = players;
		this.identities = identities;
		this.clock = clock;
	}

	/**
	 * Joueur relié à ce compte externe, créé à la première connexion. L'identité est cherchée par fournisseur et
	 * identifiant opaque : jamais par e-mail, qu'un autre fournisseur pourrait attribuer à quelqu'un d'autre.
	 */
	@Transactional
	public UUID findOrCreatePlayer(String provider, String subject) {
		return identities.findByProviderAndSubject(provider, subject)
			.map(PlayerIdentity::getPlayerId)
			.orElseGet(() -> createPlayer(provider, subject));
	}

	@Transactional(readOnly = true)
	public Player get(UUID playerId) {
		return players.findById(playerId).orElseThrow(AccountService::accountGone);
	}

	@Transactional(readOnly = true)
	public List<PlayerIdentity> identitiesOf(UUID playerId) {
		return identities.findByPlayerId(playerId);
	}

	@Transactional
	public Player rename(UUID playerId, String rawPseudo) {
		String pseudo = PseudoRules.normalize(rawPseudo)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "pseudo-invalid",
					"Pseudo invalide : 3 à 20 lettres, chiffres, espaces, tirets ou soulignés"));
		Player player = get(playerId);
		boolean sameKey = PseudoRules.key(pseudo).equals(PseudoRules.key(player.getPseudo()));
		if (!sameKey && players.existsByPseudoKey(PseudoRules.key(pseudo))) {
			throw pseudoTaken();
		}
		player.rename(pseudo);
		try {
			// Écriture immédiate : deux joueurs qui prennent le même pseudo au même instant butent sur la contrainte ici
			players.flush();
		}
		catch (DataIntegrityViolationException race) {
			throw pseudoTaken();
		}
		return player;
	}

	/** Supprime le joueur ; la base supprime en cascade ses identités et sa sauvegarde. */
	@Transactional
	public void delete(UUID playerId) {
		players.deleteById(playerId);
	}

	private UUID createPlayer(String provider, String subject) {
		UUID playerId = UUID.randomUUID();
		players.save(new Player(playerId, freeDefaultPseudo(), clock.instant()));
		identities.save(new PlayerIdentity(UUID.randomUUID(), playerId, provider, subject, clock.instant()));
		return playerId;
	}

	private String freeDefaultPseudo() {
		for (int attempt = 0; attempt < DEFAULT_PSEUDO_ATTEMPTS; attempt++) {
			String candidate = DEFAULT_PSEUDO_PREFIX + random.nextInt(DEFAULT_PSEUDO_BOUND);
			if (!players.existsByPseudoKey(PseudoRules.key(candidate))) {
				return candidate;
			}
		}
		throw new IllegalStateException("Aucun pseudo provisoire libre après " + DEFAULT_PSEUDO_ATTEMPTS + " essais");
	}

	private static ApiException pseudoTaken() {
		return new ApiException(HttpStatus.CONFLICT, "pseudo-taken", "Ce pseudo est déjà pris");
	}

	/** Compte supprimé depuis un autre appareil alors que cette session était encore ouverte. */
	private static ApiException accountGone() {
		return new ApiException(HttpStatus.UNAUTHORIZED, "account-gone", "Compte introuvable, reconnecte-toi");
	}
}
