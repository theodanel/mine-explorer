package com.theodanel.backend.config;

import java.time.Clock;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(MineProperties.class)
public class AppConfig {

	/** Heure injectée : les tests d'anti-triche figent le temps au lieu d'attendre. */
	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}
}
