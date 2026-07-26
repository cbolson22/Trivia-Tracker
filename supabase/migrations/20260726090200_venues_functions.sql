-- PostgREST computed columns. NOT security definer — these only compute a
-- value from a row the caller already has SELECT access to via venues' own
-- RLS, so no privilege elevation is needed (unlike is_group_member/
-- is_group_owner/group_allows_member_edits, which read OTHER rows the
-- caller may not directly have access to).
create or replace function public.longitude(v public.venues)
returns double precision language sql stable
set search_path = public, extensions, pg_temp
as $$
  select ST_X(v.location::geometry);
$$;

create or replace function public.latitude(v public.venues)
returns double precision language sql stable
set search_path = public, extensions, pg_temp
as $$
  select ST_Y(v.location::geometry);
$$;

revoke all on function public.longitude(public.venues) from public;
revoke all on function public.latitude(public.venues) from public;
