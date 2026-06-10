-- ============================================================
-- TRG SOCIAL  |  Supabase Schema
-- Social media + reviews manager for the 7 TRG restaurants.
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- NOTE: This is a SEPARATE Supabase project from TRG Purchasing / Maintenance.
-- ============================================================

-- 1. LOCATIONS (the 7 TRG restaurants)
create table locations (
  id            serial primary key,
  name          text not null unique,
  code          text not null unique,
  sells_alcohol boolean not null default false,
  active        boolean not null default true
);

insert into locations (name, code, sells_alcohol) values
  ('The Benediction', 'TB', false),
  ('Toast Whittier',  'TW', false),
  ('Story Whittier',  'SW', true),
  ('Story Anaheim',   'SA', true),
  ('Story Brea',      'SB', true),
  ('Benny and Marys', 'BM', true),
  ('Toast Downey',    'TD', true);

-- 2. PROFILES (extends Supabase auth.users)
create table profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text not null,
  email       text,
  role        text not null default 'staff' check (role in ('admin','manager','staff')),
  location_id integer references locations(id),
  active      boolean not null default true,
  created_at  timestamptz default now()
);

-- Auto-create a profile on signup (role + restaurant come from user metadata)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email, role, location_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'staff'),
    nullif(new.raw_user_meta_data->>'location_id', '')::int
  )
  on conflict (id) do update
    set full_name = excluded.full_name, email = excluded.email,
        role = excluded.role, location_id = excluded.location_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 3. CONNECTED_ACCOUNTS (one row per platform per location)
create table connected_accounts (
  id             serial primary key,
  location_id    integer not null references locations(id) on delete cascade,
  platform       text not null check (platform in ('google','yelp','facebook','instagram','squarespace','opentable','tripadvisor')),
  external_id    text,                 -- the platform's id for this page/profile/business
  display_name   text,                 -- e.g. the Facebook Page name
  username       text,                 -- e.g. the @instagram handle
  profile_url    text,
  status         text not null default 'disconnected' check (status in ('connected','disconnected','error')),
  connected_at   timestamptz,
  last_synced_at timestamptz,
  created_at     timestamptz default now(),
  unique (location_id, platform)
);

-- 3b. ACCOUNT_SECRETS (OAuth tokens; NEVER exposed to the browser)
-- RLS is enabled below with NO policies, so only the service_role key
-- (used by server-side Edge Functions) can read or write these rows.
-- The frontend / anon key literally cannot see token columns.
create table account_secrets (
  account_id       integer primary key references connected_accounts(id) on delete cascade,
  access_token     text,
  refresh_token    text,
  token_expires_at timestamptz,
  scopes           text,
  updated_at       timestamptz default now()
);

-- 4. REVIEWS (Google + Yelp)
create table reviews (
  id            serial primary key,
  location_id   integer not null references locations(id) on delete cascade,
  platform      text not null check (platform in ('google','yelp','opentable','tripadvisor')),
  external_id   text,                 -- platform review id (for de-duping)
  author_name   text,
  author_avatar text,
  rating        integer check (rating between 1 and 5),
  body          text,
  review_url    text,
  review_date   timestamptz,
  status        text not null default 'new' check (status in ('new','replied','archived')),
  reply_body    text,
  replied_at    timestamptz,
  replied_by    uuid references profiles(id),
  fetched_at    timestamptz default now(),
  unique (platform, external_id)
);

-- 5. MESSAGES (Instagram + Facebook: comments and DMs)
create table messages (
  id            serial primary key,
  location_id   integer not null references locations(id) on delete cascade,
  platform      text not null check (platform in ('facebook','instagram','squarespace')),
  kind          text not null check (kind in ('comment','dm','form')),
  external_id   text,
  thread_id     text,
  author_name   text,
  author_handle text,
  body          text,
  permalink     text,
  message_date  timestamptz,
  status        text not null default 'new' check (status in ('new','replied','archived')),
  reply_body    text,
  replied_at    timestamptz,
  replied_by    uuid references profiles(id),
  fetched_at    timestamptz default now(),
  unique (platform, external_id)
);

