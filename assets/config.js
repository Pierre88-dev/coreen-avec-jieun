/* Configuration du site.

   Tant que ces deux valeurs sont vides, tout le site tourne en MODE LOCAL :
   les leçons vivent dans le navigateur, rien n'est partagé, mais l'interface
   fonctionne entièrement. C'est fait pour essayer avant de brancher quoi que
   ce soit.

   Pour passer en mode partagé, colle ici les deux valeurs de
   Supabase > Project Settings > API. Elles sont publiques : elles finissent
   dans la page, c'est prévu et sans danger — le schéma ferme toutes les
   tables et n'expose que deux fonctions.

   N'y colle JAMAIS la clé « service_role » : elle contourne toutes les
   protections. */

window.CONFIG = {
  SUPABASE_URL:  '',
  SUPABASE_ANON: ''
};
