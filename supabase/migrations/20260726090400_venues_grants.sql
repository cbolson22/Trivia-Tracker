grant select, insert, update, delete on public.venues to authenticated;

grant execute on function public.longitude(public.venues) to authenticated;
grant execute on function public.latitude(public.venues) to authenticated;
