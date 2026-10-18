#!/bin/sh
# Lancé une seule fois par l'image postgres, quand la base est vide. Crée « mine_app », le compte de l'appli, limité
# aux données : il lit et écrit les lignes des tables, mais ne peut ni créer, ni modifier, ni supprimer de table.
# Le schéma appartient au compte principal (POSTGRES_USER), que Flyway utilise pour les migrations.
# Une injection SQL passée par l'appli ne pourrait donc pas toucher au schéma.
set -eu

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set app_password="$MINE_APP_PASSWORD" <<'SQL'
CREATE ROLE mine_app LOGIN PASSWORD :'app_password';
GRANT CONNECT ON DATABASE :"DBNAME" TO mine_app;
GRANT USAGE ON SCHEMA public TO mine_app;
-- Tables et séquences créées plus tard par Flyway (compte principal) : droits sur les données seulement
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mine_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO mine_app;
SQL
