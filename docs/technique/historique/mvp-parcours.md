# Mine Explorer : parcours MVP à coder toi-même

Pour : Théo · 11/10/2026 · Objectif du MVP : le mineur tape le sol en boucle, gagne des pièces, et tu peux remplacer un équipement par un nouveau.

Règle du jeu entre nous : tu écris le code, je t'explique les notions, je réponds à tes questions et je relis tes PR. Chaque étape se termine par un critère vérifiable et une PR que tu peux me demander de relire.

Versions vérifiées le 11/10/2026 :
- Spring Boot **4.1.1** (dernière stable sur Maven Central).
- Angular CLI **22.2.2**. Elle exige Node **22.22.3+, 24.15+ ou 26+** (refus constaté avec 22.22.0). Vérifie `node -v` avant `ng new`.
- Java 21 suffit.

---

## Étape 0 : créer le dépôt (un seul monorepo)

Pourquoi un seul dépôt : tu es seul, et une évolution d'API touche le serveur et le client en même temps. Un commit, une PR, un historique.

1. Sur GitHub : **New repository**, nom `mine-explorer`, **Private**, sans README ni .gitignore (tu les crées en local).
2. En local, dans le dossier de travail :
   ```powershell
   mkdir mine-explorer
   cd mine-explorer
   git init -b main
   ```
3. Backend : sur https://start.spring.io choisis Maven, Java 21, Spring Boot 4.1.1, groupe à ton nom, artefact `backend`. Dépendances : **Spring Web**, **Spring Data JPA**, **H2 Database**, **Validation**, **Flyway Migration**. Dézippe dans `mine-explorer\backend`.
4. Frontend, depuis `mine-explorer` :
   ```powershell
   npx @angular/cli@22 new frontend --skip-git --ssr=false --style=css
   ```
   `--skip-git` évite un second dépôt git imbriqué dans le premier.
5. Un `.gitignore` à la racine (les sous-projets ont déjà le leur, ajoute ce qui manque) :
   ```
   backend/data/
   .idea/
   .vscode/
   ```
   `backend/data/` contiendra le fichier H2 : c'est ta base locale, pas du code.
6. Premier commit et push :
   ```powershell
   git add .
   git commit -m "Initialise le monorepo backend + frontend"
   git remote add origin https://github.com/theodanel/mine-explorer.git
   git push -u origin main
   ```
   Variante avec GitHub CLI, à la place de l'étape 1 et du `remote add` : `gh repo create mine-explorer --private --source=. --remote=origin --push`.
