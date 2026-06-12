-- =====================================================================
-- M1: consents — DSGVO-Einwilligungsnachweis (vgl. PLAN.md §3)
-- Erfasst AGB-/Datenschutz-Zustimmung bei Registrierung sowie spätere
-- Einwilligungen (Marketing, Cookies). // TODO: rechtlich prüfen
-- =====================================================================

create type public.consent_type as enum ('terms', 'privacy', 'marketing', 'cookies');

create table public.consents (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type       public.consent_type not null,
  version    text not null check (char_length(version) between 1 and 50),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.consents is
  'Einwilligungsnachweise (AGB, Datenschutz, Marketing, Cookies) je Profil und Version.';

create index consents_profile_id_idx on public.consents (profile_id);

create trigger consents_set_updated_at
  before update on public.consents
  for each row execute function public.set_updated_at();

-- ---- Row Level Security ----------------------------------------------
alter table public.consents enable row level security;

-- Eigene Einwilligungen lesen.
create policy "consents_select_own"
  on public.consents for select
  to authenticated
  using (
    profile_id in (
      select id from public.profiles where user_id = (select auth.uid())
    )
  );

-- Eigene Einwilligungen erteilen (z.B. Marketing-Opt-in später).
create policy "consents_insert_own"
  on public.consents for insert
  to authenticated
  with check (
    profile_id in (
      select id from public.profiles where user_id = (select auth.uid())
    )
  );

-- Widerruf: eigene Zeile ändern (per GRANT auf revoked_at beschränkt).
create policy "consents_update_own"
  on public.consents for update
  to authenticated
  using (
    profile_id in (
      select id from public.profiles where user_id = (select auth.uid())
    )
  )
  with check (
    profile_id in (
      select id from public.profiles where user_id = (select auth.uid())
    )
  );

-- Admin liest alle Nachweise.
create policy "consents_admin_select"
  on public.consents for select
  to authenticated
  using (public.is_admin());

revoke all on table public.consents from anon;
revoke insert, update, delete on table public.consents from authenticated;
grant select, insert on table public.consents to authenticated;
grant update (revoked_at) on table public.consents to authenticated;

-- ---- Signup-Trigger erweitern: Consents aus user_metadata -------------
-- Die Registrierung schreibt terms_version/privacy_version in die
-- user_metadata; der Trigger legt Profil + Einwilligungsnachweise an.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role            public.profile_role;
  v_display_name    text;
  v_slug            text;
  v_profile_id      uuid;
  v_terms_version   text;
  v_privacy_version text;
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
  values (new.id, v_role, v_display_name, v_slug)
  returning id into v_profile_id;

  v_terms_version   := nullif(trim(new.raw_user_meta_data ->> 'terms_version'), '');
  v_privacy_version := nullif(trim(new.raw_user_meta_data ->> 'privacy_version'), '');

  if v_terms_version is not null then
    insert into public.consents (profile_id, type, version)
    values (v_profile_id, 'terms', left(v_terms_version, 50));
  end if;

  if v_privacy_version is not null then
    insert into public.consents (profile_id, type, version)
    values (v_profile_id, 'privacy', left(v_privacy_version, 50));
  end if;

  return new;
end;
$$;
