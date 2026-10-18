package com.theodanel.backend.security;

import java.time.Clock;
import java.time.Duration;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.theodanel.backend.config.MineProperties;

/**
 * Sécurité de l'API. Principes :
 * <ul>
 * <li>tout est refusé sauf ce qui est listé ici ;</li>
 * <li>aucun jeton dans le navigateur : la session vit en base, le navigateur n'a qu'un cookie HttpOnly ;</li>
 * <li>CSRF obligatoire sur toute écriture, CORS limité à l'adresse du jeu ;</li>
 * <li>connexion Google en « authorization code » avec PKCE, state et nonce.</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	private static final Logger LOG = LoggerFactory.getLogger(SecurityConfig.class);

	public static final String CSRF_HEADER = "X-XSRF-TOKEN";
	public static final String SESSION_COOKIE = "MINE_SESSION";
	private static final String AUTHORIZATION_BASE_URI = "/oauth2/authorization";
	private static final long CORS_MAX_AGE_SECONDS = 3600;

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, MineProperties properties,
			PlayerOidcUserService oidcUserService, ClientRegistrationRepository registrations, Clock clock) {
		String frontUrl = properties.front().url();
		http
			.cors(Customizer.withDefaults())
			.csrf(csrf -> csrf
				// Jeton gardé dans la session (donc en base), renvoyé au front par GET /api/csrf.
				// Le front et l'API n'ont pas la même origine : un cookie XSRF-TOKEN ne serait pas lisible par Angular.
				.csrfTokenRepository(csrfTokenRepository())
				// Jeton masqué différemment à chaque réponse (protection BREACH)
				.csrfTokenRequestHandler(new XorCsrfTokenRequestAttributeHandler()))
			.authorizeHttpRequests(requests -> requests
				.requestMatchers(HttpMethod.GET, "/api/csrf", "/api/leaderboard/*").permitAll()
				.requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
				.requestMatchers("/error").permitAll()
				.requestMatchers("/api/**").authenticated()
				.anyRequest().denyAll())
			.oauth2Login(login -> login
				// Pas de page de connexion générée par Spring : le jeu envoie directement vers Google
				.loginPage(AUTHORIZATION_BASE_URI + "/google")
				.authorizationEndpoint(endpoint -> endpoint
					.authorizationRequestResolver(pkceResolver(registrations)))
				.userInfoEndpoint(userInfo -> userInfo.oidcUserService(oidcUserService))
				.successHandler(onLogin(frontUrl, properties.session().idleTimeout()))
				.failureHandler(failureRedirect(frontUrl)))
			.logout(logout -> logout
				.logoutUrl("/api/logout")
				.deleteCookies(SESSION_COOKIE)
				.logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
			.exceptionHandling(errors -> errors
				// Une API répond 401/403 en JSON, sans redirection vers une page de connexion
				.authenticationEntryPoint((request, response, exception) -> ProblemResponses.write(response,
						HttpStatus.UNAUTHORIZED, "unauthenticated", "Connexion requise"))
				.accessDeniedHandler((request, response, exception) -> {
					if (exception instanceof CsrfException) {
						ProblemResponses.write(response, HttpStatus.FORBIDDEN, "csrf-invalid",
								"Jeton CSRF manquant ou périmé");
					}
					else {
						ProblemResponses.write(response, HttpStatus.FORBIDDEN, "forbidden", "Accès refusé");
					}
				}))
			.headers(headers -> headers
				// L'API ne sert jamais de page : rien ne peut s'y exécuter ni l'afficher dans un cadre
				.contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
				.referrerPolicy(referrer -> referrer.policy(ReferrerPolicy.NO_REFERRER)))
			.requestCache(cache -> cache.disable())
			.addFilterBefore(new SessionLifetimeFilter(properties.session().maxLifetime(), clock),
					SecurityContextHolderFilter.class);
		return http.build();
	}

	static HttpSessionCsrfTokenRepository csrfTokenRepository() {
		HttpSessionCsrfTokenRepository repository = new HttpSessionCsrfTokenRepository();
		repository.setHeaderName(CSRF_HEADER);
		return repository;
	}

	/** Seule l'adresse du jeu peut appeler l'API avec les cookies du joueur et lire ses réponses. */
	@Bean
	CorsConfigurationSource corsConfigurationSource(MineProperties properties) {
		CorsConfiguration cors = new CorsConfiguration();
		cors.setAllowedOrigins(properties.front().allowedOrigins());
		cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
		cors.setAllowedHeaders(List.of(HttpHeaders.CONTENT_TYPE, CSRF_HEADER));
		cors.setAllowCredentials(true);
		cors.setMaxAge(CORS_MAX_AGE_SECONDS);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", cors);
		return source;
	}

	/**
	 * Cookie de session de Spring Session. Déclaré ici plutôt que par {@code server.servlet.session.cookie.*}, que
	 * Spring Boot n'applique qu'avec un serveur embarqué : le même réglage vaut ainsi en production et en test.
	 * HttpOnly : illisible par le JavaScript (un XSS ne peut pas le voler). SameSite=Lax : jamais envoyé par une
	 * requête d'un autre site (le front mine.bouncylab.ovh et l'API api.bouncylab.ovh sont sur le même site).
	 */
	@Bean
	DefaultCookieSerializer sessionCookieSerializer(MineProperties properties) {
		DefaultCookieSerializer serializer = new DefaultCookieSerializer();
		serializer.setCookieName(SESSION_COOKIE);
		serializer.setUseHttpOnlyCookie(true);
		serializer.setSameSite("Lax");
		serializer.setUseSecureCookie(properties.session().secureCookie());
		return serializer;
	}

	/** Filtres posés avant la session et la sécurité : une requête refusée ici ne coûte ni base ni session. */
	@Bean
	FilterRegistrationBean<RateLimitFilter> rateLimitFilter(MineProperties properties, Clock clock) {
		FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(
				new RateLimitFilter(properties.rateLimit(), clock));
		registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
		return registration;
	}

	@Bean
	FilterRegistrationBean<BodySizeFilter> bodySizeFilter(MineProperties properties) {
		FilterRegistrationBean<BodySizeFilter> registration = new FilterRegistrationBean<>(
				new BodySizeFilter(properties.limits().maxBodyBytes()));
		registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 1);
		return registration;
	}

	/**
	 * PKCE même pour un client confidentiel : un code d'autorisation intercepté (historique, journal d'un proxy)
	 * est inutilisable sans le secret aléatoire gardé dans la session.
	 */
	private static DefaultOAuth2AuthorizationRequestResolver pkceResolver(ClientRegistrationRepository registrations) {
		DefaultOAuth2AuthorizationRequestResolver resolver = new DefaultOAuth2AuthorizationRequestResolver(
				registrations, AUTHORIZATION_BASE_URI);
		resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
		return resolver;
	}

	/**
	 * Après connexion : la session passe de la durée courte des visiteurs anonymes (jeton CSRF, flux Google en
	 * cours) à celle d'un joueur connecté, puis retour au jeu. Adresse fixe, tirée de la configuration : aucune
	 * redirection ouverte.
	 */
	private static AuthenticationSuccessHandler onLogin(String frontUrl, Duration idleTimeout) {
		int idleSeconds = Math.toIntExact(idleTimeout.toSeconds());
		return (request, response, authentication) -> {
			request.getSession().setMaxInactiveInterval(idleSeconds);
			response.sendRedirect(frontUrl);
		};
	}

	private static AuthenticationFailureHandler failureRedirect(String frontUrl) {
		return (request, response, exception) -> {
			LOG.warn("Connexion refusée : {}", exception.getClass().getSimpleName());
			response.sendRedirect(frontUrl + "/?connexion=echec");
		};
	}
}
