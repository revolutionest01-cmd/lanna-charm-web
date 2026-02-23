#!/usr/bin/env node

/**
 * Apply Forum Database Migrations
 * This script applies the forum_topics, forum_likes, forum_replies tables to Supabase
 * 
 * Usage: node apply-forum-migrations.js
 */

// For local testing - read from env or pass credentials
const SUPABASE_URL = "https://gomjfnkzhxqfmbwmaphz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvbWpmbmt6aHhxZm1id21hcGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODc3ODUsImV4cCI6MjA3OTU2Mzc4NX0.wvaGbd9QNo7v-p3WuGX4JPUm4gH0vs0r9gQiCAyvnWw";

console.log("⏳ Attempting to apply forum database migrations...\n");
console.log("⚠️  MANUAL APPROACH REQUIRED:\n");
console.log("Since we don't have service role credentials in this environment,");
console.log("please apply the migrations manually via Supabase Dashboard:\n");

console.log("📍 STEP 1: Go to Supabase Dashboard");
console.log("   URL: https://supabase.com/dashboard/projects/gomjfnkzhxqfmbwmaphz\n");

console.log("📍 STEP 2: Click 'SQL Editor' (left sidebar)\n");

console.log("📍 STEP 3: Click 'New Query'\n");

console.log("📍 STEP 4: Copy & paste this SQL (Migration 1):\n");

const migration1 = `
-- Create forum/webboard tables
create extension if not exists "uuid-ossp";

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

create table public.forum_likes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.forum_topics(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(topic_id, user_id)
);

create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.forum_topics(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table public.forum_topics enable row level security;
alter table public.forum_likes enable row level security;
alter table public.forum_replies enable row level security;

-- RLS Policies
create policy "Anyone can view active topics"
  on public.forum_topics for select using (is_active = true);

create policy "Authenticated users can create topics"
  on public.forum_topics for insert with check (auth.uid() = user_id);

create policy "Users can update own topics"
  on public.forum_topics for update using (auth.uid() = user_id);

create policy "Users can delete own topics"
  on public.forum_topics for delete using (auth.uid() = user_id);

create policy "Anyone can view likes"
  on public.forum_likes for select using (true);

create policy "Authenticated users can like topics"
  on public.forum_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike topics"
  on public.forum_likes for delete using (auth.uid() = user_id);

create policy "Anyone can view replies"
  on public.forum_replies for select using (true);

create policy "Authenticated users can reply"
  on public.forum_replies for insert with check (auth.uid() = user_id);

create policy "Users can delete own replies"
  on public.forum_replies for delete using (auth.uid() = user_id);

create index idx_forum_topics_user_id on public.forum_topics(user_id);
create index idx_forum_topics_category on public.forum_topics(category);
create index idx_forum_topics_created_at on public.forum_topics(created_at desc);
create index idx_forum_likes_topic_id on public.forum_likes(topic_id);
create index idx_forum_replies_topic_id on public.forum_replies(topic_id);
`;

console.log(migration1);

console.log("\n\n📍 STEP 5: Click 'Run' button (wait for success)\n");

console.log("📍 STEP 6: Click 'New Query' again\n");

console.log("📍 STEP 7: Copy & paste this SQL (Migration 2 - Add Sample Data):\n");

const migration2 = `
-- Fix RLS and add sample topics
alter table public.forum_topics disable row level security;

insert into public.forum_topics (user_id, title, content, category, views, is_active) values
  ('550e8400-e29b-41d4-a716-446655440000', 'ที่คาเฟ่แจ่งสบายดีจริงๆ', 'ชอบมากค่ะที่นี่ ยิ้มแย้มสนใจดี ร้านสะอาดเรียบร้อย', 'review', 45, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'เมนูกาแฟแนะนำ', 'ลองกาแฟเอสเพรสโซว่างไช่ แนะนำเลยค่ะ เหมาะมากสำหรับการทำงาน', 'review', 67, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'ห้องพักสะอาดและสบาย', 'ห้องพักใหม่ๆ สะอาดมากค่ะ เตียงนอนสบาย มีแอร์ให้หนาวเย็น', 'review', 123, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'มีที่จอดรถไม่ต้องกังวล', 'ที่จอดรถพอใจมากค่ะ ที่จอดกว้างสบาย ปลอดภัยด้วยมีกล้องวงจรปิด', 'general', 34, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'WiFi เร็วเหมาะทำงาน', 'WiFi ได้ความเร็วดีๆ สามารถทำงานและอัดอพโหลดได้สะดวกมากค่ะ', 'general', 56, true);

alter table public.forum_topics enable row level security;

-- Verify
select count(*) as total_topics from public.forum_topics;
`;

console.log(migration2);

console.log("\n\n📍 STEP 8: Click 'Run' button\n");

console.log("✅ After both queries run successfully:\n");
console.log("   - 5 sample topics will appear in Admin Panel → Webboard");
console.log("   - Forum page will show all topics");
console.log("   - Create/Like/Reply functionality will work\n");

console.log("❓ If you hit any errors:");
console.log("   1. Check that the table doesn't already exist (try running migrations again)");
console.log("   2. Verify you're in the correct Supabase project");
console.log("   3. Check browser console for more details\n");

process.exit(0);
