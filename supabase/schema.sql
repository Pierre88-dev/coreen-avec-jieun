-- ============================================================================
--  Coréen avec Jieun — schéma Supabase
--  À coller en entier dans : Supabase > SQL Editor > New query > Run
--  Rejouable sans dégât : tout est en "if not exists" / "or replace".
-- ============================================================================

-- ---------------------------------------------------------------- tables ---

create table if not exists eleves (
  id         text primary key,               -- 'marie', 'brooklyn'
  prenom     text not null,
  prenom_ko  text,
  cle        text not null unique,           -- adresse privée, imprévisible
  actif      boolean not null default true,
  cree_le    timestamptz not null default now()
);

create table if not exists lecons (
  id        uuid primary key default gen_random_uuid(),
  eleve_id  text not null references eleves(id) on delete cascade,
  numero    int,
  date      date not null default current_date,
  titre     text not null,
  titre_ko  text,
  recap     text not null default '',
  portee_qcm text not null default '',       -- sur quoi porte le QCM dans le PDF
  publiee   boolean not null default false,  -- brouillon tant que faux
  cree_le   timestamptz not null default now()
);
create index if not exists lecons_eleve on lecons(eleve_id, date desc);

create table if not exists questions (
  id          uuid primary key default gen_random_uuid(),
  lecon_id    uuid not null references lecons(id) on delete cascade,
  ordre       int  not null,
  enonce      text not null,
  options     text[] not null,               -- 4 propositions
  bonne       int  not null,                 -- indice 0..3
  explication text not null default '',
  constraint bonne_dans_les_options check (bonne >= 0 and bonne < 4),
  constraint quatre_options        check (array_length(options, 1) = 4)
);
create index if not exists questions_lecon on questions(lecon_id, ordre);

-- lecon_id nul = fiche de référence permanente, visible par tout le monde
create table if not exists documents (
  id       uuid primary key default gen_random_uuid(),
  lecon_id uuid references lecons(id) on delete cascade,
  titre    text not null,
  url      text not null,                    -- chemin dans le bucket, ou lien
  type     text,                             -- 'pdf', 'fiche interactive', ...
  ordre    int not null default 0
);

create table if not exists reponses (
  id        uuid primary key default gen_random_uuid(),
  lecon_id  uuid not null references lecons(id) on delete cascade,
  eleve_id  text not null references eleves(id) on delete cascade,
  choix     int[] not null,
  score     int,
  total     int,
  envoye_le timestamptz not null default now()
);
create index if not exists reponses_lecon on reponses(lecon_id, envoye_le desc);

-- ------------------------------------------------------------------ RLS ---
-- Tout est fermé par défaut. Les élèves ne touchent JAMAIS les tables
-- directement : ils passent par les deux fonctions plus bas.

alter table eleves    enable row level security;
alter table lecons    enable row level security;
alter table questions enable row level security;
alter table documents enable row level security;
alter table reponses  enable row level security;

-- Jieun, une fois connectée, a tous les droits.
do $$
declare t text;
begin
  foreach t in array array['eleves','lecons','questions','documents','reponses'] loop
    execute format('drop policy if exists prof_tout on %I', t);
    execute format(
      'create policy prof_tout on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ------------------------------------------------------------ fonctions ---

-- Rend TOUT l'espace d'un seul élève, à partir de sa clé privée.
-- security definer : la fonction lit les tables, l'appelant non. Une clé
-- inconnue rend null — impossible d'énumérer les élèves ni leurs clés.
create or replace function espace_eleve(cle_url text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select case when e.id is null then null else jsonb_build_object(
    'eleve', jsonb_build_object('id', e.id, 'prenom', e.prenom, 'prenomKo', e.prenom_ko,
                                'cle', e.cle),
    'ressources', coalesce((
      select jsonb_agg(jsonb_build_object('titre', d.titre, 'url', d.url, 'type', d.type)
                       order by d.ordre, d.titre)
      from documents d where d.lecon_id is null), '[]'::jsonb),
    'lecons', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'eleve', e.id, 'numero', l.numero, 'date', l.date,
        'titre', l.titre, 'titreKo', l.titre_ko, 'recap', l.recap,
        'docs', coalesce((select jsonb_agg(jsonb_build_object('titre', d.titre, 'url', d.url,
                                                              'type', d.type) order by d.ordre)
                          from documents d where d.lecon_id = l.id), '[]'::jsonb),
        'questions', coalesce((select jsonb_agg(jsonb_build_object(
                                 't', q.enonce, 'o', q.options, 'r', q.bonne, 'e', q.explication)
                               order by q.ordre)
                               from questions q where q.lecon_id = l.id), '[]'::jsonb)
      ) order by l.date desc)
      from lecons l where l.eleve_id = e.id and l.publiee), '[]'::jsonb)
  ) end
  from eleves e where e.cle = lower(cle_url) and e.actif;
$$;

-- Enregistre une tentative. Exige la clé : on ne peut pas écrire au nom
-- d'un élève dont on ne connaît pas l'adresse privée.
create or replace function enregistrer_reponse(
  cle_url text, p_lecon uuid, p_choix int[], p_score int, p_total int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_eleve text;
begin
  select id into v_eleve from eleves where cle = lower(cle_url) and actif;
  if v_eleve is null then
    raise exception 'cle inconnue';
  end if;
  if not exists (select 1 from lecons where id = p_lecon and eleve_id = v_eleve) then
    raise exception 'cette lecon n''appartient pas a cet eleve';
  end if;
  insert into reponses (lecon_id, eleve_id, choix, score, total)
  values (p_lecon, v_eleve, p_choix, p_score, p_total);
end $$;

revoke all on function espace_eleve(text)                              from public, anon;
revoke all on function enregistrer_reponse(text, uuid, int[], int, int) from public, anon;
grant execute on function espace_eleve(text)                           to anon, authenticated;
grant execute on function enregistrer_reponse(text, uuid, int[], int, int) to anon, authenticated;

-- ------------------------------------------------- contenu de démarrage ---

-- Les clés privées sont tirées au sort ICI, dans la base. Elles n'existent
-- donc dans aucun fichier du dépôt : impossible de les lire en consultant le
-- code du site. Jieun les retrouve dans son espace, avec un bouton pour les
-- copier avant de les envoyer à ses élèves.
insert into eleves (id, prenom, prenom_ko, cle) values
  ('marie',    'Marie',    '마리',     'marie-'    || encode(gen_random_bytes(5), 'hex')),
  ('brooklyn', 'Brooklyn', '브루클린', 'brooklyn-' || encode(gen_random_bytes(5), 'hex'))
on conflict (id) do nothing;

insert into documents (lecon_id, titre, url, type)
select null, 'Hangul — référence complète', 'ressources/hangul.html', 'fiche interactive'
where not exists (select 1 from documents where lecon_id is null and titre like 'Hangul%');
