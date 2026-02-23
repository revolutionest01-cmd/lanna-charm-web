-- Migration 2: Add Sample Forum Topics for Testing
-- Run this AFTER Migration 1 completes successfully
-- Copy-paste this entire SQL into Supabase SQL Editor and run it

-- Temporarily disable RLS for bulk insert
alter table public.forum_topics disable row level security;

-- Insert 5 sample topics in Thai
insert into public.forum_topics (user_id, title, content, category, views, is_active) values
  ('550e8400-e29b-41d4-a716-446655440000', 'ที่คาเฟ่แจ่งสบายดีจริงๆ', 'ชอบมากค่ะที่นี่ ยิ้มแย้มสนใจดี ร้านสะอาดเรียบร้อย แนะนำให้มาเที่ยวนะคะ', 'review', 45, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'เมนูกาแฟแนะนำ', 'ลองกาแฟเอสเพรสโซว่างไช่ แนะนำเลยค่ะ เหมาะมากสำหรับการทำงาน รส ชาติ ดีค่ะ', 'review', 67, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'ห้องพักสะอาดและสบาย', 'ห้องพักใหม่ๆ สะอาดมากค่ะ เตียงนอนสบาย มีแอร์ให้หนาวเย็น ทำให้คืนนอนเต็มสตัง', 'review', 123, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'มีที่จอดรถไม่ต้องกังวล', 'ที่จอดรถพอใจมากค่ะ ที่จอดกว้างสบาย ปลอดภัยด้วยมีกล้องวงจรปิด ไม่ต้องกังวลเรื่องรถ', 'general', 34, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'WiFi เร็วเหมาะทำงาน', 'WiFi ได้ความเร็วดีๆ สามารถทำงานและอัดอพโหลดได้สะดวกมากค่ะ เหมาะ สำหรับ freelancer', 'general', 56, true);

-- Re-enable RLS
alter table public.forum_topics enable row level security;

-- Verify sample data was inserted
select 
  count(*) as total_topics,
  sum(case when is_active = true then 1 else 0 end) as active_topics,
  sum(views) as total_views
from public.forum_topics;

-- View all topics
select id, title, category, views, is_active, created_at 
from public.forum_topics 
order by created_at desc;
