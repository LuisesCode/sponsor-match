-- Flenzko — vereinfachtes Abbild des SponsorMatch-Datenmodells (PLAN.md §3)
-- für sql.js (SQLite im Browser). Kein RLS (Single-User-Trust-Kontext),
-- kein Storage/Payments/Verifications/Disputes/Admin (bewusst out of scope,
-- siehe Plan "Nicht im Scope"). Enums als TEXT + CHECK, jsonb als TEXT (JSON).

create table profiles (
  id                     text primary key,
  role                   text not null check (role in ('sponsor','sponsee','admin')),
  display_name           text not null,
  slug                   text not null unique,
  avatar_url             text,
  bio                    text,
  region                 text,
  website                text,
  onboarding_completed   integer not null default 0,
  is_verified            integer not null default 0,
  password_hash          text not null,
  email                  text not null unique,
  created_at             text not null,
  updated_at             text not null
);

create table categories (
  id         text primary key,
  name       text not null,
  slug       text not null unique,
  kind       text not null check (kind in ('sport','industry','creator_niche')),
  parent_id  text references categories(id)
);

create table sponsor_profiles (
  id               text primary key,
  profile_id       text not null unique references profiles(id) on delete cascade,
  company_name     text not null,
  industry_id      text references categories(id),
  company_size     text,
  budget_min       integer,
  budget_max       integer,
  target_audience  text not null default '{}',
  vat_id           text
);

create table sponsee_profiles (
  id               text primary key,
  profile_id       text not null unique references profiles(id) on delete cascade,
  type             text not null check (type in ('athlete','club','creator')),
  category_id      text references categories(id),
  reach_total      integer,
  audience         text not null default '{}',
  social_links     text not null default '{}',
  media_kit_path   text,
  past_sponsors    text not null default '[]',
  price_min        integer,
  price_max        integer
);

create table listings (
  id                  text primary key,
  author_profile_id   text not null references profiles(id) on delete cascade,
  direction           text not null check (direction in ('seeking_sponsor','offering_sponsorship')),
  title               text not null,
  description         text not null,
  category_id         text references categories(id),
  region              text,
  budget_min          integer,
  budget_max          integer,
  reach_required      integer,
  status              text not null default 'active' check (status in ('draft','active','paused','closed')),
  expires_at          text,
  created_at          text not null,
  updated_at          text not null
);

create table conversations (
  id                    text primary key,
  listing_id            text references listings(id) on delete set null,
  sponsor_profile_id    text not null references profiles(id) on delete cascade,
  sponsee_profile_id    text not null references profiles(id) on delete cascade,
  created_at            text not null,
  updated_at            text not null,
  unique (sponsor_profile_id, sponsee_profile_id, listing_id)
);

create table messages (
  id                   text primary key,
  conversation_id      text not null references conversations(id) on delete cascade,
  sender_profile_id    text not null references profiles(id) on delete cascade,
  body                 text not null,
  read_at              text,
  created_at           text not null
);

create table deals (
  id                        text primary key,
  conversation_id           text not null references conversations(id) on delete cascade,
  listing_id                text references listings(id) on delete set null,
  sponsor_profile_id        text not null references profiles(id) on delete cascade,
  sponsee_profile_id        text not null references profiles(id) on delete cascade,
  proposed_by_profile_id    text not null references profiles(id),
  title                     text not null,
  description               text not null,
  amount_total              integer not null,
  currency                  text not null default 'eur',
  commission_pct            real not null,
  commission_amount         integer not null,
  status                    text not null default 'offered' check (status in
    ('draft','offered','negotiating','agreed','funded','in_progress','completed','declined','cancelled','disputed')),
  cancelled_reason          text,
  created_at                text not null,
  updated_at                text not null
);

create table deal_milestones (
  id          text primary key,
  deal_id     text not null references deals(id) on delete cascade,
  position    integer not null,
  title       text not null,
  due_date    text,
  amount      integer not null,
  status      text not null default 'pending' check (status in ('pending','submitted','approved','paid','disputed')),
  proof_url   text
);

create table contracts (
  id                     text primary key,
  deal_id                text not null unique references deals(id) on delete cascade,
  template_version       text not null,
  content                text not null,
  sponsor_accepted_at    text,
  sponsee_accepted_at    text
);

create table platform_settings (
  key     text primary key,
  value   text not null
);

create table notifications (
  id            text primary key,
  profile_id    text not null references profiles(id) on delete cascade,
  type          text not null check (type in
    ('new_message','deal_proposed','deal_countered','contract_accepted','deal_status_changed')),
  payload       text not null default '{}',
  read_at       text,
  created_at    text not null
);

create index idx_listings_status on listings(status);
create index idx_messages_conversation on messages(conversation_id);
create index idx_deals_conversation on deals(conversation_id);
create index idx_notifications_profile on notifications(profile_id, read_at);
