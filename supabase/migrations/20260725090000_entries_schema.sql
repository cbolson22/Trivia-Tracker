-- venue_id is nullable with no FK yet — Phase 4 adds:
-- alter table public.entries add constraint entries_venue_id_fkey
--   foreign key (venue_id) references public.venues (id) on delete set null;
create table public.entries (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  author_id   uuid not null references auth.users (id) on delete cascade default auth.uid(),
  question    text not null check (length(trim(question)) > 0),
  answer      text not null check (length(trim(answer)) > 0),
  category    text,
  source      text,
  heard_on    date,
  venue_id    uuid,
  created_at  timestamptz not null default now()
);

create index entries_group_id_idx on public.entries (group_id);
create index entries_author_id_idx on public.entries (author_id);
create index entries_group_id_created_at_idx on public.entries (group_id, created_at desc);

alter table public.groups
  add column allow_member_edits boolean not null default false;
