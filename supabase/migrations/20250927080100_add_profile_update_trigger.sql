-- This migration creates a trigger that updates the public.profiles table
-- whenever a user's metadata is updated in the auth.users table.
-- This ensures that the full_name and avatar_url are kept in sync.

-- 1. Create the trigger function
create or replace function public.update_public_profile_on_user_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Update the corresponding row in public.profiles
  update public.profiles
  set
    full_name = new.raw_user_meta_data->>'full_name',
    avatar_url = new.raw_user_meta_data->>'avatar_url',
    updated_at = now()
  where id = new.id;
  return new;
end;
$$;

-- 2. Create the trigger on the auth.users table
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.update_public_profile_on_user_update();