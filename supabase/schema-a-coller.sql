create table if not exists eleves (
  id         text primary key,
  prenom     text not null,
  prenom_ko  text,
  cle        text not null unique,
  actif      boolean not null default true,
  notes_prof text not null default '',
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
  portee_qcm text not null default '',
  etiquettes text[] not null default '{}',
  publiee    boolean not null default false,
  cree_le    timestamptz not null default now()
);
alter table lecons add column if not exists portee_qcm text   not null default '';
alter table lecons add column if not exists etiquettes text[] not null default '{}';
create index if not exists lecons_eleve on lecons(eleve_id, date desc);

create table if not exists tests (
  id           uuid primary key default gen_random_uuid(),
  eleve_id     text not null references eleves(id) on delete cascade,
  date         date not null default current_date,
  titre        text not null,
  consignes    text not null default '',
  nb_questions int  not null default 20,
  statut       text not null default 'brouillon',
  erreur       text not null default '',
  genere_le    timestamptz,
  publiee      boolean not null default false,
  cree_le      timestamptz not null default now(),
  constraint nb_questions_raisonnable check (nb_questions between 10 and 100),
  constraint statut_connu check (statut in ('brouillon','en_cours','prete','echec'))
);
alter table tests add column if not exists statut    text not null default 'brouillon';
alter table tests add column if not exists erreur    text not null default '';
alter table tests add column if not exists genere_le timestamptz;
create index if not exists tests_eleve on tests(eleve_id, date desc);

create table if not exists tests_lecons (
  test_id  uuid not null references tests(id)  on delete cascade,
  lecon_id uuid not null references lecons(id) on delete cascade,
  ordre    int  not null default 0,
  primary key (test_id, lecon_id)
);

create table if not exists questions (
  id          uuid primary key default gen_random_uuid(),
  lecon_id    uuid references lecons(id) on delete cascade,
  test_id     uuid references tests(id)  on delete cascade,
  ordre       int  not null,
  enonce      text not null,
  options     text[] not null,
  bonne       int  not null,
  explication text not null default '',
  constraint bonne_dans_les_options check (bonne >= 0 and bonne < 4),
  constraint quatre_options        check (array_length(options, 1) = 4),
  constraint une_seule_origine     check (num_nonnulls(lecon_id, test_id) = 1)
);
alter table questions add column if not exists test_id uuid references tests(id) on delete cascade;
alter table questions alter column lecon_id drop not null;
create index if not exists questions_lecon on questions(lecon_id, ordre);
create index if not exists questions_test  on questions(test_id, ordre);

create table if not exists documents (
  id       uuid primary key default gen_random_uuid(),
  lecon_id uuid references lecons(id) on delete cascade,
  titre    text not null,
  url      text not null,
  type     text,
  pages    int,
  taille_octets bigint,
  ordre    int not null default 0
);
alter table documents add column if not exists pages int;
alter table documents add column if not exists taille_octets bigint;

create table if not exists reponses (
  id              uuid primary key default gen_random_uuid(),
  lecon_id        uuid references lecons(id) on delete set null,
  test_id         uuid references tests(id)  on delete set null,
  eleve_id        text not null references eleves(id) on delete cascade,
  intitule        text not null default '',
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

create table if not exists progressions (
  id       uuid primary key default gen_random_uuid(),
  eleve_id text not null references eleves(id) on delete cascade,
  lecon_id uuid references lecons(id) on delete cascade,
  test_id  uuid references tests(id)  on delete cascade,
  choix    int[] not null,
  maj_le   timestamptz not null default now(),
  constraint une_seule_cible check (num_nonnulls(lecon_id, test_id) = 1)
);
create unique index if not exists progressions_lecon
  on progressions(eleve_id, lecon_id) where lecon_id is not null;
create unique index if not exists progressions_test
  on progressions(eleve_id, test_id)  where test_id  is not null;

create table if not exists generations (
  id             uuid primary key default gen_random_uuid(),
  lecon_id       uuid references lecons(id) on delete set null,
  test_id        uuid references tests(id)  on delete set null,
  modele         text not null default '',
  tokens_entree  int  not null default 0,
  tokens_sortie  int  not null default 0,
  cout_centimes  numeric(10,2) not null default 0,

  statut         text not null default 'ok',
  erreur         text not null default '',
  cree_le        timestamptz not null default now()
);
create index if not exists generations_date on generations(cree_le desc);

create table if not exists messages (
  id        uuid primary key default gen_random_uuid(),
  eleve_id  text not null references eleves(id) on delete cascade,
  lecon_id  uuid references lecons(id) on delete set null,
  intitule  text not null default '',
  texte     text not null,
  envoye_le timestamptz not null default now(),
  lu_le     timestamptz,
  constraint texte_non_vide check (length(btrim(texte)) between 1 and 2000)
);
create index if not exists messages_eleve on messages(eleve_id, envoye_le desc);
create index if not exists messages_non_lus on messages(lu_le) where lu_le is null;

alter table eleves       enable row level security;
alter table lecons       enable row level security;
alter table tests        enable row level security;
alter table tests_lecons enable row level security;
alter table questions    enable row level security;
alter table documents    enable row level security;
alter table reponses     enable row level security;
alter table progressions enable row level security;
alter table generations  enable row level security;
alter table messages     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['eleves','lecons','tests','tests_lecons','questions',
                           'documents','reponses','progressions','generations',
                           'messages'] loop
    execute format('drop policy if exists prof_tout on %I', t);
    execute format(
      'create policy prof_tout on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

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
      from tests t
      where t.eleve_id = e.id and t.publiee and t.statut = 'prete'), '[]'::jsonb),
    'progressions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'lecon', p.lecon_id, 'test', p.test_id, 'choix', p.choix))
      from progressions p where p.eleve_id = e.id), '[]'::jsonb)
  ) end
  from eleves e where e.cle = lower(cle_url) and e.actif;
