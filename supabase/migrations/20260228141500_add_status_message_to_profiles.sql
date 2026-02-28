alter table public.profiles
add column if not exists status_message text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_status_message_length_check'
  ) then
    alter table public.profiles
      add constraint profiles_status_message_length_check
      check (status_message is null or char_length(status_message) <= 80);
  end if;
end
$$;