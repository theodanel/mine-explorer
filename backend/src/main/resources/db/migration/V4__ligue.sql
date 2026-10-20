-- Ligue de la semaine : chaque joueur avec une sauvegarde cloud est dans une ligue. Son score de la semaine est le
-- nombre de filons gagnés depuis le début de la semaine (valeur classée de sa sauvegarde, donc passée par l'anti-triche,
-- moins base_stages). Le lundi à 0 h (Paris), les meilleurs montent, les derniers descendent, et chacun reçoit des éclats.
CREATE TABLE league_member (
    player_id UUID PRIMARY KEY,
    league VARCHAR(10) NOT NULL,
    -- Lundi (heure de Paris) de la semaine en cours pour ce joueur
    week_start DATE NOT NULL,
    -- Filons classés au début de la semaine (ou à l'entrée dans la ligue)
    base_stages INT NOT NULL,
    -- Récompense de la semaine passée, pas encore récupérée par le jeu (0 : rien)
    pending_shards INT NOT NULL DEFAULT 0,
    -- Ligue de la semaine passée et ligue d'arrivée, pour l'annoncer avec la récompense
    pending_from VARCHAR(10),
    pending_to VARCHAR(10),
    CONSTRAINT fk_league_player FOREIGN KEY (player_id) REFERENCES player (id) ON DELETE CASCADE
);

CREATE INDEX idx_league_week ON league_member (league, week_start);
