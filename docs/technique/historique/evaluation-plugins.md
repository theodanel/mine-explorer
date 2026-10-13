# Évaluation de 4 plugins avant installation (11/10/2026)

Rien n'a été installé. Sources lues : pages GitHub et articles liés en bas. Je n'ai lu ni le code des hooks ni exécuté de benchmark : les chiffres cités sont ceux des mainteneurs.

## Résumé

| Outil | Ce que c'est | Tokens | Risque | Verdict |
|---|---|---|---|---|
| Ponytail | Skill/plugin Claude Code (prompt « écris le minimum ») | Petit coût fixe par session, gain annoncé ensuite | Faible (MIT, surtout du texte) | Oui, à tester |
| Graphipy → Graphify [PROBABLE] | Graphe de connaissance du code, CLI Python + skill + hooks | Neutre à positif sur gros dépôt, inutile sur petit | Moyen-faible (hooks locaux) | Plus tard, quand le dépôt grossit |
| agent skills | [JE NE SAIS PAS] nom ambigu | ? | ? | Envoie-moi le lien |
| OmniRoute | Passerelle IA auto-hébergée, pas un plugin | Ne réduit pas, multiplie les fournisseurs | Élevé | Non |

## Ponytail

- Dépôt : [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail), licence MIT, très populaire selon la page GitHub.
- Ce qu'il fait : un prompt (`skills/ponytail/SKILL.md`) qui pousse l'agent à écrire seulement le code nécessaire, sans couper validation, gestion d'erreurs, sécurité. Commandes `/ponytail`, `/ponytail-review`, `/ponytail-audit`.
- Installation : Claude Code sur ta machine.
  ```
  /plugin marketplace add DietrichGebert/ponytail
  /plugin install ponytail@ponytail
  ```
- Tokens : actif à chaque session, donc un prompt chargé en permanence (quelques centaines à quelques milliers de tokens [PROBABLE], taille non mesurée). Le mainteneur annonce -45 % de tokens et -26 % de coût sur 39 tâches. Benchmark maison, non vérifié.
- Sécurité : le dépôt contient des dossiers `hooks/` et `scripts/` dont la page ne décrit pas le contenu pour Claude Code. À lire avant install (`/hooks` après install pour voir ce qui est actif).
- Intérêt pour le jeu idle : bon garde-fou contre la sur-ingénierie, cohérent avec tes préférences « pas de sur-ingénierie ». Attention au conflit possible avec ta règle « typage le plus strict, tests proposés » : vérifie qu'il ne rogne pas là-dessus.

## Graphipy

- [PROBABLE] Tu veux dire **Graphify** ([Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify), Apache-2.0/MIT). Je n'ai trouvé aucun outil Claude nommé « Graphipy ».
- Ce qu'il fait : construit un graphe du code (tree-sitter, local) que Claude interroge avant de faire des grep/lectures de fichiers.
- Installation : sur ta machine, puis Claude Code local.
  ```
  uv tool install graphifyy      # deux y, c'est le vrai nom PyPI
  graphify install
  ```
  `graphify install` écrit un skill dans `~/.claude/skills/`, ajoute une section dans `~/.claude/CLAUDE.md` (global, donc tous tes projets) et des hooks PreToolUse.
- Tokens : construction du graphe sans LLM pour le code. Les docs/PDF/images, eux, passent par le modèle (consomment des tokens) ; `--code-only` les évite. Section CLAUDE.md chargée en permanence. Gain réel seulement sur un dépôt assez gros pour que Claude se perde en lectures.
- Sécurité : « pas de télémétrie » selon le dépôt, log local des requêtes dans `~/.cache/graphify-queries.log`. Les hooks interceptent Read/Glob/Grep : risque de comportement gênant plus que de fuite.
- Intérêt pour le jeu idle : faible tant que le projet n'a pas de dépôt. Préfère `graphify install --project` plutôt que global quand tu y viendras.
- Attention au typosquatting : le nom PyPI `graphifyy` est piégeux, vérifie que tu installes bien celui lié depuis le dépôt officiel.

## agent skills

[JE NE SAIS PAS] lequel tu vises. « Agent Skills » désigne d'abord le format de skills d'Anthropic, déjà intégré à Claude Code (rien à installer). Il existe aussi plusieurs collections nommées ainsi (ex. `anthropics/skills`, `vercel-labs/agent-skills`, et d'autres sur des marketplaces communautaires). Envoie le lien ou l'auteur et je l'évalue.

Règle générale : chaque skill installé ajoute seulement son nom et sa description au contexte ; le contenu complet se charge quand il est utilisé. Une grosse collection reste donc raisonnable, mais les plugins qui ajoutent des hooks ou du CLAUDE.md, eux, coûtent à chaque session.

## OmniRoute

- Dépôt : [diegosouzapw/OmniRoute](https://github.com/diegosouzapw/OmniRoute), MIT, mainteneur Diego (diegosouzapw). Fork de 9router d'après son historique.
- Ce que c'est : une passerelle (proxy) Node que tu fais tourner sur ta machine (`npm i -g omniroute`, port 20128), qui route tes requêtes vers de nombreux fournisseurs avec fallback. Ce n'est pas un plugin Claude Code : Claude Code s'y connecte comme client.
- Tokens : ne réduit pas ta consommation Claude. Son intérêt est de basculer vers d'autres modèles (gratuits ou moins chers).
- Risques :
  - Il détient toutes tes clés/sessions et voit tous tes prompts et réponses (logs complets possibles).
  - Défauts faibles : écoute sur `0.0.0.0` dans certaines versions, `REQUIRE_API_KEY` désactivé par défaut.
  - Fonctions « stealth » (empreinte TLS, obfuscation) et mode interception qui installe une autorité de certification racine : à ne jamais activer.
  - Une route vulnérable signalée comme non corrigée au moment de l'article (PR #7966).
  - [PROBABLE] Utiliser un abonnement Claude Pro/Max via un proxy tiers est contraire aux conditions d'Anthropic et peut mener à une suspension. À vérifier dans les conditions d'utilisation actuelles.
- Verdict : non pour toi maintenant. Beaucoup de surface d'attaque pour un gain nul sur la conso Claude.

## Sources

- https://github.com/DietrichGebert/ponytail
- https://github.com/Graphify-Labs/graphify
- https://graphify.com/blog/how-to-give-claude-code-a-code-knowledge-graph
- https://github.com/diegosouzapw/OmniRoute
- https://agentpedia.codes/blog/omniroute-ai-gateway-routing-setup-guide

---

Voir aussi : [[Accueil]] · [[Decisions]]
