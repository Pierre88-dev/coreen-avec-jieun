-- ============================================================================
--  Coréen avec Jieun — schéma Supabase
--  À coller en entier dans : Supabase > SQL Editor > New query > Run
--  Rejouable sans dégât : "if not exists" / "or replace" / "add column if not
--  exists" partout. Le rejouer sur une base déjà en service ne perd rien.
-- ============================================================================

-- ---------------------------------------------------------------- tables ---

create table if not exists eleves (
  id         text primary key,               -- 'marie', 'brooklyn'
  prenom     text not null,
  prenom_ko  text,
  cle        text not null unique,           -- adresse privée, imprévisible
  actif      boolean not null default true,  -- un élève se désactive, ne se supprime pas
  notes_prof text not null default '',       -- notes de Jieun, jamais montrées à l'élève
  cree_le    timestamptz not null default now()
);
alter table eleves add column if not exists notes_prof text not null default '';

create table if not exists lecons (
  id         uuid primary key default gen_random_uuid(),
  eleve_id   text not null references eleves(id) on delete cascade,
  numero     int,
  date       date not null default current_date,
  titre      text not null,
  titre_ko   text,
  recap      text not null default '',
  portee_qcm text not null default '',        -- la portion du document à couvrir
  etiquettes text[] not null default '{}',    -- 'grammaire', 'vocabulaire', ...
  publiee    boolean not null default false,  -- brouillon tant que faux
  cree_le    timestamptz not null default now()
);
alter table lecons add column if not exists portee_qcm text   not null default '';
alter table lecons add column if not exists etiquettes text[] not null default '{}';
create index if not exists lecons_eleve on lecons(eleve_id, date desc);

-- Un test groupé porte sur plusieurs leçons et a ses propres questions,
-- écrites à partir des documents de ces leçons.
create table if not exists tests (
  id           uuid primary key default gen_random_uuid(),
  eleve_id     text not null references eleves(id) on delete cascade,
  date         date not null default current_date,
  titre        text not null,
  consignes    text not null default '',      -- ce sur quoi insister, s'il y a lieu
  nb_questions int  not null default 20,
  publiee      boolean not null default false,
  cree_le      timestamptz not null default now(),
  constraint nb_questions_raisonnable check (nb_questions between 10 and 100)
);
create index if not exists tests_eleve on tests(eleve_id, date desc);

-- Les leçons couvertes par un test.
create table if not exists tests_lecons (
  test_id  uuid not null references tests(id)  on delete cascade,
  lecon_id uuid not null references lecons(id) on delete cascade,
  ordre    int  not null default 0,
  primary key (test_id, lecon_id)
);

-- Une question appartient soit à une leçon, soit à un test. Jamais aux deux,
-- jamais à rien : c'est ce que vérifie la contrainte.
create table if not exists questions (
  id          uuid primary key default gen_random_uuid(),
  lecon_id    uuid references lecons(id) on delete cascade,
  test_id     uuid references tests(id)  on delete cascade,
  ordre       int  not null,
  enonce      text not null,
  options     text[] not null,               -- 4 propositions
  bonne       int  not null,                 -- indice 0..3
  explication text not null default '',
  constraint bonne_dans_les_options check (bonne >= 0 and bonne < 4),
  constraint quatre_options        check (array_length(options, 1) = 4),
  constraint une_seule_origine     check (num_nonnulls(lecon_id, test_id) = 1)
);
alter table questions add column if not exists test_id uuid references tests(id) on delete cascade;
alter table questions alter column lecon_id drop not null;
create index if not exists questions_lecon on questions(lecon_id, ordre);
create index if not exists questions_test  on questions(test_id, ordre);

-- lecon_id nul = fiche de référence permanente, visible par tout le monde.
-- Deux leçons dupliquées pointent vers la MÊME url : le fichier n'est stocké
-- qu'une fois, chaque leçon a sa ligne.
create table if not exists documents (
  id       uuid primary key default gen_random_uuid(),
  lecon_id uuid references lecons(id) on delete cascade,
  titre    text not null,
  url      text not null,                    -- chemin dans le bucket, ou lien
  type     text,                             -- 'pdf', 'fiche interactive', ...
  ordre    int not null default 0
);

