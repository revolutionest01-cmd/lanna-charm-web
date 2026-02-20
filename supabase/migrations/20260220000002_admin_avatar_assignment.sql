-- Add avatar assignment for new admins
-- This migration adds a trigger to automatically generate random avatars for new admin users

-- Array of avatar emojis
create or replace function public.get_random_avatar()
returns text as $$
declare
  avatars text[] := array['😊', '😄', '😎', '🤩', '😍', 
                           '🥳', '😇', '🤓', '😌', '😏',
                           '👨', '👩', '👴', '👵', '👦',
                           '👧', '🧔', '👱', '🤵', '💼'];
begin
  return avatars[1 + (random() * (array_length(avatars, 1) - 1))::int];
end;
$$ language plpgsql;

-- Update the handle_new_user function to include avatar assignment for admins
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  is_admin boolean;
  avatar_emoji text;
begin
  -- Check if this is the first user (will be admin)
  is_admin := (select count(*) from auth.users) = 1;
  
  -- Generate random avatar for admin, fallback to default for regular users
  if is_admin then
    avatar_emoji := public.get_random_avatar();
  else
    avatar_emoji := '😊'; -- Default avatar for regular users
  end if;
  
  -- Note: avatar_url field can hold either emoji or actual URL
  -- For admins, we store emoji; for regular users, we store Google avatar if available
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id, 
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'display_name', 
      new.email
    ),
    case 
      when is_admin then avatar_emoji
      else coalesce(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture',
        avatar_emoji
      )
    end
  );
  
  -- Assign role
  if is_admin then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role)
    values (new.id, 'user');
  end if;
  
  return new;
end;
$$;
