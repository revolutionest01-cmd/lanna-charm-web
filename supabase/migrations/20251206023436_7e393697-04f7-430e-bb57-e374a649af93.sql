-- Update handle_new_user function to capture avatar_url from Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id, 
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'display_name', 
      new.email
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  
  -- Give first user admin role
  if (select count(*) from auth.users) = 1 then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin');
  else
    -- All other users get 'user' role by default
    insert into public.user_roles (user_id, role)
    values (new.id, 'user');
  end if;
  
  return new;
end;
$$;