# Image du serveur Mine Explorer, construite depuis le dossier backend/ :
#   docker build -t mine-explorer-api .
# Étape 1 : compilation avec le JDK (tests lancés par la CI, pas ici)
FROM eclipse-temurin:21-jdk-noble AS build
WORKDIR /build
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN sh ./mvnw -B -ntp dependency:go-offline
COPY src/ src/
RUN sh ./mvnw -B -ntp package -DskipTests \
    && java -Djarmode=tools -jar target/backend-*.jar extract --layers --launcher --destination extracted

# Étape 2 : exécution avec le seul JRE, sans outils de compilation ni sources
FROM eclipse-temurin:21-jre-noble
# Utilisateur sans privilèges : une faille dans l'appli ne donne pas la main sur le conteneur
RUN groupadd --system mine && useradd --system --gid mine --no-create-home mine
WORKDIR /app
# Couches de Spring Boot : les dépendances, qui changent rarement, restent en cache d'un déploiement à l'autre
COPY --from=build /build/extracted/dependencies/ ./
COPY --from=build /build/extracted/spring-boot-loader/ ./
COPY --from=build /build/extracted/snapshot-dependencies/ ./
COPY --from=build /build/extracted/application/ ./
USER mine
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
# Mémoire de la JVM calée sur celle de la machine plutôt que sur une valeur fixe
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "org.springframework.boot.loader.launch.JarLauncher"]
