-- =====================================================================
-- M2: categories + rollenspezifische Profiltabellen (vgl. PLAN.md §3)
-- categories: gemeinsame Taxonomie für Suche & Matching (inkl. Seed).
-- sponsor_profiles / sponsee_profiles: 1:1-Erweiterungen zu profiles.
-- =====================================================================

-- ---- Enums ----------------------------------------------------------
create type public.category_kind as enum ('sport', 'industry', 'creator_niche');

create type public.sponsee_type as enum ('athlete', 'club', 'creator');

create type public.company_size as enum ('1-10', '11-50', '51-200', '201-1000', '1000+');

-- ---- categories ------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 80),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind       public.category_kind not null,
  parent_id  uuid references public.categories (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.categories is
  'Taxonomie für Matching: Sportarten, Branchen, Creator-Nischen. Pflege nur durch Admin.';

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

-- Lesbar für alle eingeloggten Nutzer; Pflege nur durch Admin.
create policy "categories_select_authenticated"
  on public.categories for select
  to authenticated
  using (true);

create policy "categories_admin_write"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.categories from anon;
grant select on table public.categories to authenticated;
grant insert, update, delete on table public.categories to authenticated; -- RLS begrenzt auf Admin

-- ---- sponsor_profiles -------------------------------------------------
create table public.sponsor_profiles (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null unique references public.profiles (id) on delete cascade,
  company_name    text not null check (char_length(company_name) between 2 and 120),
  industry_id     uuid references public.categories (id) on delete set null,
  company_size    public.company_size,
  budget_min      integer check (budget_min is null or budget_min >= 0),          -- Cent
  budget_max      integer check (budget_max is null or budget_max >= 0),          -- Cent
  target_audience jsonb not null default '{}'::jsonb,                             -- {age_groups: text[], interests: text[]}
  vat_id          text check (vat_id is null or char_length(vat_id) <= 20),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint sponsor_budget_range check (
    budget_min is null or budget_max is null or budget_min <= budget_max
  )
);

comment on table public.sponsor_profiles is
  'Rollenspezifische Erweiterung für Sponsoren (Firmen). Beträge in Cent.';

create trigger sponsor_profiles_set_updated_at
  before update on public.sponsor_profiles
  for each row execute function public.set_updated_at();

-- ---- sponsee_profiles --------------------------------------------------
create table public.sponsee_profiles (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null unique references public.profiles (id) on delete cascade,
  type          public.sponsee_type not null,
  category_id   uuid references public.categories (id) on delete set null,
  reach_total   integer check (reach_total is null or reach_total >= 0),
  audience      jsonb not null default '{}'::jsonb,                               -- {age_groups: text[], interests: text[]}
  social_links  jsonb not null default '{}'::jsonb,                               -- {instagram, tiktok, youtube, ...}
  media_kit_path text,                                                            -- Pfad im privaten Bucket media-kits
  past_sponsors text[] not null default '{}',
  price_min     integer check (price_min is null or price_min >= 0),              -- Cent
  price_max     integer check (price_max is null or price_max >= 0),              -- Cent
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint sponsee_price_range check (
    price_min is null or price_max is null or price_min <= price_max
  )
);

comment on table public.sponsee_profiles is
  'Rollenspezifische Erweiterung für Gesponserte (Sportler/Verein/Creator). Beträge in Cent.';

create trigger sponsee_profiles_set_updated_at
  before update on public.sponsee_profiles
  for each row execute function public.set_updated_at();

-- ---- Hilfsfunktion: gehört das Profil dem eingeloggten Nutzer? --------
create or replace function public.owns_profile(p_profile_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_profile_id
      and user_id = (select auth.uid())
      and deleted_at is null
  );
$$;

revoke execute on function public.owns_profile(uuid) from public, anon;
grant execute on function public.owns_profile(uuid) to authenticated;

-- ---- RLS: Rollenprofile -----------------------------------------------
alter table public.sponsor_profiles enable row level security;
alter table public.sponsee_profiles enable row level security;

-- Marktplatz: eingeloggte Nutzer lesen Rollenprofile nicht-gelöschter Profile.
create policy "sponsor_profiles_select"
  on public.sponsor_profiles for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = profile_id and p.deleted_at is null
  ));

create policy "sponsee_profiles_select"
  on public.sponsee_profiles for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = profile_id and p.deleted_at is null
  ));

-- Eigenes Rollenprofil anlegen/ändern (Rolle muss zum Profil passen).
create policy "sponsor_profiles_insert_own"
  on public.sponsor_profiles for insert
  to authenticated
  with check (
    public.owns_profile(profile_id)
    and exists (
      select 1 from public.profiles p
      where p.id = profile_id and p.role = 'sponsor'
    )
  );

