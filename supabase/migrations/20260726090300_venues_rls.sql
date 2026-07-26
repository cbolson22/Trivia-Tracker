alter table public.venues enable row level security;

create policy venues_select_members
  on public.venues for select to authenticated
  using ( public.is_group_member(group_id) );

create policy venues_insert_members
  on public.venues for insert to authenticated
  with check ( public.is_group_member(group_id) );

create policy venues_update_members
  on public.venues for update to authenticated
  using ( public.is_group_member(group_id) )
  with check ( public.is_group_member(group_id) );

create policy venues_delete_members
  on public.venues for delete to authenticated
  using ( public.is_group_member(group_id) );
