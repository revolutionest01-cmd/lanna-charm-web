alter table public.profiles
add column if not exists rank_path_changed_at timestamptz;
