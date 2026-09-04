# Mise en ligne — ce que Pierre doit faire

Deux comptes à créer, et un dépôt à ouvrir sur celui que tu as déjà. Je ne peux
pas les créer à ta place : une inscription demande un mot de passe, et je n'en
manipule jamais. Compte 15 minutes en tout.

---

## 1. GitHub — le dépôt qui héberge le code

**Côté machine, tout est prêt.** Le projet est sous git depuis le 3 septembre
2026, avec un premier commit couvrant les 21 fichiers, et le dépôt vit hors
OneDrive : le dossier ne contient qu'un fichier `.git` de 41 octets, un renvoi
vers `C:\Projets\coreen-avec-jieun.git`.

**Ne relance jamais `git init` ici** — le montage est fait, le refaire casserait
ce renvoi. `git add`, `git commit` et `git push` s'utilisent normalement depuis
ce dossier.

L'adresse du dépôt distant est déjà enregistrée :
`https://github.com/Pierre88-dev/coreen-avec-jieun.git`. Il reste à créer le
dépôt lui-même, qui n'existe pas encore côté GitHub.

1. Sur **github.com**, connecte-toi avec le compte `Pierre88-dev`.
2. Bouton **New repository**. Nom : `coreen-avec-jieun`. Coche **Private**.
   **Ne coche ni README, ni .gitignore, ni licence** — le dossier a déjà son
   contenu, et une case cochée créerait un commit qui entrerait en conflit
   avec le tien.
3. Dans **ton propre terminal**, depuis le dossier du site :

   ```bash
   git push -u origin master
   ```

Ce premier push doit venir de toi : une fenêtre de connexion GitHub s'ouvre à
ce moment-là, et le shell d'agent ne peut pas l'afficher. Les suivants passeront
sans rien demander.

## 2. Cloudflare — l'hébergement

1. Sur **dash.cloudflare.com/sign-up**, crée un compte (email + mot de passe).
   Gratuit, aucune carte bancaire demandée.
2. Valide l'email de confirmation.
3. Dans le menu de gauche : **Workers & Pages** → **Create** → onglet **Pages**
   → **Connect to Git**.
4. Autorise Cloudflare à lire ton GitHub, puis choisis `coreen-avec-jieun`.
5. Écran de configuration — **c'est le seul endroit où on peut se tromper** :
   - Framework preset : **None**
   - Build command : **laisser vide**
   - Build output directory : **laisser vide** (ou `/`)

   Le site est en HTML simple, il n'y a rien à compiler.
6. **Save and Deploy**. Une minute plus tard tu as une adresse en `.pages.dev`.

Ensuite, chaque `git push` redéploie tout seul.

## 3. Supabase — la base de données

1. Sur **supabase.com**, **Start your project**. Tu peux te connecter avec
   ton compte GitHub, ça évite un mot de passe de plus.
2. **New project**. Nom : `coreen-avec-jieun`. Région : **Frankfurt** ou
   **Paris** (la plus proche). Note le mot de passe de la base dans ton
   gestionnaire : il ne sera plus jamais affiché, et il ne me sert pas.
3. Attends la fin de la création, environ deux minutes.
4. Menu de gauche : **SQL Editor** → **New query**. Ouvre le fichier
   `supabase/schema.sql` de ce dossier, colle **tout** son contenu, puis **Run**.
   Le message attendu est « Success. No rows returned ».
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

## Le piège à connaître : la mise en veille

Un projet Supabase gratuit **se met en pause après 7 jours sans activité**, et le
site se retrouve vide. Avec quelques QCM par mois, ça arrivera. On branchera un
réveil automatique tous les 3 jours — gratuit, réglé une fois.