-- Un passage d'élève. Volontairement AUTONOME : il garde l'intitulé et une
-- photographie des questions telles qu'elles étaient ce jour-là. Corriger la
-- leçon plus tard, ou la supprimer, ne peut plus le rendre faux ni l'effacer.
create table if not exists reponses (
  id              uuid primary key default gen_random_uuid(),
  lecon_id        uuid references lecons(id) on delete set null,
  test_id         uuid references tests(id)  on delete set null,
  eleve_id        text not null references eleves(id) on delete cascade,
  intitule        text not null default '',  -- le titre, copié le jour du passage
  questions_figees jsonb not null default '[]'::jsonb,
  choix           int[] not null,
  score           int,
  total           int,
  envoye_le       timestamptz not null default now()
);
alter table reponses add column if not exists test_id uuid references tests(id) on delete set null;
alter table reponses add column if not exists intitule text not null default '';
alter table reponses add column if not exists questions_figees jsonb not null default '[]'::jsonb;
alter table reponses alter column lecon_id drop not null;
create index if not exists reponses_eleve on reponses(eleve_id, envoye_le desc);
create index if not exists reponses_lecon on reponses(lecon_id, envoye_le desc);

-- La boîte à questions : l'élève dépose, Jieun lit. Pas de fil de discussion.
create table if not exists messages (
  id        uuid primary key default gen_random_uuid(),
  eleve_id  text not null references eleves(id) on delete cascade,
  lecon_id  uuid references lecons(id) on delete set null,
  intitule  text not null default '',        -- la leçon concernée, copiée
  texte     text not null,
  envoye_le timestamptz not null default now(),
  lu_le     timestamptz,                     -- nul tant que Jieun ne l'a pas lu
  constraint texte_non_vide check (length(btrim(texte)) between 1 and 2000)
);
create index if not exists messages_eleve on messages(eleve_id, envoye_le desc);
create index if not exists messages_non_lus on messages(lu_le) where lu_le is null;

-- ------------------------------------------------------------------ RLS ---
-- Tout est fermé par défaut. Les élèves ne touchent JAMAIS les tables
-- directement : ils passent par les trois fonctions plus bas.

alter table eleves       enable row level security;
alter table lecons       enable row level security;
alter table tests        enable row level security;
alter table tests_lecons enable row level security;
alter table questions    enable row level security;
alter table documents    enable row level security;
alter table reponses     enable row level security;
alter table messages     enable row level security;

-- Jieun, une fois connectée, a tous les droits.
do $$
declare t text;
begin
  foreach t in array array['eleves','lecons','tests','tests_lecons','questions',
                           'documents','reponses','messages'] loop
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
                               from questions q where q.lecon_id = l.id), '[]'::jsonb),
        'mesQuestions', coalesce((select jsonb_agg(jsonb_build_object(
                                 'texte', m.texte, 'le', m.envoye_le, 'lu', m.lu_le is not null)
                               order by m.envoye_le desc)
                               from messages m
                               where m.lecon_id = l.id and m.eleve_id = e.id), '[]'::jsonb)
      ) order by l.date desc)
      from lecons l where l.eleve_id = e.id and l.publiee), '[]'::jsonb),
    'tests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'eleve', e.id, 'date', t.date, 'titre', t.titre,
        'questions', coalesce((select jsonb_agg(jsonb_build_object(
                                 't', q.enonce, 'o', q.options, 'r', q.bonne, 'e', q.explication)
                               order by q.ordre)
                               from questions q where q.test_id = t.id), '[]'::jsonb)
      ) order by t.date desc)
      from tests t where t.eleve_id = e.id and t.publiee), '[]'::jsonb)
  ) end
  from eleves e where e.cle = lower(cle_url) and e.actif;
$$;

