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

Le site est **en mode partagé depuis le 5 septembre 2026** : `assets/config.js`
porte l'URL et la clé publishable du projet Supabase `gatxsrpwskdbsrulqdon`, et
`assets/base.js` a basculé seul, sans qu'aucun autre fichier ne change.

Le mode local existe toujours : vider les deux valeurs de `config.js` y ramène
le site entier, leçons dans le navigateur, rien de partagé. C'est le filet pour
essayer une idée sans toucher à la base.

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
| `functions/api/qcm.js` | **La fonction serveur.** Détient la clé d'API Claude, vérifie que l'appelant est Jieun, lit les PDF |
| `supabase/schema.sql` | Le schéma, commenté. **La référence, celle qu'on modifie** |
| `supabase/schema-a-coller.sql` | Le même sans commentaires. **C'est celui-ci qui va dans l'éditeur Supabase** |
| `supabase/sans-commentaires.py` | Régénère le second depuis le premier |
| `DESIGN.md` | Le monde visuel. **À lire avant toute retouche d'interface** |
| `MISE-EN-LIGNE.md` | Les comptes à créer, pas à pas |

## Ce qui marche

- Leçons datées par élève, avec récapitulatif en texte libre et documents joints
- QCM à quatre choix, en **entraînement** : la correction et le *pourquoi*
  s'affichent dès que l'élève répond
- Quatre états distincts pour une réponse, explication du *pourquoi*, score,
  reprise possible
- **Recherche** dans ses propres leçons, surlignage dans la page. Insensible
  aux accents et à la casse, fonctionne en hangul
- **Téléversement des PDF** depuis l'ordinateur, dans Supabase Storage. Le
  nombre de pages et le poids sont relevés au dépôt : c'est ce qui permet
  d'annoncer le coût d'une génération avant de la lancer
- **Bouton « Générer le QCM »** : l'API Claude lit le PDF de la leçon et rend
  les questions. Choix du modèle à chaque fois, coût réel affiché après,
  chaque appel tracé dans la table `generations`
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

## La base : trois principes gravés dans le schéma

`supabase/schema.sql` n'est pas qu'une liste de tables. Trois choix y sont
délibérés, et les défaire aurait des conséquences que le code ne montre pas.

**Un passage est autonome.** Quand un élève termine, la base range dans son
résultat l'intitulé de la leçon *et* une photographie des questions telles
qu'elles étaient ce jour-là. Corriger la leçon ensuite ne rend plus son score
faux ; la supprimer ne l'efface plus. C'est ce qui rend l'historique digne de
confiance des années plus tard.

**Le score est calculé par la base, pas par le navigateur.** Le site n'envoie
que les choix de l'élève ; `enregistrer_reponse` relit les bonnes réponses et
compte. Rien de ce qui sera archivé ne dépend de ce qu'un navigateur affirme.

**L'élève ne touche jamais une table.** Row Level Security ferme tout ; il ne
dispose que de quatre fonctions, chacune exigeant sa clé privée : lire son
espace, déposer un passage, ranger une progression en cours, poser une question.
Toute nouveauté côté élève passe par une cinquième fonction, jamais par un accès
direct.

Le schéma prévoit aussi ce que le site ne sait pas encore faire : tests groupés,
boîte à questions, reprise sur un autre appareil, trace des coûts d'API. Ces
tables resteront vides jusqu'à ce que le site s'y branche — c'était le moment de
les écrire, avant que la base ne contienne de vraies leçons.

## Ce qui reste à faire

L'ordre n'est pas négociable : chaque étape a besoin de la précédente. Les
lignes barrées sont faites ; celles qui restent gardent leur numéro pour que
les renvois d'un fichier à l'autre ne se décalent pas.

1. ~~**Le projet Supabase**~~ — fait le 5 septembre 2026. Projet
   `gatxsrpwskdbsrulqdon`, dix tables, quatre fonctions, RLS partout. Le site
   public lit la base.
2. ~~**Dépôt de fichiers**~~ — fait le 5 septembre 2026. Bucket Supabase
   Storage `documents`, créé par `schema.sql` et non à la main : une base se
   rejoue, un clic ne se rejoue pas. Public en lecture, chemins tirés au sort,
   32 Mo par fichier. Le nombre de pages est compté au dépôt par pdf.js, chargé
   à la demande — s'il échoue, le fichier passe quand même, seule l'estimation
   de coût s'en trouve privée.

   Le SQL a été joué le 5 septembre 2026 : le bucket existe, et un anonyme ne
   peut ni y déposer un fichier ni créer de bucket.

