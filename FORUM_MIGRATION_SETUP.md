# Forum Database Setup Instructions

## Overview
The Webboard/Forum feature requires 3 new database tables and RLS policies. The migrations have been created in:
- `supabase/migrations/20260221120000_create_forum_tables.sql`
- `supabase/migrations/20260221130000_fix_forum_rls_and_add_sample_data.sql`

## Option 1: Supabase Dashboard (Recommended for Testing)

### Steps:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/projects/gomjfnkzhxqfmbwmaphz)
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy & paste the SQL from **Migration 1** below
5. Click **Run**
6. Create another new query
7. Copy & paste the SQL from **Migration 2** below
8. Click **Run**

---

## Migration 1: Create Forum Tables

```sql
-- Create forum/webboard tables with proper structure
-- Enable UUID extension
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
  using (is_active = true or public.has_role(auth.uid(), 'admin'));

create policy "Authenticated users can create topics"
  on public.forum_topics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own topics"
  on public.forum_topics for update
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Users can delete own topics"
  on public.forum_topics for delete
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

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
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
create index idx_forum_topics_user_id on public.forum_topics(user_id);
create index idx_forum_topics_category on public.forum_topics(category);
create index idx_forum_topics_created_at on public.forum_topics(created_at desc);
create index idx_forum_likes_topic_id on public.forum_likes(topic_id);
create index idx_forum_replies_topic_id on public.forum_replies(topic_id);
```

---

## Migration 2: Fix RLS Policies & Add Sample Data

```sql
-- Fix RLS policies to work without has_role function
-- Drop existing problematic policies
drop policy if exists "Anyone can view active topics" on public.forum_topics;
drop policy if exists "Authenticated users can create topics" on public.forum_topics;
drop policy if exists "Users can update own topics" on public.forum_topics;
drop policy if exists "Users can delete own topics" on public.forum_topics;
drop policy if exists "Users can delete own replies" on public.forum_replies;

-- Create new RLS policies for forum_topics
create policy "Anyone can view active topics"
  on public.forum_topics for select
  using (is_active = true);

create policy "Admin can view all topics"
  on public.forum_topics for select
  using (auth.uid() in (select user_id from public.user_roles where role = 'admin'));

create policy "Authenticated users can create topics"
  on public.forum_topics for insert
  with check (auth.uid() = user_id and auth.uid() is not null);

create policy "Users can update own topics"
  on public.forum_topics for update
  using (auth.uid() = user_id);

create policy "Admin can update any topic"
  on public.forum_topics for update
  using (auth.uid() in (select user_id from public.user_roles where role = 'admin'));

create policy "Users can delete own topics"
  on public.forum_topics for delete
  using (auth.uid() = user_id);

create policy "Admin can delete any topic"
  on public.forum_topics for delete
  using (auth.uid() in (select user_id from public.user_roles where role = 'admin'));

-- Update RLS policies for forum_replies
create policy "Admin can delete any reply"
  on public.forum_replies for delete
  using (auth.uid() in (select user_id from public.user_roles where role = 'admin'));

-- Disable temporary RLS for batch insert
alter table public.forum_topics disable row level security;
alter table public.forum_likes disable row level security;
alter table public.forum_replies disable row level security;

-- Create sample topics (for testing)
insert into public.forum_topics (user_id, title, content, category, image_url, views, is_active) values
  ('550e8400-e29b-41d4-a716-446655440000', 'ที่คาเฟ่แจ่งสบายดีจริงๆ', 'ชอบมากค่ะที่นี่ ยิ้มแย้มสนใจดี ร้านสะอาดเรียบร้อย', 'review', null, 45, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'เมนูกาแฟแนะนำ', 'ลองกาแฟเอสเพรสโซว่างไช่ แนะนำเลยค่ะ เหมาะมากสำหรับการทำงาน', 'review', null, 67, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'ห้องพักสะอาดและสบาย', 'ห้องพักใหม่ๆ สะอาดมากค่ะ เตียงนอนสบาย มีแอร์ให้หนาวเย็น', 'review', null, 123, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'มีที่จอดรถไม่ต้องกังวล', 'ที่จอดรถพอใจมากค่ะ ที่จอดกว้างสบาย ปลอดภัยด้วยมีกล้องวงจรปิด', 'general', null, 34, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'WiFi เร็วเหมาะทำงาน', 'WiFi ได้ความเร็วดีๆ สามารถทำงานและอัดอพโหลดได้สะดวกมากค่ะ', 'general', null, 56, true);

-- Re-enable RLS
alter table public.forum_topics enable row level security;
alter table public.forum_likes enable row level security;
alter table public.forum_replies enable row level security;
```

---

## Troubleshooting

### RLS Policy Error: "has_role function doesn't exist"
**Fix:** Ensure Migration 2 is applied after Migration 1. Migration 2 replaces the `has_role` references with direct lookups to `user_roles` table.

### Can't see topics in Admin Panel after migration
**Cause:** RLS policies may be blocking queries
**Solution:** 
1. Ensure you're logged in as an admin user
2. Verify `user_roles` table has your user with `role = 'admin'`
3. Check if `is_active = true` in forum_topics

### Sample data shows UUID not valid
**Fix:** The sample data uses UUID `550e8400-e29b-41d4-a716-446655440000`. Create a test user with this ID or replace with your actual test user ID.

---

## Verification

After applying both migrations, verify setup with these SQL queries in the Supabase dashboard:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'forum%';

-- Check sample data
SELECT count(*) as total_topics FROM public.forum_topics;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename LIKE 'forum%';
```

Expected results:
- 3 tables: forum_topics, forum_likes, forum_replies
- 5 sample topics
- rowsecurity = true for all forum tables

---

## Next Steps

1. ✅ Apply both migrations via Supabase Dashboard
2. ✅ Verify sample topics appear in Admin Panel → Webboard tab
3. ✅ Test creating new topics from Forum page
4. ✅ Test liking/commenting functionality
5. ✅ Verify topics persist across page reloads
