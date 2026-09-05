# Mise en ligne — ce que Pierre doit faire

**Les trois étapes de mise en ligne sont faites.** Cette page sert à
retrouver comment, et à refaire le chemin si un jour il faut repartir de zéro.

**Un réglage reste à ta main**, et le site te le dit lui-même tant qu'il n'est
pas fait : la clé d'API dans Cloudflare (§ 5).

---

## 1. GitHub — fait le 3 septembre 2026 ✅

Dépôt `Pierre88-dev/coreen-avec-jieun`, poussé, `origin` enregistré.

**Il est public**, contrairement à ce qui était écrit ici jusqu'au 5 septembre
2026 — vérifié ce jour-là sans être connecté, la page du dépôt répond à tout le
monde. Rien de secret ne s'y trouve : la clé Supabase du site est *publishable*
et finit de toute façon dans la page, les clés privées des élèves sont tirées
au sort dans la base et ne figurent dans aucun fichier, et la clé d'API Claude
vit dans Cloudflare (§ 5), jamais ici. Mais le schéma de la base et l'adresse
du projet Supabase sont, eux, lisibles par n'importe qui. Si tu préfères
fermer : page du dépôt → **Settings** → tout en bas, *Danger Zone* → **Change
repository visibility** → *Make private*. Le déploiement Cloudflare et le
réveil GitHub continuent de fonctionner sur un dépôt privé.
L'authentification GitHub est mémorisée sur la machine : **les push suivants
peuvent être lancés par l'agent**, plus aucune fenêtre de connexion.

Le dépôt vit hors OneDrive — le dossier ne contient qu'un fichier `.git` de
41 octets, un renvoi vers `C:\Projets\coreen-avec-jieun.git`. **Ne relance
jamais `git init` ici** : le montage est fait, le refaire casserait ce renvoi.
`git add`, `git commit`, `git push` s'utilisent normalement depuis ce dossier.

## 2. Cloudflare — fait le 3 septembre 2026 ✅

Le site est en ligne : **https://coreen-avec-jieun.pages.dev**

Projet Pages branché sur le dépôt GitHub, sans configuration de build. Chaque
`git push` redéploie tout seul, en moins d'une minute.

Deux choses à savoir si tu dois y retourner :

- **Le bouton « Create application » mène au mauvais produit.** Il ouvre le flux
  *Workers*, qui réclame un API token et ne convient pas à un site statique. Le
  flux *Pages* n'est plus dans les menus ; il s'atteint par l'URL directe
  `dash.cloudflare.com/d91e1bf665ad3d9b5c4c9748d71f2b51/workers-and-pages/create/pages`
  → **Import an existing Git repository**.
- Sur l'écran de configuration, seul le champ **Production branch** est vide et
  doit être rempli à `master`. Framework preset **None**, build command et build
  output directory **vides** : il n'y a rien à compiler.

## 3. Supabase — fait le 5 septembre 2026 ✅

Projet `gatxsrpwskdbsrulqdon`, région West EU (Paris), plan gratuit. Les deux
valeurs sont dans `assets/config.js` et le site est passé en mode partagé.
À la création, garder cochées les deux premières cases de sécurité : le schéma
ne pose aucun `grant` explicite, il compte sur *Automatically expose new
tables*. RLS est activé table par table dans le fichier, la troisième case est
donc inutile.

1. Sur **supabase.com**, **Start your project**. Tu peux te connecter avec
   ton compte GitHub, ça évite un mot de passe de plus.
2. **New project**. Nom : `coreen-avec-jieun`. Région : **Frankfurt** ou
   **Paris** (la plus proche). Note le mot de passe de la base dans ton
   gestionnaire : il ne sera plus jamais affiché, et il ne me sert pas.
