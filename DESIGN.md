# Monde visuel — « Contemporain coréen »

Direction retenue par Jieun parmi trois propositions, à partir de la maquette
`1b Contemporain coréen`. Elle remplace intégralement la direction précédente
(papier hanji crème, serif, branche de cerisier), qui ne doit pas réapparaître.

Mode : **Operate**. L'élève vient accomplir une tâche. La lisibilité, la
constance et la clarté des états priment sur l'expression ; l'identité vit dans
la précision des détails, pas dans la décoration.

---

## Le parti pris

Grandes zones blanches, angles francs, sans-serif net, un vert profond qui porte
l'identité. Le motif floral coréen est réduit à **un signe géométrique** — six
cercles — utilisé comme marque et comme sceau de leçon, jamais comme décor.

Ce qui définit ce monde et ne se négocie pas :

- **Rayon de 2 px partout.** Le monde ne s'arrondit pas. Aucune carte à coins
  doux, aucune ombre portée décorative.
- **Le vert est fonctionnel**, pas ornemental : marque, bonne réponse, sélection
  courante, étiquettes de section. Jamais un aplat pour remplir.
- **Une seule famille de caractères** pour l'interface latine. Pas de couple
  titre/texte : l'échelle et la graisse suffisent.
- **Le hangul est toujours coloré en vert** dans la prose et les énoncés. C'est
  le repère qui sépare les deux écritures sans les cloisonner.

## Couleur

| Rôle | Valeur | Usage |
| --- | --- | --- |
| `--vert` | `#0f4d3f` | Marque, bonne réponse, hangul, étiquettes de section |
| `--vert-fonce` | `#0b3b30` | Texte sur fond vert clair |
| `--vert-cl` | `#dcece4` | Bonne réponse révélée, survols, fond du sceau |
| `--vert-pa` | `#9ec9b6` | Hangul et étiquettes sur fond sombre |
| `--corail` | `#e7625f` | Accent pur, **sans texte par-dessus** |
| `--corail-f` | `#c8443c` | Le même accent, assombri pour porter du blanc (4,83:1) |
| `--rouge` / `--rouge-b` / `--rouge-tx` | `#a8402c` `#c0432d` `#8a3323` | Réponse fausse : texte, filet, prose |
| `--rouge-cl` | `#fbe6df` | Fond de la réponse fausse |
| `--encre` | `#14110f` | Texte, blocs sombres, action primaire |
| `--gris` | `#6d6a64` | Texte secondaire — 4,98:1 sur `--doux` |
| `--fond` | `#e9e6e0` | Pourtour, hors de la page |
| `--doux` / `--doux2` | `#f7f6f3` `#f3f2ee` | Barre latérale et bloc du QCM / champs et cartes |
| `--ligne` | `#e2e0da` | Filets |
| `--surlig` | `#f7e9a3` | Surlignage de recherche |

Le corail sert deux fois seulement : la pastille de l'élève et rien d'autre.
S'il doit porter du texte, c'est `--corail-f`, jamais `--corail`.

## Typographie

Échelle **fixe en rem**, pas fluide : les utilisateurs sont sur des écrans
constants, et un titre qui rétrécit dans une colonne étroite est pire, pas mieux.

- Latin : **Archivo** (400/500/600/700), repli `Segoe UI`, système.
- Hangul : **Noto Sans KR** (400/500/700), repli `Malgun Gothic`, `Apple SD Gothic Neo`.
  Sans ce repli explicite, le navigateur substitue une police système au rendu
  discordant à côté d'Archivo — c'est le piège de ce projet bilingue.
- Prose : `1.0625rem`, interligne 1,7, mesure plafonnée à **66ch**.
- Titre de leçon : `2.875rem`, tombant à `2rem` sous 900 px.

## Composants et états

Chaque contrôle possède : défaut, survol, focus visible, désactivé.

**La réponse au QCM porte quatre états**, et c'est le cœur de l'interface :

| État | Traitement |
| --- | --- |
| Neutre | Fond `--doux` |
| Juste, l'élève avait bon | Vert plein, texte blanc, étiquette **JUSTE** |
| Bonne réponse révélée | `--vert-cl`, filet gauche vert, étiquette **BONNE RÉPONSE** |
| Le mauvais choix de l'élève | `--rouge-cl`, filet gauche rouge, étiquette **VOTRE RÉPONSE** |

Les étiquettes textuelles sont obligatoires : elles portent l'information pour
qui ne distingue pas les couleurs. Ne jamais les retirer au profit de la seule
teinte. Sous 560 px, l'étiquette passe **sous** le texte — sinon elle lui vole
sa largeur et la réponse se replie sur cinq lignes.

L'explication est un **bloc sombre** étiqueté `POURQUOI`, avec le hangul en
`--vert-pa`.

## Mouvement

Un seul moment animé : le bloc d'explication qui se découvre, 220 ms, sortie
exponentielle, opacité + translation + flou. Les transitions d'état tiennent en
160 ms. Rien d'autre ne bouge — l'élève est dans une tâche, pas au spectacle.
`prefers-reduced-motion` neutralise tout.

## Surfaces que le navigateur dessine

Elles appartiennent au monde et sont thématisées explicitement : sélection de
texte en vert, curseur de saisie vert, anneaux de focus verts — clairs sur les
fonds sombres —, ascenseurs en `--ombre` avec bordure blanche, chiffres tabulaires
sur les scores et les compteurs.

## Écrans étroits

La bascule est **structurelle**, pas typographique : l'en-tête s'empile, la barre
latérale passe au-dessus du contenu, la grille à deux colonnes des sections
devient une seule. Le corps du texte ne change pas de taille ; seuls les titres
descendent d'un cran.

## Interdits dans ce monde

- Coins arrondis au-delà de 2 px, ombres portées décoratives, verre et flou.
- Sur-titre au-dessus d'un titre : l'information de leçon et de date se place
  **sous** le titre, jamais au-dessus.
- Emoji ou glyphe Unicode en guise d'icône : les icônes sont des SVG dessinés,
  d'une seule graisse.
- Le corail derrière du texte blanc.
- Toute réapparition du monde précédent : serif, papier crème, céladon, cerisier.