3. ~~**Bouton « Générer le QCM »**~~ — fait le 5 septembre 2026, et il vient
   bien **du PDF de la leçon**, pas du récapitulatif. Le récap garde son rôle :
   dire sur quoi porter les questions, avec le champ « Sur quoi porte le QCM ? ».

   Comment ça tient debout :

   - La clé d'API vit en **variable d'environnement Cloudflare**, lue par
     `functions/api/qcm.js`. Jamais dans la page, jamais dans le dépôt.
   - Cette fonction **vérifie qui appelle** : elle présente le jeton de session
     à Supabase, qui dit à qui il appartient, et refuse toute adresse absente de
     `EMAILS_PROF`. Vide, cette liste bloque tout le monde — une variable
     oubliée doit fermer la porte, pas l'ouvrir.
   - Elle **n'accepte que les adresses du bucket** de ce projet. Sans ce
     garde-fou, ce serait une machine à faire lire n'importe quelle page du web
     par l'API, aux frais de Pierre.
   - L'API va chercher les PDF **elle-même**, par leur adresse. Le fichier ne
     transite donc pas par la fonction, qui reste minuscule et rapide.
   - **Jieun n'a besoin d'aucun compte Claude.** C'est le site qui appelle
     l'API, sur le compte de Pierre.

   Le copier-coller reste en second rang, sous un filet : c'est le filet quand
   la génération échoue, ou quand le site tourne en mode local.

   **Le modèle n'est toujours pas tranché, et c'est volontaire** : le menu
   propose Opus 5 (défaut) et Sonnet 5 à chaque génération. On fera le même QCM
   avec les deux sur une vraie leçon, et **Jieun jugera** — elle seule sait si
   une question sur les 받침 est juste.

   Coûts, mesurés par l'estimation du site : **environ 26 centimes de dollar**
   pour 12 questions sur 12 pages avec Opus 5, 10 avec Sonnet 5. Le coût réel
   revient de l'API après chaque appel, s'affiche, et va dans `generations`.

   La clé est en place depuis le 5 septembre 2026. Reste l'essai de bout en
   bout, qui demande Jieun : téléverser un vrai PDF et générer un vrai QCM.

4. **Les tests groupés** — un QCM de 10 à 100 questions portant sur plusieurs
   leçons, généré depuis leurs PDF. Le schéma les prévoit (tables `tests`,
   `tests_lecons`), le site ne les affiche pas encore.
5. **La boîte à questions** — un encart en bas de la leçon où l'élève dépose ce
   qu'il n'a pas compris. Jieun lit et répond **au cours suivant** : pas de
   réponse écrite, donc pas de messagerie ni d'attente déçue. Il lui faudra un
   compteur de messages non lus, sinon la boîte deviendra une boîte morte.
6. **La reprise d'un parcours sur un autre appareil** — table `progressions`,
   prévue au schéma. Indispensable au-delà de trente questions.
7. **Régénérer le lien d'un élève** — les clés sont solides, mais un lien se
   transfère. Aucun bouton ne permet aujourd'hui d'en redonner un neuf.
8. **Dupliquer une leçon d'un élève à l'autre** — ne touche pas la base : les
   deux leçons pointent vers le même PDF, stocké une seule fois. La copie arrive
   en brouillon, QCM compris.
9. ~~**Réveil automatique de Supabase**~~ — fait le 5 septembre 2026.
   `.github/workflows/reveil-supabase.yml` appelle la base une fois par jour ;
   le premier déclenchement à la main a répondu HTTP 200. Il **empêche** la
   mise en pause, il ne la répare pas.

## Git : le projet ne vit pas dans OneDrive

OneDrive corrompt les dépôts git — conflits sur `.git/index`, fichiers « copie
en conflit » au milieu des objets, fichiers rendus « à la demande » que git ne
peut plus lire. Le projet a longtemps contourné le problème par un montage
`git init --separate-git-dir` : fichiers de travail dans OneDrive, base git
dans `C:\Projets`, les deux reliés par un fichier `.git` de 41 octets.

**Depuis le 5 septembre 2026, ce montage n'existe plus.** Le projet entier vit
dans `C:\Projets\coreen-avec-jieun`, un dossier ordinaire avec un `.git`
ordinaire dedans. `git add`, `git commit`, `git push` s'utilisent normalement,
et il n'y a plus aucune règle particulière à retenir.

Ce que ça change : **OneDrive ne sauvegarde plus rien de ce projet**. C'est
GitHub qui le sauvegarde — et lui, contrairement à OneDrive, sauvegarde aussi
l'historique.

## Mise en ligne

Cloudflare Pages, branché sur le dépôt GitHub, qui est **public**. Aucune
configuration de build : site statique, publié tel quel. Rien de secret ne se
trouve dans le dépôt — mais le schéma de la base y est lisible par tous. Voir
`MISE-EN-LIGNE.md`.
