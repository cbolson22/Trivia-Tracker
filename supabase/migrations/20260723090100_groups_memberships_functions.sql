-- membership-check helpers (used inside RLS policies)
create or replace function public.is_group_member(p_group_id uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_owner(p_group_id uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships
    where group_id = p_group_id and user_id = auth.uid() and role = 'owner'
  );
$$;

revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.is_group_owner(uuid) from public;

-- invite code generation (6 chars, unambiguous alphabet, retry-until-unique)
create or replace function public.generate_invite_code(p_length int default 6)
returns text language plpgsql
set search_path = public, pg_temp
as $$
declare
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
begin
  for i in 1..p_length loop
    result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.generate_unique_invite_code()
returns text language plpgsql
set search_path = public, pg_temp
as $$
declare
  candidate text;
  tries     int := 0;
begin
  loop
    candidate := public.generate_invite_code(6);
    tries := tries + 1;
    exit when not exists (select 1 from public.groups where invite_code = candidate);
    if tries > 20 then
      raise exception 'Could not generate a unique invite code';
    end if;
  end loop;
  return candidate;
end;
$$;

revoke all on function public.generate_invite_code(int) from public;
revoke all on function public.generate_unique_invite_code() from public;

-- public-facing RPCs
create or replace function public.create_group(p_name text)
returns public.groups language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_group   public.groups;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Group name is required';
  end if;

  insert into public.groups (name, invite_code, created_by)
  values (trim(p_name), public.generate_unique_invite_code(), v_user_id)
  returning * into v_group;

  insert into public.memberships (group_id, user_id, role)
  values (v_group.id, v_user_id, 'owner');

  return v_group;
end;
$$;

create or replace function public.join_group_by_code(p_invite_code text)
returns public.groups language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_group   public.groups;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_group from public.groups
  where invite_code = upper(trim(p_invite_code));

  if not found then
    raise exception 'Invalid invite code';
  end if;

  insert into public.memberships (group_id, user_id, role)
  values (v_group.id, v_user_id, 'member')
  on conflict (group_id, user_id) do nothing;

  return v_group;
end;
$$;

create or replace function public.list_group_members(p_group_id uuid)
returns table (user_id uuid, email text, role text, joined_at timestamptz)
language plpgsql security definer stable
set search_path = public, pg_temp
as $$
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'Not a member of this group';
  end if;

  return query
    select m.user_id, u.email::text, m.role, m.joined_at
    from public.memberships m
    join auth.users u on u.id = m.user_id
    where m.group_id = p_group_id
    order by m.joined_at asc;
end;
$$;

revoke all on function public.create_group(text) from public;
revoke all on function public.join_group_by_code(text) from public;
revoke all on function public.list_group_members(uuid) from public;

grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group_by_code(text) to authenticated;
grant execute on function public.list_group_members(uuid) to authenticated;
