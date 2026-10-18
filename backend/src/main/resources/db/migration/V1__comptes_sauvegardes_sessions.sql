-- Comptes joueurs, identités de connexion, sauvegardes dans le cloud et sessions.
-- SQL commun à PostgreSQL (production) et H2 en mode PostgreSQL (dev et tests).

-- Un joueur. Aucune donnée personnelle : ni e-mail, ni nom, seulement un pseudo public.
CREATE TABLE player (
    id UUID PRIMARY KEY,
    pseudo VARCHAR(20) NOT NULL,
    -- Pseudo en minuscules : « Théo » et « théo » ne peuvent pas coexister
    pseudo_key VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_player_pseudo_key UNIQUE (pseudo_key)
);

-- Un compte externe (Google aujourd'hui, Apple plus tard) relié à un joueur. Un joueur peut en avoir plusieurs.
CREATE TABLE player_identity (
    id UUID PRIMARY KEY,
    player_id UUID NOT NULL,
    provider VARCHAR(20) NOT NULL,
    -- Identifiant opaque et stable du compte chez le fournisseur (« sub » du jeton OpenID Connect)
    subject VARCHAR(255) NOT NULL,
    linked_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_identity_provider_subject UNIQUE (provider, subject),
    CONSTRAINT fk_identity_player FOREIGN KEY (player_id) REFERENCES player (id) ON DELETE CASCADE
);
CREATE INDEX ix_identity_player ON player_identity (player_id);

-- La partie d'un joueur : les clés « mine-explorer.* » du localStorage, plus les valeurs classées extraites à l'envoi.
CREATE TABLE cloud_save (
    player_id UUID PRIMARY KEY,
    -- Taille bornée côté API (voir SaveService) ; la colonne laisse de la place aux échappements JSON
    data VARCHAR(1048576) NOT NULL,
    -- Verrou optimiste : un appareil qui envoie une sauvegarde basée sur une ancienne version est refusé
    version BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    stages_reached INTEGER NOT NULL,
    stages_reached_at TIMESTAMP WITH TIME ZONE NOT NULL,
    abyss_record INTEGER NOT NULL,
    abyss_record_at TIMESTAMP WITH TIME ZONE NOT NULL,
    -- Anti-triche : instant à partir duquel un joueur sans pause aurait pu atteindre cette progression (voir PlausibilityRules)
    play_origin TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_save_player FOREIGN KEY (player_id) REFERENCES player (id) ON DELETE CASCADE
);
-- Classements : meilleure valeur d'abord, à égalité le premier à l'avoir atteinte
CREATE INDEX ix_save_stages ON cloud_save (stages_reached DESC, stages_reached_at);
CREATE INDEX ix_save_abyss ON cloud_save (abyss_record DESC, abyss_record_at);

-- Sessions Spring Session JDBC (schéma officiel schema-postgresql.sql de spring-session-jdbc 4.1)
CREATE TABLE SPRING_SESSION (
    PRIMARY_ID CHAR(36) NOT NULL,
    SESSION_ID CHAR(36) NOT NULL,
    CREATION_TIME BIGINT NOT NULL,
    LAST_ACCESS_TIME BIGINT NOT NULL,
    MAX_INACTIVE_INTERVAL INT NOT NULL,
    EXPIRY_TIME BIGINT NOT NULL,
    PRINCIPAL_NAME VARCHAR(100),
    CONSTRAINT SPRING_SESSION_PK PRIMARY KEY (PRIMARY_ID)
);
CREATE UNIQUE INDEX SPRING_SESSION_IX1 ON SPRING_SESSION (SESSION_ID);
CREATE INDEX SPRING_SESSION_IX2 ON SPRING_SESSION (EXPIRY_TIME);
CREATE INDEX SPRING_SESSION_IX3 ON SPRING_SESSION (PRINCIPAL_NAME);

CREATE TABLE SPRING_SESSION_ATTRIBUTES (
    SESSION_PRIMARY_ID CHAR(36) NOT NULL,
    ATTRIBUTE_NAME VARCHAR(200) NOT NULL,
    ATTRIBUTE_BYTES BYTEA NOT NULL,
    CONSTRAINT SPRING_SESSION_ATTRIBUTES_PK PRIMARY KEY (SESSION_PRIMARY_ID, ATTRIBUTE_NAME),
    CONSTRAINT SPRING_SESSION_ATTRIBUTES_FK FOREIGN KEY (SESSION_PRIMARY_ID) REFERENCES SPRING_SESSION (PRIMARY_ID) ON DELETE CASCADE
);
