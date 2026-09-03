# Coréen avec Jieun

Site de leçons et de QCM pour les cours particuliers de Jieun.
Deux élèves aujourd'hui, **Marie** et **Brooklyn**, chacun son parcours.

HTML, CSS et JavaScript simples. Pas de framework, pas de compilation, pas de
npm : la machine de Pierre n'a ni Node ni droits administrateur, et le projet
est fait pour rester ouvrable dans un éditeur de texte.

## Essayer le site

Double-clique sur **`demarrer.cmd`**. Un serveur local démarre et la *salle
d'essai* s'ouvre : de là, un lien vers l'espace de Jieun et un vers celui de
chaque élève. Ferme la fenêtre noire pour arrêter.

Le bouton « Recharger la démonstration » installe un mois de cours fictif —
sept leçons, deux brouillons, des passages déjà notés — pour juger l'usage sur
autre chose qu'une leçon isolée.

`essai.html` se ferme d'elle-même dès que le site est relié à Supabase : elle
afficherait sinon les liens privés des élèves.

## Les deux modes

Tant que `assets/config.js` est vide, **tout tourne en mode local** : les leçons
écrites dans l'espace professeur vivent dans le navigateur, et l'espace élève
les lit au même endroit. Tout est utilisable, rien n'est partagé entre appareils.

Dès que les deux valeurs Supabase y sont collées, le site bascule seul.
Aucun autre fichier ne change — c'est tout l'intérêt de `assets/base.js`.

## Les fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | Accueil neutre. Ne liste aucun élève, volontairement |
| `eleve.html` | Espace élève, ouvert par `?e=<clé privée>` |
| `prof.html` | Espace de Jieun : rédiger, composer le QCM, publier, voir les résultats |
| `essai.html` | Salle d'essai. Locale seulement |
| `assets/base.js` | **La couche de données.** Supabase si configuré, navigateur sinon |
| `assets/config.js` | Les deux valeurs Supabase. Vides = mode local |
| `assets/eleve.js` | Liste, moteur de QCM, recherche et surlignage |
| `assets/prof.js` | L'atelier de rédaction |
| `assets/data-local.js` | Contenu de démarrage du mode local. **Clés de démo uniquement** |
| `assets/demo.js` | Le mois de cours fictif |
| `assets/style.css` | Toute la mise en forme |
| `supabase/schema.sql` | Le schéma à coller dans Supabase |
| `DESIGN.md` | Le monde visuel. **À lire avant toute retouche d'interface** |
| `MISE-EN-LIGNE.md` | Les comptes à créer, pas à pas |

## Ce qui marche

- Leçons datées par élève, avec récapitulatif en texte libre et documents joints
- QCM à quatre choix, **entraînement** (correction immédiate) ou **test**
  (correction groupée), au choix de l'élève
- Cinq états distincts pour une réponse, explication du *pourquoi*, score,
  reprise possible
- **Recherche** dans ses propres leçons, surlignage dans la page. Insensible
  aux accents et à la casse, fonctionne en hangul
- Espace professeur complet : brouillon / publié, consigne prête à coller dans
  Claude, relecture du QCM collé, édition question par question
- **Tableau de bord** des passages, par élève

## Le cloisonnement des élèves

Chaque adresse porte une **clé imprévisible**, pas un prénom. La liste, la
recherche et les résultats sont filtrés sur le seul élève de l'adresse ouverte,
et le logo ramène chez soi.

Ces clés sont **tirées au sort dans la base**, au moment où le schéma est joué.
Elles ne figurent dans aucun fichier du dépôt — sans quoi il suffirait de lire
le code du site pour les récupérer. Jieun les copie depuis son espace.

Les clés de `data-local.js` (`marie-demo`) sont volontairement devinables :
ce fichier est servi publiquement et ne doit jamais rien contenir de sensible.

## Ce qui reste à faire

1. **Dépôt de fichiers** — un document se déclare encore par son chemin ;
   téléverser un PDF depuis l'ordinateur demande Supabase Storage.
2. **Bouton « Générer le QCM »** — en attendant, l'espace professeur donne la
   consigne toute prête et relit la réponse. Il faudra une clé d'API et une
   fonction serveur : la clé ne peut pas vivre dans la page.
3. **Réveil automatique de Supabase** — sans lui, le projet gratuit se met en
   pause après 7 jours d'inactivité et le site se retrouve vide.

## Git : le dépôt ne doit pas vivre dans OneDrive

Ce dossier de travail est **dans OneDrive**, et OneDrive corrompt les dépôts
git : conflits sur `.git/index`, fichiers « copie en conflit » au milieu des
objets, et fichiers rendus « à la demande » que git ne peut plus lire.

La solution n'est pas de renoncer à git, ni de déplacer le projet. C'est de
**séparer les deux** : les fichiers de travail restent ici, la base git vit
ailleurs. Une seule commande, à lancer une fois :

```bash
git init --separate-git-dir "C:\Projets\coreen-avec-jieun.git" .
```

Le dossier reçoit alors un fichier `.git` de **36 octets** — un simple renvoi,
qu'OneDrive synchronise sans risque — pendant que le dépôt lui-même s'installe
dans `C:\Projets\coreen-avec-jieun.git`, hors de portée de la synchronisation.

Ensuite, tout se passe normalement depuis ce dossier : `git add`, `git commit`,
`git push`, sans rien changer à tes habitudes. Vérifié : commit, historique et
suivi des fichiers fonctionnent.

Deux conséquences à connaître :

- **Le dépôt n'est pas sauvegardé par OneDrive**, seulement les fichiers de
  travail. C'est GitHub qui sauvegardera l'historique.
- Le premier `git push` doit être lancé par Pierre dans **son propre terminal** :
  une fenêtre de connexion GitHub s'ouvre, et le shell d'agent ne peut pas
  l'afficher.

## Mise en ligne

Cloudflare Pages, branché sur un dépôt GitHub privé. Aucune configuration de
build : site statique, publié tel quel. Voir `MISE-EN-LIGNE.md`.
