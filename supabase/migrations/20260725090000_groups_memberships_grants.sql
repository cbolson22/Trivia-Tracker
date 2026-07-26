-- groups: authenticated can select/update/delete rows (RLS policies restrict which ones).
-- No INSERT grant — create_group() is security definer and handles that.
grant select, update, delete on public.groups to authenticated;

-- memberships: authenticated can only select (join/leave handled by RPCs).
grant select on public.memberships to authenticated;
