# Image du serveur pour le Raspberry Pi 32 bits (linux/arm/v7). Le jar est compilé sur le PC (preparer.ps1).
# Aucune image Java 21 officielle n'existe en 32 bits ARM (Temurin, Liberica, Corretto : amd64 et arm64 seulement) ;
# Ubuntu 24.04 publie en revanche OpenJDK 21 pour armhf dans son dépôt principal, mis à jour par Canonical.
FROM ubuntu:24.04

RUN apt-get update \
    && apt-get install -y --no-install-recommends openjdk-21-jre-headless \
    && rm -rf /var/lib/apt/lists/*

# Utilisateur système sans droits ni shell : le serveur ne tourne jamais en root
RUN useradd --system --no-create-home --shell /usr/sbin/nologin mine

WORKDIR /app
# Le jar reste à root : le serveur peut le lire mais pas le modifier
COPY app.jar app.jar

USER mine
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
