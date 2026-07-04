-- =====================================================================
-- M4: conversations + messages + notifications (vgl. PLAN.md §3, §5 M4).
-- RLS: Konversationen und Nachrichten sehen nur die beiden Beteiligten
-- (bewusst KEIN Admin-Zugriff — Privatsphäre der Chats).
-- Realtime für messages via Publication supabase_realtime.
-- =====================================================================

-- ---- conversations ----------------------------------------------------
create table public.conversations (
  id                 uuid primary key default gen_random_uuid(),
  listing_id         uuid references public.listings (id) on delete set null,
  sponsor_profile_id uuid not null references public.profiles (id) on delete cascade,
  sponsee_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint conversations_distinct_participants
    check (sponsor_profile_id <> sponsee_profile_id)
);

comment on table public.conversations is
  'Klammer für Nachrichten zwischen einem Sponsor- und einem Sponsee-Profil, optional zu einem Listing; ein Deal kann daraus entstehen.';

-- Ein Gesprächsfaden pro Paar+Listing; Konversationen ohne Listing zählen
-- dabei als ein eigener Faden (nulls not distinct, PG15+).
create unique index conversations_pair_listing_key
  on public.conversations (sponsor_profile_id, sponsee_profile_id, listing_id)
  nulls not distinct;

create index conversations_sponsor_idx on public.conversations (sponsor_profile_id);
create index conversations_sponsee_idx on public.conversations (sponsee_profile_id);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- ---- messages ---------------------------------------------------------
create table public.messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references public.conversations (id) on delete cascade,
  sender_profile_id uuid not null references public.profiles (id) on delete cascade,
  body              text not null check (char_length(body) between 1 and 2000),
  read_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.messages is
  'Chat-Nachrichten einer Konversation; read_at wird gesetzt, wenn der Empfänger die Konversation öffnet. Realtime via Publication supabase_realtime.';

create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index messages_unread_idx on public.messages (conversation_id) where read_at is null;

create trigger messages_set_updated_at
  before update on public.messages
  for each row execute function public.set_updated_at();

-- ---- notifications ----------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type       text not null check (type in ('new_message')),
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notifications is
  'In-App-Benachrichtigungen (M4: new_message); E-Mail-Versand folgt in M7 (emailed_at).';

create index notifications_profile_unread_idx
  on public.notifications (profile_id) where read_at is null;

create trigger notifications_set_updated_at
  before update on public.notifications
  for each row execute function public.set_updated_at();

-- ---- Trigger: neue Nachricht → Konversation anfassen + Notification ----
-- Security Definer, weil der Sender weder conversations.updated_at noch
-- fremde notifications schreiben darf (bewusst keine Grants dafür).
create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recipient uuid;
begin
  update public.conversations
    set updated_at = now()
    where id = new.conversation_id;

  select case
      when c.sponsor_profile_id = new.sender_profile_id then c.sponsee_profile_id
      else c.sponsor_profile_id
    end
    into v_recipient
    from public.conversations c
    where c.id = new.conversation_id;

  if v_recipient is not null then
    insert into public.notifications (profile_id, type, payload)
    values (
      v_recipient,
      'new_message',
      jsonb_build_object(
        'conversation_id', new.conversation_id,
        'message_id', new.id,
        'sender_profile_id', new.sender_profile_id
      )
    );
  end if;

  return new;
end;
$$;

revoke execute on function public.handle_new_message() from public, anon, authenticated;

create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- ---- RLS: conversations ------------------------------------------------
alter table public.conversations enable row level security;

create policy "conversations_select_participants"
  on public.conversations for select
  to authenticated
  using (
    public.owns_profile(sponsor_profile_id)
    or public.owns_profile(sponsee_profile_id)
  );

-- Starten darf nur ein Beteiligter; die Rollen müssen zu den Spalten passen
-- und ein referenziertes Listing muss von einem der beiden stammen.
create policy "conversations_insert_participant"
  on public.conversations for insert
  to authenticated
  with check (
    (
      public.owns_profile(sponsor_profile_id)
      or public.owns_profile(sponsee_profile_id)
    )
    and exists (
      select 1 from public.profiles p
      where p.id = sponsor_profile_id and p.role = 'sponsor' and p.deleted_at is null
    )
    and exists (
      select 1 from public.profiles p
      where p.id = sponsee_profile_id and p.role = 'sponsee' and p.deleted_at is null
    )
    and (
      listing_id is null
      or exists (
        select 1 from public.listings l
        where l.id = listing_id
          and l.author_profile_id in (sponsor_profile_id, sponsee_profile_id)
      )
    )
  );

revoke all on table public.conversations from anon;
grant select, insert on table public.conversations to authenticated;

-- ---- RLS: messages ------------------------------------------------------
alter table public.messages enable row level security;

-- Beteiligte lesen alle Nachrichten ihrer Konversationen (die RLS der
-- Subquery auf conversations greift für den anfragenden Nutzer).
create policy "messages_select_participants"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          public.owns_profile(c.sponsor_profile_id)
          or public.owns_profile(c.sponsee_profile_id)
        )
    )
  );

-- Senden nur als eigenes Profil und nur in eigene Konversationen.
create policy "messages_insert_sender"
  on public.messages for insert
  to authenticated
  with check (
    public.owns_profile(sender_profile_id)
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and sender_profile_id in (c.sponsor_profile_id, c.sponsee_profile_id)
    )
  );

-- Gelesen-Status: nur der Empfänger (Beteiligter, aber nicht Sender);
-- der Spalten-Grant unten beschränkt das Update auf read_at.
create policy "messages_update_recipient"
  on public.messages for update
  to authenticated
  using (
    not public.owns_profile(sender_profile_id)
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          public.owns_profile(c.sponsor_profile_id)
          or public.owns_profile(c.sponsee_profile_id)
        )
    )
  );

revoke all on table public.messages from anon;
grant select, insert on table public.messages to authenticated;
grant update (read_at) on table public.messages to authenticated;

-- ---- RLS: notifications --------------------------------------------------
alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (public.owns_profile(profile_id));

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (public.owns_profile(profile_id));

-- Insert nur über den Security-Definer-Trigger (kein Grant für authenticated).
revoke all on table public.notifications from anon;
grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

-- ---- Realtime ------------------------------------------------------------
-- Postgres-Changes respektieren die SELECT-Policies (WALRUS); replica
-- identity full, damit auch UPDATE-Events (read_at) vollständig ankommen.
alter table public.messages replica identity full;
alter publication supabase_realtime add table public.messages;
