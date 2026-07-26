create table public.venues (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  location    extensions.geography(Point, 4326) not null,
  address     text,
  created_at  timestamptz not null default now()
);

create index venues_group_id_idx on public.venues (group_id);

-- Supports ST_ distance queries per the README's Map Notes section.
create index venues_location_gist_idx on public.venues using gist (location);

-- entries.venue_id was left nullable with no FK by Phase 3, flagged then for
-- this phase to add:
alter table public.entries
  add constraint entries_venue_id_fkey
  foreign key (venue_id) references public.venues (id) on delete set null;

create index entries_venue_id_idx on public.entries (venue_id);
