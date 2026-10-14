package com.theodanel.backend.security;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.HexFormat;
import java.util.regex.Pattern;

/**
 * Clé de limite de requêtes d'une adresse IP. Une connexion IPv6 reçoit en général tout un bloc /64 : compter
 * chaque adresse à part laisserait un client changer d'adresse à chaque requête et ne jamais atteindre la limite.
 * Les adresses IPv6 sont donc regroupées par /64, les adresses IPv4 comptées une à une.
 */
final class ClientAddress {

	/** Octets du préfixe /64 : la partie « réseau » attribuée à un abonné. */
	private static final int IPV6_PREFIX_BYTES = 8;
	/** Seulement des chiffres hexadécimaux, « : » et « . » (IPv4 embarquée) : jamais un nom d'hôte à résoudre. */
	private static final Pattern IPV6_LITERAL = Pattern.compile("[0-9a-fA-F:.]+");

	private ClientAddress() {
	}

	static String rateLimitKey(String address) {
		if (address.indexOf(':') < 0 || !IPV6_LITERAL.matcher(address).matches()) {
			return address;
		}
		try {
			// Une chaîne qui contient « : » est lue comme une adresse littérale, sans requête DNS
			InetAddress parsed = InetAddress.getByName(address);
			if (parsed instanceof Inet6Address) {
				byte[] prefix = new byte[IPV6_PREFIX_BYTES];
				System.arraycopy(parsed.getAddress(), 0, prefix, 0, IPV6_PREFIX_BYTES);
				return HexFormat.of().formatHex(prefix) + "::/64";
			}
			// Adresse IPv4 écrite en IPv6 (::ffff:1.2.3.4) : comptée comme l'IPv4
			return parsed.getHostAddress();
		}
		catch (UnknownHostException malformed) {
			// En-tête mal formé : compté tel quel, comme n'importe quelle chaîne
			return address;
		}
	}
}
