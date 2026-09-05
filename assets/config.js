/* Configuration du site.

   Tant que ces deux valeurs sont vides, tout le site tourne en MODE LOCAL :
   les leçons vivent dans le navigateur, rien n'est partagé, mais l'interface
   fonctionne entièrement. C'est fait pour essayer avant de brancher quoi que
   ce soit.

   Pour passer en mode partagé, colle ici les deux valeurs de
   Supabase > Project Settings > API Keys. Elles sont publiques : elles
   finissent dans la page, c'est prévu et sans danger — le schéma ferme toutes
   les tables et n'expose que deux fonctions.

   SUPABASE_CLE attend la clé « publishable », qui commence par
   `sb_publishable_`. L'ancienne clé « anon », une longue chaîne commençant par
   `eyJ`, fonctionne encore mais Supabase l'abandonne fin 2026.

   N'y colle JAMAIS une clé « secret » (`sb_secret_…`) ni l'ancienne
   « service_role » : elles contournent toutes les protections. */

window.CONFIG = {
  SUPABASE_URL: 'https://gatxsrpwskdbsrulqdon.supabase.co',
  SUPABASE_CLE: 'sb_publishable_FgGYjwPe-XXN87VKHLuxTA_ahP4Tfyl'
};
