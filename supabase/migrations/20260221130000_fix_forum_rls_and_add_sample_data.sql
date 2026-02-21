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
