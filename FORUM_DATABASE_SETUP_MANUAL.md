# Forum Database Setup Instructions

Since automated setup encountered authentication issues, please follow these manual steps:

## Step 1: Open Supabase Dashboard SQL Editor
1. Go to https://app.supabase.com
2. Select your project (gomjfnkzhxqfmbwmaphz)
3. Navigate to **SQL Editor** (bottom left)
4. Click **+ New Query**

## Step 2: Create Tables

Copy and paste this SQL in the editor:

```sql
-- Create forum_topics table
CREATE TABLE IF NOT EXISTS public.forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'question', 'review', 'shopping')),
  image_url TEXT,
  views INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create forum_likes table
CREATE TABLE IF NOT EXISTS public.forum_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(topic_id, user_id)
);

-- Create forum_replies table
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_forum_topics_user_id ON public.forum_topics(user_id);
CREATE INDEX idx_forum_topics_category ON public.forum_topics(category);
CREATE INDEX idx_forum_topics_created_at ON public.forum_topics(created_at DESC);
CREATE INDEX idx_forum_likes_topic_id ON public.forum_likes(topic_id);
CREATE INDEX idx_forum_replies_topic_id ON public.forum_replies(topic_id);
```

Click **Run** or press **Ctrl+Enter**

## Step 3: Create RLS Policies

Create a new query and run:

```sql
-- Forum Topics Policies
DROP POLICY IF EXISTS "Anyone can view active topics" ON public.forum_topics;
CREATE POLICY "Anyone can view active topics" ON public.forum_topics 
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can create topics" ON public.forum_topics;
CREATE POLICY "Authenticated users can create topics" ON public.forum_topics 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own topics" ON public.forum_topics;
CREATE POLICY "Users can update own topics" ON public.forum_topics 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own topics" ON public.forum_topics;
CREATE POLICY "Users can delete own topics" ON public.forum_topics 
  FOR DELETE USING (auth.uid() = user_id);

-- Forum Likes Policies
DROP POLICY IF EXISTS "Anyone can view likes" ON public.forum_likes;
CREATE POLICY "Anyone can view likes" ON public.forum_likes 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like topics" ON public.forum_likes;
CREATE POLICY "Authenticated users can like topics" ON public.forum_likes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike topics" ON public.forum_likes;
CREATE POLICY "Users can unlike topics" ON public.forum_likes 
  FOR DELETE USING (auth.uid() = user_id);

-- Forum Replies Policies
DROP POLICY IF EXISTS "Anyone can view replies" ON public.forum_replies;
CREATE POLICY "Anyone can view replies" ON public.forum_replies 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can reply" ON public.forum_replies;
CREATE POLICY "Authenticated users can reply" ON public.forum_replies 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own replies" ON public.forum_replies;
CREATE POLICY "Users can delete own replies" ON public.forum_replies 
  FOR DELETE USING (auth.uid() = user_id);
```

Click **Run**

## Step 4: Insert Sample Data

Create a new query and run:

```sql
-- Insert 5 sample Thai topics
INSERT INTO public.forum_topics (user_id, title, content, category, views, is_active)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'ที่คาเฟ่แจ่งสบายดีจริงๆ',
    'ชอบมากค่ะที่นี่ ยิ้มแย้มสนใจดี ร้านสะอาดเรียบร้อย แนะนำให้มาเที่ยวนะคะ',
    'review',
    45,
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'เมนูกาแฟแนะนำ',
    'ลองกาแฟเอสเพรสโซว่างไช่ แนะนำเลยค่ะ เหมาะมากสำหรับการทำงาน รสชาติดีค่ะ',
    'review',
    67,
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'ห้องพักสะอาดและสบาย',
    'ห้องพักใหม่ๆ สะอาดมากค่ะ เตียงนอนสบาย มีแอร์ให้หนาวเย็น ทำให้คืนนอนเต็มสตัง',
    'review',
    123,
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'มีที่จอดรถไม่ต้องกังวล',
    'ที่จอดรถพอใจมากค่ะ ที่จอดกว้างสบาย ปลอดภัยด้วยมีกล้องวงจรปิด ไม่ต้องกังวลเรื่องรถ',
    'general',
    34,
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'WiFi เร็วเหมาะทำงาน',
    'WiFi ได้ความเร็วดีๆ สามารถทำงานและอัดอพโหลดได้สะดวกมากค่ะ เหมาะสำหรับ freelancer',
    'general',
    56,
    true
  );
```

Click **Run**

## Step 5: Verify Setup

Run this query to verify all tables are created with data:

```sql
SELECT 
  (SELECT COUNT(*) FROM public.forum_topics) as topics_count,
  (SELECT COUNT(*) FROM public.forum_likes) as likes_count,
  (SELECT COUNT(*) FROM public.forum_replies) as replies_count,
  (SELECT COUNT(*) FROM public.forum_topics WHERE is_active = true) as active_topics;
```

Expected result:
- topics_count: 5
- likes_count: 0
- replies_count: 0
- active_topics: 5

## Step 6: Test in Your App

After running all steps:
1. Go to http://localhost:8082 → **Forum** page
2. Should see 5 Thai topics displayed
3. Go to http://localhost:8082 → **Admin Panel** → **Webboard** tab
4. Should see forum stats and topic management table

## Troubleshooting

**If you see "RLS policy violation" errors:**
- Make sure you're logged in as an authenticated user
- Check that the RLS policies were created correctly

**If topics don't appear:**
- Open **Tables** in Supabase dashboard
- Verify forum_topics table exists and has 5 rows
- Check is_active column is true for all rows

## Need Help?

If you encounter any issues:
1. Check the application logs (browser F12 → Console)
2. Check Supabase logs (Dashboard → Logs)
3. Verify all SQL queries ran without errors (check for red error messages in SQL editor)
