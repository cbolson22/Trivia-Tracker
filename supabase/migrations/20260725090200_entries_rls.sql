alter table public.entries enable row level security;

create policy entries_select_members
  on public.entries for select to authenticated
  using ( public.is_group_member(group_id) );

create policy entries_insert_members
  on public.entries for insert to authenticated
  with check (
    public.is_group_member(group_id)
    and author_id = auth.uid()
  );

create policy entries_update_author_or_permitted
  on public.entries for update to authenticated
  using (
    author_id = auth.uid()
    or (public.is_group_member(group_id) and public.group_allows_member_edits(group_id))
  )
  with check (
    author_id = auth.uid()
    or (public.is_group_member(group_id) and public.group_allows_member_edits(group_id))
  );

create policy entries_delete_author_or_permitted
  on public.entries for delete to authenticated
  using (
    author_id = auth.uid()
    or (public.is_group_member(group_id) and public.group_allows_member_edits(group_id))
  );