-- 6. POSTS (content to publish to Facebook / Instagram)
create table posts (
  id            serial primary key,
  caption       text,
  media_url     text,                 -- image or video to publish
  status        text not null default 'draft' check (status in ('draft','scheduled','published','failed')),
  scheduled_at  timestamptz,
  published_at  timestamptz,
  created_by    uuid references profiles(id),
  created_at    timestamptz default now()
);

-- 6b. POST_TARGETS (which location + platform each post is sent to)
create table post_targets (
  id               serial primary key,
  post_id          integer not null references posts(id) on delete cascade,
  location_id      integer not null references locations(id) on delete cascade,
  platform         text not null check (platform in ('facebook','instagram')),
  status           text not null default 'pending' check (status in ('pending','published','failed')),
  external_post_id text,
  error            text
);

-- 7. ACTIVITY (audit log: who replied/posted what, and when)
create table activity (
  id          serial primary key,
  actor       text,
  action      text not null,
  target      text,
  location_id integer references locations(id),
  at          timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
--   admin   -> sees & manages ALL restaurants, connects accounts, manages users
--   manager -> sees & manages ONLY their restaurant (reviews, messages, posts)
--   staff   -> sees & manages ONLY their restaurant (reviews, messages, posts)
-- ============================================================
alter table profiles           enable row level security;
alter table locations          enable row level security;
alter table connected_accounts enable row level security;
alter table account_secrets    enable row level security;  -- NO policies on purpose (service_role only)
alter table reviews            enable row level security;
alter table messages           enable row level security;
alter table posts              enable row level security;
alter table post_targets       enable row level security;
alter table activity           enable row level security;

-- Helper functions (SECURITY DEFINER so they bypass RLS and avoid recursion)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and active = true);
$$;

create or replace function public.can_access_location(loc integer)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.active = true
      and (p.role = 'admin' or p.location_id = loc)
  );
$$;

-- profiles: read own + admins read all; admins manage all
create policy "profiles_select" on profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_write" on profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- locations: any signed-in user reads; admins manage
create policy "locations_select" on locations for select to authenticated using (true);
create policy "locations_admin_write" on locations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- connected_accounts: scoped read; only admins connect/disconnect (setup task)
create policy "accounts_select" on connected_accounts for select to authenticated
  using (public.can_access_location(location_id));
create policy "accounts_admin_write" on connected_accounts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- reviews + messages: scoped to the user's restaurant (admins see all); they can reply
create policy "reviews_access" on reviews for all to authenticated
  using (public.can_access_location(location_id)) with check (public.can_access_location(location_id));
create policy "messages_access" on messages for all to authenticated
  using (public.can_access_location(location_id)) with check (public.can_access_location(location_id));

-- posts: everyone signed in can see + create; only the author or an admin can edit/delete
create policy "posts_select" on posts for select to authenticated using (true);
create policy "posts_insert" on posts for insert to authenticated with check (true);
create policy "posts_update" on posts for update to authenticated
  using (created_by = auth.uid() or public.is_admin()) with check (created_by = auth.uid() or public.is_admin());
create policy "posts_delete" on posts for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- post_targets: access follows the parent post
create policy "post_targets_select" on post_targets for select to authenticated using (true);
create policy "post_targets_write" on post_targets for all to authenticated
  using (exists (select 1 from posts p where p.id = post_id and (p.created_by = auth.uid() or public.is_admin())))
  with check (exists (select 1 from posts p where p.id = post_id and (p.created_by = auth.uid() or public.is_admin())));

-- activity: any signed-in user can read the log and add entries
create policy "activity_select" on activity for select to authenticated using (true);
create policy "activity_insert" on activity for insert to authenticated with check (true);