3. Attends la fin de la création, environ deux minutes.
4. Menu de gauche : **SQL Editor** → **New query**. Ouvre le fichier
   **`supabase/schema-a-coller.sql`** de ce dossier, colle **tout** son contenu,
   puis **Run**. Le message attendu est « Success. No rows returned ».

   **Pas `schema.sql`.** Constaté le 5 septembre 2026 : l'éditeur SQL de
   Supabase échoue sur la version commentée avec `syntax error at end of input`
   en LINE 0, sans rien créer. Ses apostrophes françaises (`l'élève`,
   `n'existe`) passent pour des ouvertures de chaîne dans son découpeur
   d'instructions, qui avale alors tout le fichier. `schema-a-coller.sql` est
   le même SQL sans les commentaires ; `sans-commentaires.py` le régénère
   depuis la source :

   ```
   python supabase/sans-commentaires.py supabase/schema.sql supabase/schema-a-coller.sql
   ```

   Autre détail qui a coûté du temps : rien de ce que l'agent affiche dans la
   conversation ne doit être copié — ses blocs de commande s'exécutent tout
   seuls. Le plus sûr est d'ouvrir le fichier dans le Bloc-notes et d'y faire
   Ctrl+A / Ctrl+C.
5. Menu de gauche : **Authentication** → **Users** → **Add user** →
   *Create new user*. Email : l'adresse Naver de Jieun — tu l'as dans tes
   contacts, elle n'a pas sa place dans un historique git qui ne s'efface pas.
   Choisis-lui un mot de passe et transmets-le-lui directement — pas par ici.

### Les deux valeurs à me donner

Bouton **Connect** en haut du tableau de bord, ou menu de gauche
**Project Settings** → **API Keys**. J'ai besoin de :

- **Project URL** — de la forme `https://xxxxxxxxxxxx.supabase.co`
- la **clé publishable** — une chaîne courte commençant par `sb_publishable_`

Si tu ne vois qu'une longue chaîne commençant par `eyJ`, c'est l'ancienne clé,
appelée **anon** : elle marche encore, mais Supabase l'abandonne fin 2026.
Dis-le-moi, on partira sur la nouvelle.

Ces deux valeurs sont **publiques par nature** : elles finiront dans le code de
la page, visibles par n'importe quel visiteur. C'est prévu — le schéma ferme
toutes les tables et ne laisse passer que deux fonctions, qui exigent la clé
privée de l'élève.

