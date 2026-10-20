-- Titre porté par le joueur (succès du jeu) : un identifiant de la liste blanche TitleCatalog, jamais du texte libre.
-- Affiché à côté du pseudo dans le classement et la discussion. Null : aucun titre.
ALTER TABLE player ADD COLUMN title VARCHAR(40);