$$;

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

  -- Le parcours est fini : la reprise en cours n'a plus lieu d'être.
  delete from progressions
   where eleve_id = v_eleve
     and lecon_id is not distinct from p_lecon
     and test_id  is not distinct from p_test;
end $$;

create or replace function enregistrer_progression(
  cle_url text, p_lecon uuid, p_test uuid, p_choix int[])
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
  if num_nonnulls(p_lecon, p_test) <> 1 then
    raise exception 'il faut une lecon ou un test, pas les deux';
  end if;

  if p_lecon is not null then
    if not exists (select 1 from lecons where id = p_lecon and eleve_id = v_eleve) then
      raise exception 'cette lecon n''appartient pas a cet eleve';
    end if;
    insert into progressions (eleve_id, lecon_id, choix)
    values (v_eleve, p_lecon, p_choix)
    on conflict (eleve_id, lecon_id) where lecon_id is not null
    do update set choix = excluded.choix, maj_le = now();
  else
    if not exists (select 1 from tests where id = p_test and eleve_id = v_eleve) then
      raise exception 'ce test n''appartient pas a cet eleve';
    end if;
    insert into progressions (eleve_id, test_id, choix)
    values (v_eleve, p_test, p_choix)
    on conflict (eleve_id, test_id) where test_id is not null
    do update set choix = excluded.choix, maj_le = now();
  end if;
end $$;

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

revoke all on function espace_eleve(text)                              from public, anon;
revoke all on function enregistrer_reponse(text, uuid, uuid, int[])    from public, anon;
revoke all on function enregistrer_progression(text, uuid, uuid, int[]) from public, anon;
revoke all on function poser_question(text, uuid, text)                from public, anon;
grant execute on function espace_eleve(text)                           to anon, authenticated;
grant execute on function enregistrer_reponse(text, uuid, uuid, int[]) to anon, authenticated;
grant execute on function enregistrer_progression(text, uuid, uuid, int[]) to anon, authenticated;
grant execute on function poser_question(text, uuid, text)             to anon, authenticated;

drop function if exists enregistrer_reponse(text, uuid, text, int[], int, int);
drop function if exists enregistrer_reponse(text, uuid, int[], int, int);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', true, 33554432,
        array['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists documents_liste on storage.objects;
create policy documents_liste on storage.objects
  for select to authenticated using (bucket_id = 'documents');

drop policy if exists documents_depot on storage.objects;
create policy documents_depot on storage.objects
  for insert to authenticated with check (bucket_id = 'documents');

drop policy if exists documents_remplacement on storage.objects;
create policy documents_remplacement on storage.objects
  for update to authenticated using (bucket_id = 'documents');

drop policy if exists documents_retrait on storage.objects;
create policy documents_retrait on storage.objects
  for delete to authenticated using (bucket_id = 'documents');

insert into eleves (id, prenom, prenom_ko, cle) values
  ('marie',    'Marie',    '마리',     'marie-'    || encode(gen_random_bytes(5), 'hex')),
  ('brooklyn', 'Brooklyn', '브루클린', 'brooklyn-' || encode(gen_random_bytes(5), 'hex'))
on conflict (id) do nothing;

insert into documents (lecon_id, titre, url, type)
select null, 'Hangul — référence complète', 'ressources/hangul.html', 'fiche interactive'
where not exists (select 1 from documents where lecon_id is null and titre like 'Hangul%');
