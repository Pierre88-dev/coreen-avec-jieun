# Coréen avec Jieun — notes pour Claude Code

Ce fichier ne porte que ce projet. Ce qui vaut pour tout le dossier — la langue,
git hors OneDrive, la machine de Pierre, sa façon de travailler — est dans le
`CLAUDE.md` du dossier parent, chargé en même temps que celui-ci.

Ce dossier est **le seul exemplaire de travail** ; une copie périmée dort dans
`C:\Projets\coreen-avec-jieun` (`OBSOLETE.md` l'y signale). Site statique, aucune
compilation : `demarrer.cmd` pour l'essayer. Lire `README.md` avant d'y toucher,
`DESIGN.md` avant toute retouche d'interface. Dépôt hors OneDrive dans
`C:\Projets\coreen-avec-jieun.git`, remote `Pierre88-dev/coreen-avec-jieun`,
**public** : rien de secret par construction, mais le schéma de la base y est
lisible par tous.

## Cloudflare Pages : chaque push met en ligne

`https://coreen-avec-jieun.pages.dev`, sans configuration de build. Un push
déploie en moins d'une minute. **Vérifier sur l'URL publique, pas le succès du
push** : `curl` + `grep` sur le fichier déployé tranche en une seconde.

- **Dire à Pierre de faire Ctrl+Shift+R** après tout déploiement touchant un
  `.js` ou le `.css` : son navigateur sert l'ancien fichier, et il en conclut
  que la fonctionnalité manque.
- **Une variable d'environnement ajoutée n'atteint pas le déploiement en
  cours.** Le bouton *Retry deployment* est hors champ, derrière une barre de
  défilement horizontale : pousser un commit vide est plus sûr.
- **Pages sert les fichiers sans extension** : `/prof` répond pour `prof.html`.
  Tout code découpant `location.href` autour d'un `.html` marche en local et
  casse en ligne — un lien élève est ainsi devenu `/profeleve.html`. Construire
  les liens avec `new URL(chemin, location.href)` ; un essai local ne prouve rien
  sur les adresses.

Le tableau de bord pousse vers **Workers**, mauvais produit ici. Le flux **Pages**
s'atteint par l'URL directe :
`dash.cloudflare.com/d91e1bf665ad3d9b5c4c9748d71f2b51/workers-and-pages/create/pages`

## La base Supabase

Projet `gatxsrpwskdbsrulqdon`, Paris, plan gratuit. URL et clé *publishable* dans
`assets/config.js` — publiques par nature, elles finissent dans la page. **Jamais
de clé `sb_secret_…` ni `service_role`.**

- **Coller `supabase/schema-a-coller.sql`, jamais `schema.sql`** : l'éditeur SQL
  échoue sur les apostrophes françaises des commentaires (`syntax error at end
  of input`, LINE 0, rien de créé). Modifier la source, régénérer avec
  `supabase/sans-commentaires.py`, coller la seconde.
- **L'onglet SQL garde l'ancienne requête et son ancien « Success »** : ce
  message ne prouve rien. Faire passer Pierre par le `+` (*New query*), puis
  sonder soi-même.
- **Aucun `grant` explicite** dans le schéma : il compte sur *Automatically
  expose new tables*. La décocher fermerait l'espace de Jieun.
- Aucun contenu ne se lit d'ici : tables fermées, et les fonctions exigent la
  clé privée d'un élève.

**Aucun Postgres sur cette machine : tout SQL écrit ici est non testé** tant que
Pierre ne l'a pas joué — le dire. En revanche il **se vérifie après coup**, sans
compte et sans lui, via l'API REST avec la clé publishable : RLS ferme les
données, pas les messages d'erreur.

| Question | Sonde | Réponse qui tranche |
| --- | --- | --- |
| La colonne existe ? | `GET /rest/v1/<table>?select=<col>&limit=1` | `[]` = oui · `42703` = non |
| Le bucket existe ? | `GET /storage/v1/object/public/<bucket>/x` | `NoSuchKey` = oui · `NoSuchBucket` = non |
| La règle protège ? | tenter l'écriture interdite | `new row violates row-level security policy` |

## Les PDF : bucket `documents`, public, et il doit le rester

Créé **par `schema.sql`**, pas à la main : une base se rejoue, un clic non.
Chemins en `<uuid>/<nom>`, 32 Mo par fichier — la limite exacte d'un envoi à
l'API. **Ne pas refermer ce bucket** : l'élève ouvre son PDF sans compte, et
l'API va chercher le fichier elle-même par son adresse. Ce qui protège un
document est son adresse imprévisible ; un document confidentiel n'a rien à faire
là. L'énumération, elle, exige d'être connecté.

Pages comptées au dépôt par **pdf.js chargé à la demande depuis esm.sh** ; s'il
échoue, le fichier passe quand même et seule l'estimation de coût disparaît.
Retirer un document d'une leçon **n'efface pas le fichier**.

## « Générer le QCM » : fonction serveur, pas appel du navigateur

`functions/api/qcm.js` répond à `/api/qcm` ; Cloudflare Pages ramasse seul le
dossier `functions/`. **L'API y est appelée en `fetch` brut, pas avec le SDK
Anthropic** : le projet n'a ni Node ni npm ni build. Trois protections à ne pas
alléger :

- `CLE_API_CLAUDE`, secret Cloudflare, jamais dans la page ni le dépôt ;
- `EMAILS_PROF` : la fonction présente le jeton de session à Supabase pour savoir
  à qui il appartient. **Liste vide = personne ne génère** ;
- seules les adresses du bucket de ce projet sont suivies — sinon c'est une
  machine à faire lire n'importe quelle page du web aux frais de Pierre.

Coûts en **centimes de dollar** (`generations.cout_centimes`) : l'API facture en
dollars, on n'invente pas de taux de change.

**Les documents de Jieun sont en coréen.** Toute génération doit donc porter
l'instruction explicite d'écrire **en français**, sinon le modèle suit la langue
du document et rend un QCM qu'une débutante ne peut pas lire. Vaut pour tout ce
qui viendra. Seul le coréen testé s'écrit en hangul, et **sans balise** : la
couleur est posée à l'affichage par `hangul()` dans `eleve.js`.

**Le modèle reste à trancher par Jieun** : le menu propose Opus 5 (défaut) et
Sonnet 5 à chaque génération, exprès.

## Décisions à ne pas rejouer

- **Un seul mode de QCM, l'entraînement** : correction et *pourquoi* affichés dès
  la réponse. Le mode « test » a été retiré, ne pas le réintroduire.
- **Le QCM vient du PDF, jamais du récapitulatif.** Jieun n'écrit qu'un
  mini-récap ; la matière est dans le document. Le récap sert à cibler, par le
  champ « Sur quoi porte le QCM ? ».
- **Rien ne se supprime** : un élève se désactive (`actif`), et un passage
  **survit à la suppression de sa leçon**. Le README détaille pourquoi, avec sa
  règle jumelle — l'élève n'écrit jamais dans les tables, seulement par les
  fonctions du schéma, qui exigent sa clé privée.
- **Parcours séparés par élève** : on duplique une leçon, on ne mutualise pas.

## Le site est jetable, la base est cumulative

Chaque déploiement remplace le site entier ; une modification s'annule d'un push.
La base, elle, se modifie sur place avec son contenu dedans. Le test qui tranche :
**est-ce que ça doit exister demain, sur un autre appareil ?** Oui →
`supabase/schema.sql` d'abord, le site ensuite. Non → le site seul.
