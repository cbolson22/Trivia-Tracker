alter table public.groups enable row level security;
alter table public.memberships enable row level security;

create policy groups_select_members
  on public.groups for select to authenticated
  using ( public.is_group_member(id) );

create policy groups_update_owner
  on public.groups for update to authenticated
  using ( public.is_group_owner(id) )
  with check ( public.is_group_owner(id) );

create policy groups_delete_owner
  on public.groups for delete to authenticated
  using ( public.is_group_owner(id) );

create policy memberships_select_members
  on public.memberships for select to authenticated
  using ( public.is_group_member(group_id) );

-- No insert policy for `authenticated` on either table — the only way to
-- write a row is create_group() / join_group_by_code(), which run as the
-- function owner and bypass RLS internally.
