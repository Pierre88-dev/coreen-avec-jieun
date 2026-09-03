# Brief design — « Coréen avec Jieun »

Site de leçons et de QCM pour un cours particulier de coréen.
Ce document est autonome : il ne suppose aucune connaissance préalable du projet.

---

## 1. Le projet en trois lignes

Jieun, professeure coréenne, donne des cours particuliers à deux élèves français.
Après chaque cours elle publie un récapitulatif de la leçon, des documents joints
et un QCM autocorrigé. Chaque élève a sa propre adresse et son propre parcours.

Ce n'est pas une plateforme d'e-learning. C'est un site intime, pour trois personnes.
Le ton visuel doit refléter ça : soigné et personnel, pas institutionnel ni « SaaS ».

## 2. Les personnes

| Qui | Ce qu'elle ou il fait | Sur quoi |
| --- | --- | --- |
| **Marie**, élève débutante | Lit le récap, télécharge les fiches, fait le QCM | Ordinateur surtout |
| **Brooklyn**, élève débutant | Idem, parcours totalement séparé de Marie | Ordinateur surtout |
| **Jieun**, la professeure | Écrit les récaps, dépose des PDF, publie les QCM, consulte les résultats | Ordinateur |

Les deux élèves en sont au tout début : ils apprennent l'alphabet.
Les contenus mêlent donc **français et hangul** en permanence, souvent dans la même
phrase. La cohabitation des deux écritures est un vrai sujet typographique.

## 3. Décisions déjà prises — à ne pas rouvrir

- **Thème clair.** Explicitement demandé. Pas de mode sombre.
- **Motif coréen : fleurs et arbre typique.** Explicitement demandé.
  L'interprétation actuelle est cerisier + pin.
- **Ordinateur d'abord.** Le mobile doit rester correct, mais l'écran large est
  la cible : on peut se permettre une barre latérale et deux colonnes.
- **Aucune ressource externe.** Ni photo, ni illustration importée, ni CDN.
  Tout ornement doit être dessinable en **SVG inline**. Les polices Google sont
  la seule exception tolérée.
- **Français partout**, y compris l'espace professeur.
- **QCM à quatre choix uniquement.** Pas d'autres types de questions.

## 4. La question ouverte — le seul vrai arbitrage

Le design actuel assume un **registre traditionnel** : serif, papier hanji crème,
encre, céladon, cerisier dessiné à la main. C'est une lecture possible de
« fleurs et arbre coréen », mais ce n'est pas la seule.

**Merci de proposer deux ou trois directions distinctes**, dont au moins une qui
s'éloigne franchement de l'actuelle. Par exemple :

1. **Traditionnel lettré** — papier, encre, serif, motif floral dessiné au trait.
   (la direction actuelle)
2. **Contemporain coréen** — sans-serif net, grandes zones blanches, aplats de
   couleur, le motif floral réduit à un signe graphique très épuré.
3. **Carnet d'étude** — repères de cahier, annotations, tampons, quelque chose de
   plus manuscrit et chaleureux.

L'écueil à éviter : un « dashboard SaaS moderne » générique, où le coréen ne serait
plus qu'un accent décoratif. L'identité coréenne doit rester structurante.

## 5. Les écrans à dessiner

### 5.1 Espace élève — **l'écran principal, à traiter en priorité**

Structure actuelle : en-tête, barre latérale à gauche, contenu à droite.

**En-tête** — logo (un sceau carré contenant 한) + « Coréen avec Jieun » + sa
translittération 한국어 공부, un champ de recherche, le prénom de l'élève connecté.

**Barre latérale** — deux listes :
- *Mes leçons* : titre, date, et une pastille de score (« 9/12 ») quand la leçon
  est terminée. L'élément actif est distingué.
- *Fiches de référence* : documents permanents, avec une étiquette de type.

**Contenu, carte 1 — la leçon** : titre, date, section « Ce qu'on a vu » avec un
récapitulatif en texte libre de 10 à 20 lignes (paragraphes et listes numérotées),
puis « À garder sous la main » avec les documents joints (PDF, fiches HTML).

**Contenu, carte 2 — le QCM** : un sélecteur à deux positions
*Entraînement / Test*, une ligne d'explication du mode, puis 12 questions.
Chaque question : un numéro, un énoncé pouvant contenir du hangul en gros,
quatre boutons de réponse pleine largeur étiquetés A à D.