**En revanche, ne me donne jamais une clé « secret »** (`sb_secret_…`, ou
l'ancienne `service_role`) du même écran. Celles-là contournent toutes les
protections. Si tu en colles une quelque part par erreur, révoque-la depuis cet
écran et crées-en une autre.

---

## 4. Le dépôt de fichiers — fait le 5 septembre 2026 ✅

Jusqu'ici, joindre un document à une leçon voulait dire **taper son chemin à la
main**. Pour téléverser un PDF depuis l'ordinateur, il faut un bucket Supabase
Storage, et `schema.sql` sait maintenant le créer.

C'est **le même geste que l'étape 3** : **SQL Editor** → **New query** →
coller tout `supabase/schema-a-coller.sql` → **Run**. Le fichier est rejouable :
le repasser en entier ne détruit rien, il ajoute simplement ce qui manque.
Message attendu : « Success. No rows returned ».

Pour vérifier : menu de gauche → **Storage**. Un bucket **documents** doit
apparaître, marqué *Public*.

Vérifié le 5 septembre 2026, une fois le SQL passé : le bucket existe, un
anonyme peut lire un fichier dont il connaît l'adresse mais **ne peut ni en
déposer un, ni créer de bucket** — les deux tentatives sont refusées par la
*row-level security*. Un fichier hors de la liste de types est refusé lui aussi.

Piège rencontré ce jour-là : l'onglet SQL de Supabase **garde l'ancienne
requête et son ancien « Success »**. Voir ce message ne prouve donc rien —
c'est le `+` (New query) qu'il faut, puis coller, puis Run.

Trois choses que ce SQL décide, et qu'il vaut mieux savoir :

- **Le bucket est public en lecture.** Ce n'est pas un oubli : l'élève ouvre son
  PDF sans compte, et l'API Claude va chercher le fichier elle-même par son
  adresse. Ce qui protège un document, c'est donc son adresse — chaque fichier
  est rangé sous un identifiant tiré au sort, comme la clé privée d'un élève.
  **Un document vraiment confidentiel n'a rien à faire là.**
- **Personne ne peut lister le bucket** sans être connecté : deviner une adresse
  reste la seule voie, et elle est impraticable.
- **32 Mo par fichier**, qui est exactement la limite d'un envoi à l'API. Mieux
  vaut un refus au téléversement, quand tu as le fichier sous la main, qu'une
  erreur au moment de générer.

## 5. La clé d'API Claude — à faire

Le bouton **« Générer le QCM »** appelle l'API Claude. La clé est payante à
l'usage : elle ne peut vivre ni dans la page, ni dans le dépôt, qui est servi
publiquement. Elle vit dans **Cloudflare**, et seule la fonction serveur
`functions/api/qcm.js` la voit.

**Tant que ces variables ne sont pas réglées, le bouton répond par une phrase
qui dit exactement ce qui manque.** Rien ne casse ; la génération est
simplement indisponible.

1. **La clé** — sur `console.anthropic.com` → **API keys** → *Create key*. Elle
   commence par `sk-ant-`. Elle ne s'affiche **qu'une fois**, range-la dans ton
   gestionnaire de mots de passe au moment où tu la vois.
2. **Le crédit** — même console, **Billing**. Sans crédit, l'API refuse et le
   site te le dira en toutes lettres. Quelques euros couvrent des dizaines de
   QCM.
3. **Dans Cloudflare** — `dash.cloudflare.com` → **Workers & Pages** →
   `coreen-avec-jieun` → **Settings** → **Variables and Secrets** →
   *Add variable*, pour l'environnement **Production** :

   | Nom | Type | Valeur |
   | --- | --- | --- |
   | `CLE_API_CLAUDE` | **Secret** | la clé `sk-ant-…` |
   | `EMAILS_PROF` | Texte | l'adresse Naver de Jieun. Plusieurs adresses se séparent par une virgule |

   `CLE_API_CLAUDE` en **Secret**, pas en texte : une fois enregistrée elle
   n'est plus réaffichée, y compris pour toi.

4. **Redéploie.** Une variable ajoutée ne s'applique pas au déploiement en
   cours : onglet **Deployments** → sur le dernier, *Retry deployment*. Un
   `git push` fait la même chose.

`EMAILS_PROF` est ce qui empêche n'importe qui de faire tourner ta facture : la
fonction demande à Supabase à qui appartient la session, et refuse toute
adresse absente de cette liste. **Laissée vide, personne ne génère** — une
variable oubliée doit bloquer, pas ouvrir la porte.

### Ce que ça coûte

L'espace professeur annonce une estimation **avant** de lancer, à partir du
nombre de pages du PDF, puis le **coût réel** rendu par l'API une fois les
questions écrites. Chaque appel est aussi rangé dans la table `generations` :
modèle, tokens, coût. Aucune facture ne devrait donc être une surprise.

Ordre de grandeur avec **Opus 5** : environ **26 centimes de dollar** pour un
QCM de 12 questions sur un document de 12 pages. **Sonnet 5** coûte 2,5 fois
moins. Le choix est dans un menu à côté du bouton, à chaque génération — c'est
Jieun qui tranchera, elle seule sait si une question sur les 받침 est juste.

---

## La mise en veille — réglée le 5 septembre 2026 ✅

Un projet Supabase gratuit **se met en pause après 7 jours sans activité**, et le
site se retrouve vide. Avec quelques QCM par mois, ça arriverait.

`.github/workflows/reveil-supabase.yml` appelle la base **une fois par jour**,
à 05:17 UTC, avec la clé publishable. GitHub Actions, gratuit, rien à
surveiller. Sept appels d'avance sur l'échéance : une exécution retardée ou
sautée un jour de forte charge ne change rien.

Deux choses à savoir :

- Ce réveil **empêche** la mise en pause, il ne la **répare** pas. Une base déjà
  endormie se relance à la main depuis le tableau de bord Supabase.
- GitHub **suspend les workflows programmés** dans un dépôt sans activité
  pendant 60 jours. Il prévient par mail avant, et un bouton les réactive.
  Un simple `git push` remet le compteur à zéro.

Pour le déclencher à la main : onglet **Actions** du dépôt → **Réveil
Supabase** → **Run workflow**.
