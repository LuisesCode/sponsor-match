-- =====================================================================
-- M3: listings — Ausschreibungen beider Seiten (vgl. PLAN.md §3).
-- RLS: Autor verwaltet eigene Listings (insert/update), eingeloggte
-- Nutzer lesen aktive Listings nicht-gelöschter Profile, Admin alles.
-- =====================================================================

-- ---- Enums ----------------------------------------------------------
create type public.listing_direction as enum ('seeking_sponsor', 'offering_sponsorship');

create type public.listing_status as enum ('draft', 'active', 'paused', 'closed');

-- ---- listings --------------------------------------------------------
create table public.listings (
  id                uuid primary key default gen_random_uuid(),
  author_profile_id uuid not null references public.profiles (id) on delete cascade,
  direction         public.listing_direction not null,
  title             text not null check (char_length(title) between 5 and 120),
  description       text not null check (char_length(description) between 20 and 5000),
  category_id       uuid references public.categories (id) on delete set null,
  region            public.region,
  budget_min        integer check (budget_min is null or budget_min >= 0),        -- Cent
  budget_max        integer check (budget_max is null or budget_max >= 0),        -- Cent
  reach_required    integer check (reach_required is null or reach_required >= 0),
  status            public.listing_status not null default 'draft',
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint listings_budget_range check (
    budget_min is null or budget_max is null or budget_min <= budget_max
  )
);

comment on table public.listings is
  'Ausschreibungen: Gesponserte suchen Sponsoren (seeking_sponsor), Sponsoren bieten Sponsorings an (offering_sponsorship). Beträge in Cent.';

create index listings_author_idx   on public.listings (author_profile_id);
create index listings_status_idx   on public.listings (status) where status = 'active';
create index listings_category_idx on public.listings (category_id);
create index listings_region_idx   on public.listings (region);

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- ---- RLS -------------------------------------------------------------
alter table public.listings enable row level security;

-- Marktplatz: eingeloggte Nutzer lesen aktive Listings nicht-gelöschter
-- Profile; der Autor sieht zusätzlich alle eigenen Listings.
create policy "listings_select"
  on public.listings for select
  to authenticated
  using (
    (
      status = 'active'
      and exists (
        select 1 from public.profiles p
        where p.id = author_profile_id and p.deleted_at is null
      )
    )
    or public.owns_profile(author_profile_id)
  );

-- Anlegen nur fürs eigene Profil; die direction muss zur Rolle passen
-- (Gesponserte suchen Sponsoren, Sponsoren bieten Sponsorings an).
create policy "listings_insert_own"
  on public.listings for insert
  to authenticated
  with check (
    public.owns_profile(author_profile_id)
    and exists (
      select 1 from public.profiles p
      where p.id = author_profile_id
        and (
          (p.role = 'sponsee' and direction = 'seeking_sponsor')
          or (p.role = 'sponsor' and direction = 'offering_sponsorship')
        )
    )
  );

create policy "listings_update_own"
  on public.listings for update
  to authenticated
  using (public.owns_profile(author_profile_id))
  with check (public.owns_profile(author_profile_id));

-- Admin liest/ändert alles.
create policy "listings_admin"
  on public.listings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.listings from anon;
grant select, insert, update on table public.listings to authenticated;
grant delete on table public.listings to authenticated; -- RLS begrenzt auf Admin (nur listings_admin erlaubt delete)
