-- Migration 1: Create Forum/Webboard Tables with RLS Policies
-- Copy-paste this entire SQL into Supabase SQL Editor and run it

create extension if not exists "uuid-ossp";

-- Create forum_topics table
create table public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  category text default 'general' check (category in ('general', 'question', 'review', 'shopping')),
  image_url text,
  views integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create forum_likes table
create table public.forum_likes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.forum_topics(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(topic_id, user_id)
);

-- Create forum_replies table
create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.forum_topics(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.forum_topics enable row level security;
alter table public.forum_likes enable row level security;
alter table public.forum_replies enable row level security;

-- RLS Policies for forum_topics
create policy "Anyone can view active topics"
  on public.forum_topics for select
  using (is_active = true);

create policy "Authenticated users can create topics"
  on public.forum_topics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own topics"
  on public.forum_topics for update
  using (auth.uid() = user_id);

create policy "Users can delete own topics"
  on public.forum_topics for delete
  using (auth.uid() = user_id);

-- RLS Policies for forum_likes
create policy "Anyone can view likes"
  on public.forum_likes for select
  using (true);

create policy "Authenticated users can like topics"
  on public.forum_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike topics"
  on public.forum_likes for delete
  using (auth.uid() = user_id);

-- RLS Policies for forum_replies
create policy "Anyone can view replies"
  on public.forum_replies for select
  using (true);

create policy "Authenticated users can reply"
  on public.forum_replies for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own replies"
  on public.forum_replies for delete
  using (auth.uid() = user_id);

-- Create indexes for performance
create index idx_forum_topics_user_id on public.forum_topics(user_id);
create index idx_forum_topics_category on public.forum_topics(category);
create index idx_forum_topics_created_at on public.forum_topics(created_at desc);
create index idx_forum_likes_topic_id on public.forum_likes(topic_id);
create index idx_forum_replies_topic_id on public.forum_replies(topic_id);

-- Verify tables created successfully
select count(*) as tables_created from information_schema.tables 
where table_schema = 'public' and table_name like 'forum%';
