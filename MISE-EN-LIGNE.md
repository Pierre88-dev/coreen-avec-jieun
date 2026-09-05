# Mise en ligne — ce que Pierre doit faire

**Les trois étapes sont faites.** Cette page ne sert plus qu'à retrouver
comment, et à refaire le chemin si un jour il faut repartir de zéro.

---

## 1. GitHub — fait le 3 septembre 2026 ✅

Dépôt privé `Pierre88-dev/coreen-avec-jieun`, poussé, `origin` enregistré.
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
