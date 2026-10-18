# Image du serveur Spring Boot, sans root. Construite par le docker-compose.yml à la racine du dépôt.

# ─── Build ──────────────────────────────────────────────────────────────────
# Même version de Java que la CI (.github/workflows/ci.yml)
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
# Wrapper Maven et pom d'abord : les dépendances restent en cache tant que le pom ne change pas
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -B -ntp dependency:go-offline
COPY src src
# Les tests tournent en CI ; l'image se contente de construire le jar
RUN ./mvnw -B -ntp package -DskipTests

# ─── Exécution ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Utilisateur sans droits : le serveur ne tourne jamais en root
RUN addgroup -S mine && adduser -S mine -G mine
COPY --from=build --chown=mine:mine /app/target/*.jar app.jar
USER mine
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
