-- =====================================================================
-- M1: profiles — Basisprofil aller Nutzer (vgl. PLAN.md §3)
-- RLS-first: eigene Zeile lesen/ändern, eingeloggte Nutzer lesen
-- nicht-gelöschte Profile, Admin via Security-Definer-Funktion.
-- =====================================================================

-- ---- Enums ----------------------------------------------------------
create type public.profile_role as enum ('sponsor', 'sponsee', 'admin');

create type public.region as enum (
  'baden_wuerttemberg', 'bayern', 'berlin', 'brandenburg', 'bremen',
  'hamburg', 'hessen', 'mecklenburg_vorpommern', 'niedersachsen',
  'nordrhein_westfalen', 'rheinland_pfalz', 'saarland', 'sachsen',
  'sachsen_anhalt', 'schleswig_holstein', 'thueringen',
  'at', 'ch'
);

-- ---- Tabelle --------------------------------------------------------
create table public.profiles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null unique references auth.users (id) on delete cascade,
  role                 public.profile_role not null,
  display_name         text not null check (char_length(display_name) between 2 and 80),
  slug                 text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  avatar_url           text,
  bio                  text check (char_length(bio) <= 2000),
  region               public.region,
  website              text check (website is null or website ~* '^https?://'),
  onboarding_completed boolean not null default false,
  is_verified          boolean not null default false,
  deleted_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.profiles is
  'Basisprofil aller Nutzer; Soft-Delete via deleted_at (DSGVO-Löschworkflow).';

-- ---- updated_at automatisch pflegen ---------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---- Admin-Check (Security Definer, kein JWT-Claim-Hack) ------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = (select auth.uid())
      and role = 'admin'
      and deleted_at is null
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---- Row Level Security ----------------------------------------------
alter table public.profiles enable row level security;

-- Eigene Zeile immer lesbar (auch nach Soft-Delete, z.B. für DSGVO-Export).
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Marktplatz: eingeloggte Nutzer lesen alle nicht-gelöschten Profile.
create policy "profiles_select_active"
  on public.profiles for select
  to authenticated
  using (deleted_at is null);

-- Eigene Zeile ändern (welche Spalten, regeln die GRANTs unten).
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (user_id = (select auth.uid()) and deleted_at is null)
  with check (user_id = (select auth.uid()));

-- Admin liest und ändert alles.
create policy "profiles_admin_select"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "profiles_admin_update"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- Spaltenrechte: role / is_verified / deleted_at sind tabu --------
-- Insert ausschließlich über den Signup-Trigger (Security Definer),
-- Delete nur über Server/Admin-Workflows (Soft-Delete).
revoke all on table public.profiles from anon;
revoke insert, update, delete on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, slug, avatar_url, bio, region, website, onboarding_completed)
  on table public.profiles to authenticated;

-- ---- Slug-Hilfsfunktion ----------------------------------------------
create or replace function public.slugify(input text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from
    regexp_replace(
      lower(
        translate(coalesce(input, ''),
          'äöüßÄÖÜáàâéèêíìîóòôúùû',
          'aousAOUaaaeeeiiiooouuu')
      ),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

-- ---- Signup-Trigger: Profil automatisch anlegen -----------------------
-- Rolle kommt aus user_metadata; 'admin' wird niemals über Signup vergeben.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role         public.profile_role;
  v_display_name text;
  v_slug         text;
begin
  v_role := case new.raw_user_meta_data ->> 'role'
    when 'sponsor' then 'sponsor'::public.profile_role
    else 'sponsee'::public.profile_role
  end;

  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Mitglied'
  );
  v_display_name := left(v_display_name, 80);

  v_slug := coalesce(nullif(public.slugify(v_display_name), ''), 'mitglied')
            || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.profiles (user_id, role, display_name, slug)
  values (new.id, v_role, v_display_name, v_slug);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
