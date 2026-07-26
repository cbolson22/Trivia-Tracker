-- RLS policies call these helpers on behalf of authenticated users,
-- so authenticated needs EXECUTE even though the functions are security definer.
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_owner(uuid) to authenticated;
