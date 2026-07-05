-- =====================================================================
-- M5: deals + deal_milestones + contracts + platform_settings
-- (vgl. PLAN.md §3, §5 M5, §6 Entscheidung 1).
--
-- Kernprinzip: KEINE freien Inserts/Updates auf deals/milestones/contracts —
-- alle Schreibzugriffe laufen über die geprüften SECURITY-DEFINER-Funktionen
-- create_deal / counter_deal_offer / accept_contract / advance_deal_status.
-- Die Provision (commission_pct) wird beim Anlegen aus platform_settings
-- eingefroren; commission_amount = round(amount_total * pct / 100),
-- Abzug vom Gesponserten (Sponsor zahlt amount_total, Auszahlung =
-- amount_total − commission_amount).
-- =====================================================================

-- ---- Enums ------------------------------------------------------------
create type public.deal_status as enum (
  'draft', 'offered', 'negotiating', 'agreed',
  'funded', 'in_progress', 'completed',
  'declined', 'cancelled', 'disputed'
);

create type public.milestone_status as enum (
  'pending', 'submitted', 'approved', 'paid', 'disputed'
);

-- ---- platform_settings --------------------------------------------------
create table public.platform_settings (
  key        text primary key,
  value      jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.platform_settings is
  'Plattform-Konfiguration ohne Deploy (z. B. commission_pct). Nur Admin; Serverlogik liest über SECURITY-DEFINER-Funktionen.';

create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

alter table public.platform_settings enable row level security;

create policy "platform_settings_admin"
  on public.platform_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.platform_settings from anon;
grant select, insert, update, delete on table public.platform_settings to authenticated;

insert into public.platform_settings (key, value)
values ('commission_pct', jsonb_build_object('pct', 10))
on conflict (key) do nothing;

-- ---- deals ----------------------------------------------------------------
create table public.deals (
  id                     uuid primary key default gen_random_uuid(),
  conversation_id        uuid not null references public.conversations (id) on delete cascade,
  listing_id             uuid references public.listings (id) on delete set null,
  sponsor_profile_id     uuid not null references public.profiles (id) on delete cascade,
  sponsee_profile_id     uuid not null references public.profiles (id) on delete cascade,
  proposed_by_profile_id uuid not null references public.profiles (id) on delete cascade,
  title                  text not null check (char_length(title) between 5 and 120),
  description            text not null check (char_length(description) between 20 and 5000),
  amount_total           bigint not null check (amount_total > 0 and amount_total <= 10000000000), -- Cent
  currency               text not null default 'eur' check (currency = 'eur'),
  commission_pct         numeric(5,2) not null check (commission_pct >= 0 and commission_pct <= 100),
  commission_amount      bigint not null check (commission_amount >= 0),                           -- Cent
  status                 public.deal_status not null default 'draft',
  cancelled_reason       text check (cancelled_reason is null or char_length(cancelled_reason) <= 1000),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint deals_distinct_participants check (sponsor_profile_id <> sponsee_profile_id),
  constraint deals_proposer_is_participant
    check (proposed_by_profile_id in (sponsor_profile_id, sponsee_profile_id))
);

comment on table public.deals is
  'Sponsoring-Deals (Beträge in Cent). Statuswechsel NUR über advance_deal_status()/accept_contract(); commission_pct wird beim Anlegen aus platform_settings eingefroren.';

create index deals_conversation_idx on public.deals (conversation_id);
create index deals_sponsor_idx on public.deals (sponsor_profile_id);
create index deals_sponsee_idx on public.deals (sponsee_profile_id);

-- Pro Konversation höchstens ein offener Deal (abgeschlossene/abgelehnte/
-- stornierte Deals blockieren neue Vorschläge nicht).
create unique index deals_one_open_per_conversation
  on public.deals (conversation_id)
  where status not in ('declined', 'cancelled', 'completed');

create trigger deals_set_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

-- ---- deal_milestones --------------------------------------------------------
create table public.deal_milestones (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references public.deals (id) on delete cascade,
  position   integer not null check (position >= 1),
  title      text not null check (char_length(title) between 3 and 120),
  due_date   date,
  amount     bigint not null check (amount > 0),  -- Cent
  status     public.milestone_status not null default 'pending',
  proof_url  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deal_milestones_position_key unique (deal_id, position)
);

comment on table public.deal_milestones is
  'Meilensteine eines Deals (Beträge in Cent, Summe = deals.amount_total). Submit/Approve/Auszahlung folgt mit M6 (Stripe-Escrow).';

create index deal_milestones_deal_idx on public.deal_milestones (deal_id, position);

create trigger deal_milestones_set_updated_at
  before update on public.deal_milestones
  for each row execute function public.set_updated_at();

-- ---- contracts ---------------------------------------------------------------
create table public.contracts (
  id                  uuid primary key default gen_random_uuid(),
  deal_id             uuid not null unique references public.deals (id) on delete cascade,
  template_version    text not null default 'v1',
  content             jsonb not null,  -- strukturierter Vertrags-Snapshot; Text rendert lib/contracts (// TODO: rechtlich prüfen)
  sponsor_accepted_at timestamptz,
  sponsee_accepted_at timestamptz,
  pdf_url             text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.contracts is
  'Vertrag je Deal: content = aus der Vorlage befüllter Snapshot der Konditionen; beidseitige digitale Zustimmung via accept_contract(). // TODO: rechtlich prüfen';

create trigger contracts_set_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

-- ---- notifications: neue Deal-Ereignistypen ---------------------------------
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'new_message',
    'deal_proposed', 'deal_countered', 'contract_accepted', 'deal_status_changed'
  ));

-- ---- RLS: nur die beiden Beteiligten lesen; schreiben nur die Funktionen ----
alter table public.deals enable row level security;

create policy "deals_select_participants"
  on public.deals for select
  to authenticated
  using (
    public.owns_profile(sponsor_profile_id)
    or public.owns_profile(sponsee_profile_id)
  );

revoke all on table public.deals from anon;
grant select on table public.deals to authenticated;

alter table public.deal_milestones enable row level security;

create policy "deal_milestones_select_participants"
  on public.deal_milestones for select
  to authenticated
  using (
    exists (
      select 1 from public.deals d
      where d.id = deal_id
        and (
          public.owns_profile(d.sponsor_profile_id)
          or public.owns_profile(d.sponsee_profile_id)
        )
    )
  );

revoke all on table public.deal_milestones from anon;
grant select on table public.deal_milestones to authenticated;

alter table public.contracts enable row level security;

create policy "contracts_select_participants"
  on public.contracts for select
  to authenticated
  using (
    exists (
      select 1 from public.deals d
      where d.id = deal_id
        and (
          public.owns_profile(d.sponsor_profile_id)
          or public.owns_profile(d.sponsee_profile_id)
        )
    )
  );

revoke all on table public.contracts from anon;
grant select on table public.contracts to authenticated;

-- =====================================================================
-- Interne Helfer (kein Execute-Grant für Clients)
-- =====================================================================

-- Profil des angemeldeten Nutzers (nicht gelöscht).
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id from public.profiles p
  where p.user_id = auth.uid() and p.deleted_at is null;
$$;

revoke execute on function public.current_profile_id() from public, anon, authenticated;

-- Provision in Cent: round half away from zero (numerisches round),
-- identisch gespiegelt in lib/deals/commission.ts.
create or replace function public.calc_commission_amount(p_amount_total bigint, p_pct numeric)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select round(p_amount_total * p_pct / 100)::bigint;
$$;

revoke execute on function public.calc_commission_amount(bigint, numeric) from public, anon, authenticated;

-- Meilensteine validieren (1–20, Titel 3–120, amount > 0, Summe = Gesamtbetrag).
create or replace function public.validate_deal_milestones(p_milestones jsonb, p_amount_total bigint)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  v_count int;
  v_sum bigint := 0;
  v_m jsonb;
  v_title text;
  v_amount bigint;
begin
  if p_milestones is null or jsonb_typeof(p_milestones) <> 'array' then
    raise exception 'Meilensteine müssen als Liste übergeben werden.';
  end if;
  v_count := jsonb_array_length(p_milestones);
  if v_count < 1 or v_count > 20 then
    raise exception 'Ein Deal braucht 1 bis 20 Meilensteine.';
  end if;
  for v_m in select * from jsonb_array_elements(p_milestones) loop
    v_title := btrim(coalesce(v_m->>'title', ''));
    if char_length(v_title) < 3 or char_length(v_title) > 120 then
      raise exception 'Meilenstein-Titel müssen 3 bis 120 Zeichen haben.';
    end if;
    v_amount := (v_m->>'amount')::bigint;
    if v_amount is null or v_amount <= 0 then
      raise exception 'Meilenstein-Beträge müssen über 0 liegen.';
    end if;
    -- due_date optional; ungültige Werte scheitern am Cast.
    perform nullif(v_m->>'due_date', '')::date;
    v_sum := v_sum + v_amount;
  end loop;
  if v_sum <> p_amount_total then
    raise exception 'Die Summe der Meilensteine (%) muss dem Gesamtbetrag (%) entsprechen.', v_sum, p_amount_total;
  end if;
end;
$$;

revoke execute on function public.validate_deal_milestones(jsonb, bigint) from public, anon, authenticated;

-- Vertrags-Snapshot aus dem aktuellen Deal-Stand bauen (Vorlage v1).
create or replace function public.build_contract_content(p_deal_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'template_version', 'v1',
    'created_at', now(),
    'deal', jsonb_build_object(
      'id', d.id,
      'title', d.title,
      'description', d.description,
      'amount_total', d.amount_total,
      'currency', d.currency,
      'commission_pct', d.commission_pct,
      'commission_amount', d.commission_amount,
      'payout_amount', d.amount_total - d.commission_amount,
      'listing_id', d.listing_id
    ),
    'sponsor', jsonb_build_object(
      'profile_id', sp.id,
      'display_name', sp.display_name,
      'company_name', spr.company_name
    ),
    'sponsee', jsonb_build_object(
      'profile_id', se.id,
      'display_name', se.display_name
    ),
    'milestones', coalesce((
      select jsonb_agg(jsonb_build_object(
        'position', m.position,
        'title', m.title,
        'amount', m.amount,
        'due_date', m.due_date
      ) order by m.position)
      from public.deal_milestones m
      where m.deal_id = d.id
    ), '[]'::jsonb)
  )
  from public.deals d
  join public.profiles sp on sp.id = d.sponsor_profile_id
  join public.profiles se on se.id = d.sponsee_profile_id
  left join public.sponsor_profiles spr on spr.profile_id = d.sponsor_profile_id
  where d.id = p_deal_id;
$$;

revoke execute on function public.build_contract_content(uuid) from public, anon, authenticated;

-- Notification an einen Beteiligten (läuft als Owner an RLS vorbei).
create or replace function public.notify_deal_event(
  p_recipient uuid,
  p_type text,
  p_deal_id uuid,
  p_conversation_id uuid,
  p_actor uuid,
  p_extra jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (profile_id, type, payload)
  values (
    p_recipient,
    p_type,
    jsonb_build_object(
      'deal_id', p_deal_id,
      'conversation_id', p_conversation_id,
      'actor_profile_id', p_actor
    ) || p_extra
  );
$$;

revoke execute on function public.notify_deal_event(uuid, text, uuid, uuid, uuid, jsonb) from public, anon, authenticated;

-- =====================================================================
-- API-Funktionen (Execute-Grant für authenticated)
-- =====================================================================

-- Deal aus einer Konversation heraus vorschlagen: friert die Provision ein,
-- legt Meilensteine + Vertrag an und benachrichtigt die Gegenseite.
create or replace function public.create_deal(
  p_conversation_id uuid,
  p_title text,
  p_description text,
  p_amount_total bigint,
  p_milestones jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := public.current_profile_id();
  v_conv public.conversations%rowtype;
  v_pct numeric;
  v_deal_id uuid;
  v_recipient uuid;
  v_m jsonb;
  v_pos int := 0;
begin
  if v_me is null then
    raise exception 'Nicht angemeldet.';
  end if;

  select * into v_conv from public.conversations where id = p_conversation_id;
  if v_conv.id is null or v_me not in (v_conv.sponsor_profile_id, v_conv.sponsee_profile_id) then
    raise exception 'Konversation nicht gefunden oder kein Zugriff.';
  end if;

  if exists (
    select 1 from public.deals d
    where d.conversation_id = p_conversation_id
      and d.status not in ('declined', 'cancelled', 'completed')
  ) then
    raise exception 'Für diese Konversation läuft bereits ein Deal.';
  end if;

  select (value->>'pct')::numeric into v_pct
    from public.platform_settings where key = 'commission_pct';
  if v_pct is null then
    raise exception 'Provisionssatz ist nicht konfiguriert (platform_settings.commission_pct).';
  end if;

  perform public.validate_deal_milestones(p_milestones, p_amount_total);

  insert into public.deals (
    conversation_id, listing_id, sponsor_profile_id, sponsee_profile_id,
    proposed_by_profile_id, title, description, amount_total,
    commission_pct, commission_amount, status
  ) values (
    v_conv.id, v_conv.listing_id, v_conv.sponsor_profile_id, v_conv.sponsee_profile_id,
    v_me, btrim(p_title), btrim(p_description), p_amount_total,
    v_pct, public.calc_commission_amount(p_amount_total, v_pct), 'offered'
  )
  returning id into v_deal_id;

  for v_m in select * from jsonb_array_elements(p_milestones) loop
    v_pos := v_pos + 1;
    insert into public.deal_milestones (deal_id, position, title, due_date, amount)
    values (
      v_deal_id, v_pos, btrim(v_m->>'title'),
      nullif(v_m->>'due_date', '')::date, (v_m->>'amount')::bigint
    );
  end loop;

  insert into public.contracts (deal_id, template_version, content)
  values (v_deal_id, 'v1', public.build_contract_content(v_deal_id));

  v_recipient := case when v_me = v_conv.sponsor_profile_id
    then v_conv.sponsee_profile_id else v_conv.sponsor_profile_id end;
  perform public.notify_deal_event(v_recipient, 'deal_proposed', v_deal_id, v_conv.id, v_me);

  return v_deal_id;
end;
$$;

revoke execute on function public.create_deal(uuid, text, text, bigint, jsonb) from public, anon;
grant execute on function public.create_deal(uuid, text, text, bigint, jsonb) to authenticated;

-- Gegenangebot: Konditionen + Meilensteine ersetzen, Vertrag neu befüllen,
-- Zustimmungen zurücksetzen. Provisionssatz bleibt eingefroren.
create or replace function public.counter_deal_offer(
  p_deal_id uuid,
  p_title text,
  p_description text,
  p_amount_total bigint,
  p_milestones jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := public.current_profile_id();
  v_deal public.deals%rowtype;
  v_recipient uuid;
  v_m jsonb;
  v_pos int := 0;
begin
  if v_me is null then
    raise exception 'Nicht angemeldet.';
  end if;

  select * into v_deal from public.deals where id = p_deal_id for update;
  if v_deal.id is null or v_me not in (v_deal.sponsor_profile_id, v_deal.sponsee_profile_id) then
    raise exception 'Deal nicht gefunden oder kein Zugriff.';
  end if;
  if v_deal.status not in ('draft', 'offered', 'negotiating') then
    raise exception 'In Status % sind keine Änderungen am Angebot mehr möglich.', v_deal.status;
  end if;

  perform public.validate_deal_milestones(p_milestones, p_amount_total);

  update public.deals set
    title = btrim(p_title),
    description = btrim(p_description),
    amount_total = p_amount_total,
    commission_amount = public.calc_commission_amount(p_amount_total, commission_pct),
    proposed_by_profile_id = v_me,
    status = 'negotiating'
  where id = p_deal_id;

  delete from public.deal_milestones where deal_id = p_deal_id;
  for v_m in select * from jsonb_array_elements(p_milestones) loop
    v_pos := v_pos + 1;
    insert into public.deal_milestones (deal_id, position, title, due_date, amount)
    values (
      p_deal_id, v_pos, btrim(v_m->>'title'),
      nullif(v_m->>'due_date', '')::date, (v_m->>'amount')::bigint
    );
  end loop;

  update public.contracts set
    content = public.build_contract_content(p_deal_id),
    sponsor_accepted_at = null,
    sponsee_accepted_at = null
  where deal_id = p_deal_id;

  v_recipient := case when v_me = v_deal.sponsor_profile_id
    then v_deal.sponsee_profile_id else v_deal.sponsor_profile_id end;
  perform public.notify_deal_event(v_recipient, 'deal_countered', p_deal_id, v_deal.conversation_id, v_me);
end;
$$;

revoke execute on function public.counter_deal_offer(uuid, text, text, bigint, jsonb) from public, anon;
grant execute on function public.counter_deal_offer(uuid, text, text, bigint, jsonb) to authenticated;

-- Zentrale Statusmaschine (vgl. PLAN.md §3):
-- draft → offered → negotiating → agreed → funded → in_progress → completed
-- Seitenpfade: declined (nur Gegenseite des Angebots), cancelled (vor funded,
-- mit Begründung), disputed (aus funded/in_progress).
-- 'agreed' verlangt beidseitige Vertragszustimmung und wird regulär über
-- accept_contract() erreicht.
create or replace function public.advance_deal_status(
  p_deal_id uuid,
  p_new_status public.deal_status,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := public.current_profile_id();
  v_deal public.deals%rowtype;
  v_contract public.contracts%rowtype;
  v_recipient uuid;
  v_allowed boolean;
begin
  if v_me is null then
    raise exception 'Nicht angemeldet.';
  end if;

  select * into v_deal from public.deals where id = p_deal_id for update;
  if v_deal.id is null or v_me not in (v_deal.sponsor_profile_id, v_deal.sponsee_profile_id) then
    raise exception 'Deal nicht gefunden oder kein Zugriff.';
  end if;

  v_allowed := case v_deal.status
    when 'draft'       then p_new_status in ('offered', 'cancelled')
    when 'offered'     then p_new_status in ('negotiating', 'agreed', 'declined', 'cancelled')
    when 'negotiating' then p_new_status in ('agreed', 'declined', 'cancelled')
    when 'agreed'      then p_new_status in ('funded', 'cancelled')
    when 'funded'      then p_new_status in ('in_progress', 'disputed')
    when 'in_progress' then p_new_status in ('completed', 'disputed')
    else false
  end;
  if not v_allowed then
    raise exception 'Statuswechsel % → % ist nicht erlaubt.', v_deal.status, p_new_status;
  end if;

  if p_new_status = 'declined' and v_me = v_deal.proposed_by_profile_id then
    raise exception 'Das eigene Angebot kann nicht abgelehnt werden — nutze Stornieren.';
  end if;

  if p_new_status = 'cancelled' and (p_reason is null or btrim(p_reason) = '') then
    raise exception 'Zum Stornieren braucht es eine Begründung.';
  end if;

  if p_new_status = 'agreed' then
    select * into v_contract from public.contracts where deal_id = p_deal_id;
    if v_contract.sponsor_accepted_at is null or v_contract.sponsee_accepted_at is null then
      raise exception 'Beide Seiten müssen dem Vertrag zustimmen, bevor der Deal zustande kommt.';
    end if;
  end if;

  if p_new_status = 'completed' and exists (
    select 1 from public.deal_milestones m
    where m.deal_id = p_deal_id and m.status not in ('approved', 'paid')
  ) then
    raise exception 'Alle Meilensteine müssen freigegeben sein, bevor der Deal abgeschlossen werden kann.';
  end if;

  update public.deals set
    status = p_new_status,
    cancelled_reason = case when p_new_status = 'cancelled' then btrim(p_reason) else cancelled_reason end
  where id = p_deal_id;

  v_recipient := case when v_me = v_deal.sponsor_profile_id
    then v_deal.sponsee_profile_id else v_deal.sponsor_profile_id end;
  perform public.notify_deal_event(
    v_recipient, 'deal_status_changed', p_deal_id, v_deal.conversation_id, v_me,
    jsonb_build_object('old_status', v_deal.status, 'new_status', p_new_status)
  );
end;
$$;

revoke execute on function public.advance_deal_status(uuid, public.deal_status, text) from public, anon;
grant execute on function public.advance_deal_status(uuid, public.deal_status, text) to authenticated;

-- Digitale Zustimmung zum Vertrag; sind beide Seiten einverstanden,
-- wechselt der Deal automatisch auf 'agreed' (über die Statusmaschine).
create or replace function public.accept_contract(p_deal_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := public.current_profile_id();
  v_deal public.deals%rowtype;
  v_contract public.contracts%rowtype;
  v_recipient uuid;
  v_is_sponsor boolean;
begin
  if v_me is null then
    raise exception 'Nicht angemeldet.';
  end if;

  select * into v_deal from public.deals where id = p_deal_id for update;
  if v_deal.id is null or v_me not in (v_deal.sponsor_profile_id, v_deal.sponsee_profile_id) then
    raise exception 'Deal nicht gefunden oder kein Zugriff.';
  end if;
  if v_deal.status not in ('offered', 'negotiating') then
    raise exception 'In Status % kann dem Vertrag nicht zugestimmt werden.', v_deal.status;
  end if;

  select * into v_contract from public.contracts where deal_id = p_deal_id;
  if v_contract.id is null then
    raise exception 'Zum Deal existiert kein Vertrag.';
  end if;

  v_is_sponsor := (v_me = v_deal.sponsor_profile_id);
  if (v_is_sponsor and v_contract.sponsor_accepted_at is not null)
     or (not v_is_sponsor and v_contract.sponsee_accepted_at is not null) then
    raise exception 'Du hast dem Vertrag bereits zugestimmt.';
  end if;

  if v_is_sponsor then
    update public.contracts set sponsor_accepted_at = now() where deal_id = p_deal_id
      returning * into v_contract;
  else
    update public.contracts set sponsee_accepted_at = now() where deal_id = p_deal_id
      returning * into v_contract;
  end if;

  v_recipient := case when v_is_sponsor
    then v_deal.sponsee_profile_id else v_deal.sponsor_profile_id end;
  perform public.notify_deal_event(v_recipient, 'contract_accepted', p_deal_id, v_deal.conversation_id, v_me);

  if v_contract.sponsor_accepted_at is not null and v_contract.sponsee_accepted_at is not null then
    perform public.advance_deal_status(p_deal_id, 'agreed');
  end if;
end;
$$;

revoke execute on function public.accept_contract(uuid) from public, anon;
grant execute on function public.accept_contract(uuid) to authenticated;
