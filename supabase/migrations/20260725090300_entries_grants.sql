-- entries: authenticated can read, insert, update, and delete rows.
-- RLS policies enforce which rows each operation applies to.
grant select, insert, update, delete on public.entries to authenticated;

-- RLS policies on entries call this helper, so authenticated needs EXECUTE.
grant execute on function public.group_allows_member_edits(uuid) to authenticated;
