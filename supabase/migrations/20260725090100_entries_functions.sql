-- Same SECURITY DEFINER/STABLE/search_path pattern as is_group_member and
-- is_group_owner. Reading allow_member_edits through this helper (rather than
-- an inline subquery on public.groups inside entries' RLS policy) keeps the
-- "helpers read source tables directly, policies call helpers" convention
-- consistent and avoids entries' policy needing to re-evaluate groups' own RLS.
create or replace function public.group_allows_member_edits(p_group_id uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (select allow_member_edits from public.groups where id = p_group_id),
    false
  );
$$;

revoke all on function public.group_allows_member_edits(uuid) from public;