-- Enregistre un passage, sur une leçon OU sur un test. Exige la clé : on ne
-- peut pas écrire au nom d'un élève dont on ne connaît pas l'adresse privée.
--
-- La fonction fige elle-même l'intitulé, les questions et le score : le site
-- n'envoie que les choix. Un passage ne dépend donc plus de ce que le
-- navigateur affirme, et il reste lisible même si la leçon change ensuite.
create or replace function enregistrer_reponse(
  cle_url text, p_lecon uuid, p_test uuid, p_choix int[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eleve    text;
  v_intitule text;
  v_questions jsonb;
  v_score    int := 0;
  v_total    int;
  i          int;
begin
  select id into v_eleve from eleves where cle = lower(cle_url) and actif;
  if v_eleve is null then
    raise exception 'cle inconnue';
  end if;
  if num_nonnulls(p_lecon, p_test) <> 1 then
    raise exception 'il faut une lecon ou un test, pas les deux';
  end if;

  if p_lecon is not null then
    select l.titre into v_intitule
      from lecons l where l.id = p_lecon and l.eleve_id = v_eleve;
    if v_intitule is null then
      raise exception 'cette lecon n''appartient pas a cet eleve';
    end if;
    select coalesce(jsonb_agg(jsonb_build_object(
             't', q.enonce, 'o', q.options, 'r', q.bonne, 'e', q.explication) order by q.ordre),
           '[]'::jsonb)
      into v_questions from questions q where q.lecon_id = p_lecon;
  else
    select t.titre into v_intitule
      from tests t where t.id = p_test and t.eleve_id = v_eleve;
    if v_intitule is null then
      raise exception 'ce test n''appartient pas a cet eleve';
    end if;
    select coalesce(jsonb_agg(jsonb_build_object(
             't', q.enonce, 'o', q.options, 'r', q.bonne, 'e', q.explication) order by q.ordre),
           '[]'::jsonb)
      into v_questions from questions q where q.test_id = p_test;
  end if;

  -- Le score se recalcule ici, à partir des bonnes réponses de la base.
  v_total := jsonb_array_length(v_questions);
  for i in 0 .. v_total - 1 loop
    if p_choix[i + 1] is not null
       and p_choix[i + 1] = (v_questions -> i ->> 'r')::int then
      v_score := v_score + 1;
    end if;
  end loop;

  insert into reponses (lecon_id, test_id, eleve_id, intitule, questions_figees,
                        choix, score, total)
  values (p_lecon, p_test, v_eleve, v_intitule, v_questions, p_choix, v_score, v_total);
end $$;

-- La boîte à questions. Même porte étroite : la clé, et rien d'autre.
-- Vingt messages par jour et par élève suffisent largement ; au-delà, c'est
-- un incident, pas un usage.
create or replace function poser_question(cle_url text, p_lecon uuid, p_texte text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eleve    text;
  v_intitule text := '';
  v_recents  int;
begin
  select id into v_eleve from eleves where cle = lower(cle_url) and actif;
  if v_eleve is null then
    raise exception 'cle inconnue';
  end if;
  if length(btrim(coalesce(p_texte, ''))) = 0 then
    raise exception 'question vide';
  end if;

  select count(*) into v_recents
    from messages where eleve_id = v_eleve and envoye_le > now() - interval '1 day';
  if v_recents >= 20 then
    raise exception 'trop de questions envoyees aujourd''hui';
  end if;

  if p_lecon is not null then
    select l.titre into v_intitule
      from lecons l where l.id = p_lecon and l.eleve_id = v_eleve;
    if v_intitule is null then
      raise exception 'cette lecon n''appartient pas a cet eleve';
    end if;
  end if;

  insert into messages (eleve_id, lecon_id, intitule, texte)
  values (v_eleve, p_lecon, v_intitule, left(btrim(p_texte), 2000));
end $$;

revoke all on function espace_eleve(text)                        from public, anon;
revoke all on function enregistrer_reponse(text, uuid, uuid, int[]) from public, anon;
revoke all on function poser_question(text, uuid, text)          from public, anon;
grant execute on function espace_eleve(text)                     to anon, authenticated;
grant execute on function enregistrer_reponse(text, uuid, uuid, int[]) to anon, authenticated;
grant execute on function poser_question(text, uuid, text)       to anon, authenticated;

-- L'ancienne signature à cinq arguments n'a plus lieu d'être.
drop function if exists enregistrer_reponse(text, uuid, text, int[], int, int);
drop function if exists enregistrer_reponse(text, uuid, int[], int, int);

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
