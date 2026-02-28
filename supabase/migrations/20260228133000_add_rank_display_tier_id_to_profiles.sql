alter table public.profiles
add column if not exists rank_display_tier_id integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_rank_display_tier_id_check'
  ) then
    alter table public.profiles
      add constraint profiles_rank_display_tier_id_check
      check (rank_display_tier_id is null or rank_display_tier_id >= 1);
  end if;
end
$$;