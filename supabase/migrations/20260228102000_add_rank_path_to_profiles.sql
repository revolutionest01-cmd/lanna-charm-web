alter table public.profiles
add column if not exists rank_path text not null default 'chicken';

alter table public.profiles
drop constraint if exists profiles_rank_path_check;

alter table public.profiles
add constraint profiles_rank_path_check
check (rank_path in ('chicken', 'dog', 'cat'));