**Les états d'une réponse — le point le plus important à dessiner :**
- neutre (pas encore répondu)
- sélectionnée mais pas encore corrigée (mode Test)
- juste
- fausse
- la bonne réponse révélée alors que l'élève avait répondu autre chose
- le bloc d'explication qui apparaît sous la question corrigée

**Pied du QCM** : soit une progression (« 5 réponses sur 12 »), soit un bouton
*Corriger*, soit le score final avec un bouton *Recommencer*.

**Recherche** : liste de résultats sous le champ (titre + extrait avec le mot en
gras), puis dans la page un **bandeau** annonçant « « batchim » — 2 occurrences »
avec un bouton *Effacer*, et le mot **surligné** dans tout le contenu.

**États vides à prévoir** : aucune leçon publiée, aucun résultat de recherche,
adresse d'élève inconnue.

### 5.2 Accueil

Page de réception : le nom du site, et une porte d'entrée par élève (initiale,
prénom, prénom en hangul). Un lien discret vers l'espace professeur.

*Note : cette page pourrait disparaître si chaque élève reçoit une adresse
privée. À traiter comme secondaire.*

### 5.3 Espace professeur — **pas encore construit, tout est à inventer**

- **Connexion** : email + mot de passe, une seule personne.
- **Tableau de bord** : les élèves, leurs dernières leçons, leurs scores.
- **Éditeur de leçon** : choix de l'élève, titre, date, un grand champ de texte
  libre pour le récapitulatif, dépôt de fichiers par glisser-déposer,
  puis le QCM.
- **Le QCM côté prof** : les questions arrivent **en brouillon**, générées par IA
  à partir du récapitulatif. Elle les relit, corrige, supprime, puis publie.
  Il faut donc distinguer visuellement **brouillon / publié**, et rendre
  l'édition d'une question confortable (énoncé, 4 réponses, désignation de la
  bonne, explication).
- Un bouton *Générer le QCM* avec son état d'attente.

## 6. Contraintes techniques — importantes pour le design

Le site est en **HTML, CSS et JavaScript simples**. Pas de React, pas de Tailwind,
pas d'étape de compilation : le propriétaire n'a pas les droits administrateur sur
sa machine et ne peut installer ni Node ni npm. La maquette doit donc être
**portable en CSS écrit à la main**, avec des variables de couleur.

Éviter : les effets qui exigent une bibliothèque, les grilles trop complexes,
les animations élaborées, les dégradés impossibles à reproduire proprement.

Rechercher au contraire : une palette claire, une échelle typographique nette,
des règles d'espacement simples et des composants réutilisables.

**Le hangul** doit rester lisible et élégant à côté du français. C'est un vrai
point d'attention : beaucoup de polices latines n'ont pas de glyphes coréens et
laissent le navigateur substituer une police système au rendu discordant.

## 7. La palette actuelle, pour information

À conserver, faire évoluer ou remplacer selon la direction proposée.

```
papier         #fbf8f2   fond général, façon papier hanji
cartes         #ffffff
zones creuses  #f4efe5
filets         #e4dccd
encre          #2c2823   texte principal
encre pâle     #6f665c   texte secondaire
céladon        #5d8b7d   accents, le pin
fleur          #c9737f   cerisier, élément actif
ocre           #a9702f   titres de section
hangul         #2f4858   les caractères coréens
juste          #3d7f5e
faux           #b8483a
surlignage     #fdefb8
```

Typographie actuelle : une serif ancienne (Iowan Old Style, Palatino, Georgia)
pour tout le texte. Ornements : une branche de cerisier en fleurs dans l'en-tête
et un pin stylisé en pied de page, tous deux dessinés en SVG au trait.

## 8. Ce qu'on attend en retour

1. **Deux ou trois directions visuelles distinctes**, sur l'écran élève complet.
2. Une fois une direction retenue, **le détail des états du QCM** — c'est là que
   se joue l'essentiel de l'expérience.
3. Les écrans de l'**espace professeur**, en particulier l'éditeur de leçon et la
   relecture des questions générées.
4. Une **palette et une échelle typographique** exploitables telles quelles en CSS.

Priorité : l'écran élève d'abord, l'espace professeur ensuite.
