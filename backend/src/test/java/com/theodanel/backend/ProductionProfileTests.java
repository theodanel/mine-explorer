package com.theodanel.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.util.Properties;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.PropertiesLoaderUtils;

/**
 * Réglages effectifs du profil « prod » (fichier commun puis surcharges de production) : garde-fous contre un
 * réglage de développement qui partirait en production. Lus sans démarrer le serveur, qui exigerait une vraie base.
 */
class ProductionProfileTests {

	@Test
	void protectionsActivesEnProduction() throws IOException {
		Properties prod = effectiveProdProperties();
		assertThat(prod.getProperty("mine.session.secure-cookie")).isEqualTo("true");
		assertThat(prod.getProperty("spring.h2.console.enabled")).isEqualTo("false");
		assertThat(prod.getProperty("server.error.include-stacktrace")).isEqualTo("never");
		assertThat(prod.getProperty("management.endpoints.web.exposure.include")).isEqualTo("health");
		assertThat(prod.getProperty("mine.rate-limit.client-ip-header")).isEqualTo("Fly-Client-IP");
		assertThat(prod.getProperty("mine.front.allowed-origins")).startsWith("https://").doesNotContain("*");
		assertThat(prod.getProperty("spring.security.oauth2.client.registration.google.redirect-uri"))
			.startsWith("https://");
	}

	@Test
	void aucunSecretNiValeurParDefautPourLesIdentifiants() throws IOException {
		Properties prod = effectiveProdProperties();
		// Sans la variable d'environnement, le serveur ne démarre pas : pas de repli silencieux sur une fausse valeur
		assertThat(prod.getProperty("spring.security.oauth2.client.registration.google.client-id"))
			.isEqualTo("${GOOGLE_CLIENT_ID}");
		assertThat(prod.getProperty("spring.security.oauth2.client.registration.google.client-secret"))
			.isEqualTo("${GOOGLE_CLIENT_SECRET}");
		assertThat(prod.getProperty("spring.datasource.url")).isNull();
		assertThat(prod.getProperty("spring.datasource.password")).isNull();
	}

	private static Properties effectiveProdProperties() throws IOException {
		Properties properties = PropertiesLoaderUtils.loadProperties(new ClassPathResource("application.properties"));
		properties.putAll(PropertiesLoaderUtils.loadProperties(new ClassPathResource("application-prod.properties")));
		return properties;
	}
}
