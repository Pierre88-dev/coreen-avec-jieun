# Mise en ligne — ce que Pierre doit faire

Trois comptes à créer. Je ne peux pas les créer à ta place : une inscription
demande un mot de passe, et je n'en manipule jamais. Compte 15 minutes en tout.

---

## 1. GitHub — le dépôt qui héberge le code

**Le projet n'est plus sous git.** Il l'était à son ancien emplacement ; en le
déplaçant dans OneDrive, le dossier `.git` n'a pas été recopié — c'est la seule
chose qu'OneDrive corrompt vraiment. Il n'y avait aucun commit, donc rien de perdu.

Première étape, à lancer **une fois**, depuis le dossier du projet. Elle garde les
fichiers ici et installe la base git ailleurs, hors de portée de la synchronisation :

```bash
git init --separate-git-dir "C:\Projets\coreen-avec-jieun.git" .
```

Le dossier ne reçoit alors qu'un fichier `.git` de 36 octets — un simple renvoi,
qu'OneDrive synchronise sans risque. Ensuite `git add`, `git commit` et
`git push` s'utilisent normalement depuis ici, sans rien changer à tes habitudes.

1. Sur **github.com**, connecte-toi avec ton compte habituel.
2. Bouton **New repository**. Nom : `coreen-avec-jieun`. Coche **Private**.
   **Ne coche ni README, ni .gitignore, ni licence** — le dossier a déjà son contenu.
3. Copie l'adresse proposée, de la forme
   `https://github.com/<ton-compte>/coreen-avec-jieun.git`.

Dis-le-moi et je prépare le premier commit. Le tout premier `git push` devra
être lancé par toi dans ton propre terminal : une fenêtre de connexion GitHub
s'ouvre, et mon shell ne peut pas l'afficher.

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
   *Create new user*. Email : celui de Jieun (`jieun_kim920@naver.com`).
   Choisis-lui un mot de passe et transmets-le-lui directement — pas par ici.

### Les deux valeurs à me donner

Menu de gauche : **Project Settings** → **API**. J'ai besoin de :

- **Project URL** — de la forme `https://xxxxxxxxxxxx.supabase.co`
- **anon public** — une longue chaîne commençant par `eyJ...`

Ces deux valeurs sont **publiques par nature** : elles finiront dans le code de
la page, visibles par n'importe quel visiteur. C'est prévu — le schéma ferme
toutes les tables et ne laisse passer que deux fonctions, qui exigent la clé
privée de l'élève.

**En revanche, ne me donne jamais la clé `service_role`** de la même page. Celle-là
contourne toutes les protections. Si tu la colles quelque part par erreur,
régénère-la depuis cet écran.

---

## Le piège à connaître : la mise en veille

Un projet Supabase gratuit **se met en pause après 7 jours sans activité**, et le
site se retrouve vide. Avec quelques QCM par mois, ça arrivera. On branchera un
réveil automatique tous les 3 jours — gratuit, réglé une fois.
