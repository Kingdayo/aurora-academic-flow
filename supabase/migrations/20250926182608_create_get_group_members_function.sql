create or replace function get_group_members_with_profiles(p_group_id uuid)
returns table (
  id uuid,
  user_id uuid,
  role text,
  joined_at timestamptz,
  full_name text,
  avatar_url text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
begin
  -- Check if the current user is an admin of the group
  select exists (
    select 1
    from groups
    where id = p_group_id and owner_id = auth.uid()
  ) into is_admin;

  if is_admin then
    return query
    select
      gm.id,
      gm.user_id,
      gm.role,
      gm.joined_at,
      p.full_name,
      p.avatar_url
    from
      group_members gm
      join profiles p on gm.user_id = p.id
    where
      gm.group_id = p_group_id
      and gm.status = 'active'
    order by
      gm.joined_at asc;
  end if;
end;
$$;