7. Ajoute ensuite le dépôt au projet Claude ([Project settings](#project-settings/resources)) : je pourrai lire ton code et relire tes PR.

**Critère** : `mvnw spring-boot:run` dans `backend` démarre sur le port 8080, `npm start` dans `frontend` affiche la page Angular par défaut.

---

## Étape 1 : les règles du jeu en Java pur (sans Spring)

But : une classe `MiningRules` avec deux fonctions pures, et leurs tests JUnit.
- `coinsPerSecond(power)` : formule provisoire, par exemple `1 + 0,1 × puissance`.
- `coinsEarned(power, elapsed, cap)` : pièces gagnées sur une durée, plafonnée (8 h par exemple).

Notions : fonction pure, `Duration`, test unitaire, cas limites (durée nulle, durée négative, dépassement du plafond).
Pourquoi d'abord : ce sont les règles qui font le jeu. Testées sans base ni serveur, elles tournent en millisecondes et tu peux les changer sans peur.

**Critère** : `mvnw test` passe, avec au moins un test par cas limite.

## Étape 2 : le joueur en base

But : entité `Player` (id, pièces, `lastCollectedAt`), migration Flyway `V1__init.sql`, repository JPA.

Notions : entité JPA, migration versionnée, `spring.jpa.hibernate.ddl-auto=validate` (Hibernate vérifie le schéma au lieu de le créer : c'est Flyway qui le possède), `@Version` pour le verrou optimiste.
À décider : `long` pour les pièces (recommandé dans le guide tant que l'économie le permet), et comment ne pas perdre les fractions de pièce entre deux collectes (une colonne de reste, ou avancer `lastCollectedAt` seulement du temps « consommé »).

**Critère** : l'appli démarre, la table existe, un test d'intégration enregistre et relit un joueur.

## Étape 3 : l'API de collecte (gains calculés par le serveur)

But : `GET /api/player` renvoie l'état du joueur, après avoir crédité les pièces gagnées depuis `lastCollectedAt` avec l'heure du serveur.

Notions : contrôleur REST, DTO en `record` (jamais l'entité), `Clock` injecté pour tester le temps, `@Transactional`.
Identité : pas encore de comptes. Un joueur « invité » dont l'id est stocké dans la `HttpSession` côté serveur suffit, et le client ne passe jamais d'id dans l'URL (anti-IDOR). Mets `server.servlet.session.cookie.same-site=strict` : sans Spring Security, c'est ce qui empêche un autre site de déclencher tes requêtes (CSRF).

**Critère** : deux appels espacés de 10 s rendent environ 10 × `coinsPerSecond` pièces de plus. Un test avec une `Clock` fixe le prouve sans attendre.

## Étape 4 : l'écran de mine (Angular, palier 1 du guide)

But : le compteur de pièces et le mineur qui frappe en boucle.
- Proxy de dev vers `localhost:8080` (section 5.2 du guide).
- Service `GameApi` avec `HttpClient`, état dans des `signal`.
- Synchronisation toutes les quelques secondes, et entre deux, le compteur avance localement à `coinsPerSecond` (affichage seulement : la vraie valeur reste celle du serveur).
- Animation de frappe en `@keyframes` CSS : rotation du sprite autour des pieds, petit tremblement du rocher, « +N » qui monte et disparaît.

Notions : composant standalone, signals, `computed`, `takeUntilDestroyed`, `@keyframes`, `transform-origin`.
Sprite : découpe le mineur vue 3/4 de ta planche et rends le fond transparent (GIMP, Krita, ou un outil de détourage). Je peux t'expliquer la méthode si tu bloques.

**Critère** : le mineur frappe, le compteur monte, et après un rechargement de la page les pièces gagnées entre-temps sont là.

## Étape 5 : l'équipement

But : 5 emplacements (casque, pioche, sac, gants, bottes), une Puissance = somme des puissances équipées, qui fait monter `coinsPerSecond`.
- Entité `Item` (emplacement, rareté, puissance, équipé ou non), un kit de départ à la création du joueur.
- Panneau d'équipement dans l'écran de mine.

Notions : relation JPA `@ManyToOne`, enum, contrainte « un seul objet équipé par emplacement ».
Piège à éviter : collecte toujours les pièces **avant** de changer l'équipement, sinon le temps écoulé est payé au nouveau taux.

**Critère** : la Puissance affichée vient du serveur, et changer un objet change le gain par seconde.

## Étape 6 : obtenir et échanger un équipement

But : la boucle « nouvel objet → comparer → équiper ou revendre ».
- `POST /api/chest/open` : coûte des pièces, tire un objet aléatoire (emplacement, rareté pondérée, puissance) **côté serveur**.
- `POST /api/items/{id}/equip` : l'objet remplace celui de l'emplacement, l'ancien est revendu.
- `POST /api/items/{id}/sell` : revend l'objet tiré.
- Fenêtre de comparaison côté client (ancien contre nouveau, différence en vert ou rouge).

Notions : `RandomGenerator` injecté (tests reproductibles), vérification que l'objet appartient au joueur de la session (sinon 404), erreurs en `ProblemDetail` (409 si pas assez de pièces), verrou optimiste contre le double clic qui dépenserait deux fois.

**Critère** : tu ouvres un coffre, tu vois la comparaison, tu équipes, la Puissance et le gain par seconde changent. Un test prouve qu'on ne peut pas équiper l'objet d'un autre joueur.

---

## Ce que le MVP laisse de côté exprès

Comptes et Spring Security, PostgreSQL, couches et profondeur, PixiJS. Chacun viendra après, sans rien casser si les étapes 1 à 6 sont propres.

## Comment travailler avec moi

- Une branche et une PR par étape. Demande-moi « relis ma PR de l'étape N ».
- Si tu bloques, montre-moi le code et l'erreur, et dis-moi ce que tu as essayé : je t'explique la cause plutôt que de te donner la correction toute faite, sauf si tu me la demandes.

---

Voir aussi : [[Accueil]] · [[guide-demarrage-technique]]