create policy "sponsor_profiles_update_own"
  on public.sponsor_profiles for update
  to authenticated
  using (public.owns_profile(profile_id))
  with check (public.owns_profile(profile_id));

create policy "sponsee_profiles_insert_own"
  on public.sponsee_profiles for insert
  to authenticated
  with check (
    public.owns_profile(profile_id)
    and exists (
      select 1 from public.profiles p
      where p.id = profile_id and p.role = 'sponsee'
    )
  );

create policy "sponsee_profiles_update_own"
  on public.sponsee_profiles for update
  to authenticated
  using (public.owns_profile(profile_id))
  with check (public.owns_profile(profile_id));

-- Admin liest/ändert alles.
create policy "sponsor_profiles_admin"
  on public.sponsor_profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "sponsee_profiles_admin"
  on public.sponsee_profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.sponsor_profiles from anon;
revoke all on table public.sponsee_profiles from anon;
grant select, insert, update on table public.sponsor_profiles to authenticated;
grant select, insert, update on table public.sponsee_profiles to authenticated;

-- ---- Storage: avatars (öffentlich) & media-kits (privat) ---------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',    'avatars',    true,  2097152,  array['image/png', 'image/jpeg', 'image/webp']),
  ('media-kits', 'media-kits', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- Pfadkonvention: <auth.uid()>/<dateiname> — Besitzer schreibt nur im eigenen Ordner.
create policy "avatars_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "avatars_owner_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_owner_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Mediakits: eingeloggte Nutzer dürfen lesen (Marktplatz), schreiben nur der Besitzer.
create policy "media_kits_authenticated_read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'media-kits');

create policy "media_kits_owner_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media-kits' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "media_kits_owner_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media-kits' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "media_kits_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media-kits' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---- Seed: Kategorien ---------------------------------------------------
insert into public.categories (name, slug, kind) values
  -- Sportarten (für Sportler & Vereine)
  ('Fußball',        'fussball',         'sport'),
  ('Basketball',     'basketball',       'sport'),
  ('Handball',       'handball',         'sport'),
  ('Volleyball',     'volleyball',       'sport'),
  ('Eishockey',      'eishockey',        'sport'),
  ('Tennis',         'tennis',           'sport'),
  ('Laufen & Leichtathletik', 'laufen-leichtathletik', 'sport'),
  ('Radsport',       'radsport',         'sport'),
  ('Wintersport',    'wintersport',      'sport'),
  ('Kampfsport',     'kampfsport',       'sport'),
  ('Fitness & Kraftsport', 'fitness-kraftsport', 'sport'),
  ('Schwimmen',      'schwimmen',        'sport'),
  ('Motorsport',     'motorsport',       'sport'),
  ('E-Sports',       'esports',          'sport'),
  ('Sonstiger Sport', 'sonstiger-sport', 'sport'),
  -- Branchen (für Sponsoren)
  ('Sportartikel & Ausrüstung', 'sportartikel',        'industry'),
  ('Ernährung & Getränke',      'ernaehrung-getraenke','industry'),
  ('Mode & Lifestyle',          'mode-lifestyle',      'industry'),
  ('Finanzen & Versicherung',   'finanzen-versicherung','industry'),
  ('Automobil & Mobilität',     'automobil-mobilitaet','industry'),
  ('Technologie & Software',    'technologie-software','industry'),
  ('Gesundheit & Pharma',       'gesundheit-pharma',   'industry'),
  ('Energie & Bau',             'energie-bau',         'industry'),
  ('Handel & E-Commerce',       'handel-ecommerce',    'industry'),
  ('Gastronomie & Tourismus',   'gastronomie-tourismus','industry'),
  ('Medien & Entertainment',    'medien-entertainment','industry'),
  ('Sonstige Branche',          'sonstige-branche',    'industry'),
  -- Creator-Nischen
  ('Fitness & Gesundheit', 'creator-fitness',   'creator_niche'),
  ('Fashion & Beauty',     'creator-fashion',   'creator_niche'),
  ('Food & Kochen',        'creator-food',      'creator_niche'),
  ('Gaming',               'creator-gaming',    'creator_niche'),
  ('Reisen & Outdoor',     'creator-reisen',    'creator_niche'),
  ('Familie & Alltag',     'creator-familie',   'creator_niche'),
  ('Tech & Gadgets',       'creator-tech',      'creator_niche'),
  ('Comedy & Entertainment','creator-comedy',   'creator_niche'),
  ('Bildung & Finanzen',   'creator-bildung',   'creator_niche'),
  ('Lifestyle',            'creator-lifestyle', 'creator_niche');
