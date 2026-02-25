-- ==========================================
-- Migration script for Plern Ping Lanna Charm Web
-- Run this in Supabase SQL Editor on project: vcvnckvsfgbvycjfisfk
-- ==========================================

-- 1. Create custom enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'user', 'developer');

-- 2. Create tables

-- activity_logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- business_info
CREATE TABLE public.business_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name_th TEXT NOT NULL,
  business_name_en TEXT NOT NULL,
  address_th TEXT,
  address_en TEXT,
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  email TEXT,
  facebook TEXT,
  instagram TEXT,
  twitter TEXT,
  line_id TEXT,
  google_maps_url TEXT,
  opening_hours_th TEXT,
  opening_hours_en TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- chat_conversations
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_avatar TEXT,
  status TEXT DEFAULT 'active',
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- chat_logs
CREATE TABLE public.chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  ai_reply TEXT NOT NULL,
  intent TEXT,
  ip_hash TEXT,
  language TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- chat_messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id),
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- event_spaces
CREATE TABLE public.event_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_th TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_th TEXT,
  description_en TEXT,
  image_url TEXT,
  keywords_th TEXT,
  keywords_en TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- event_space_features
CREATE TABLE public.event_space_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_space_id UUID NOT NULL REFERENCES public.event_spaces(id),
  title_th TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_th TEXT,
  description_en TEXT,
  icon_name TEXT DEFAULT 'star',
  sort_order INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- event_space_images
CREATE TABLE public.event_space_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_space_id UUID NOT NULL REFERENCES public.event_spaces(id),
  image_url TEXT NOT NULL,
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- feature_panels
CREATE TABLE public.feature_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_th TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  subtitle_th TEXT,
  subtitle_en TEXT,
  image_url TEXT,
  logo_url TEXT,
  sort_order INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- feature_toggles
CREATE TABLE public.feature_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  feature_name_th TEXT NOT NULL,
  feature_name_en TEXT NOT NULL,
  description_th TEXT,
  description_en TEXT,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- forum_topics
CREATE TABLE public.forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  image_url TEXT,
  views INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- forum_likes
CREATE TABLE public.forum_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(topic_id, user_id)
);

-- forum_replies
CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- gallery_images
CREATE TABLE public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title_th TEXT,
  title_en TEXT,
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- hero_content
CREATE TABLE public.hero_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_th TEXT NOT NULL,
  title_en TEXT NOT NULL,
  subtitle_th TEXT,
  subtitle_en TEXT,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- menu_categories
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- menus
CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.menu_categories(id),
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_th TEXT,
  description_en TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_recommended BOOLEAN DEFAULT false,
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  rating INT NOT NULL,
  review_text_th TEXT NOT NULL,
  review_text_en TEXT NOT NULL,
  image_url TEXT,
  helpful_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- review_likes
CREATE TABLE public.review_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- review_replies
CREATE TABLE public.review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- rooms
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_th TEXT,
  description_en TEXT,
  price NUMERIC NOT NULL,
  capacity TEXT,
  amenities_th TEXT,
  amenities_en TEXT,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- room_images
CREATE TABLE public.room_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  image_url TEXT NOT NULL,
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- visitor_stats
CREATE TABLE public.visitor_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_visits INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create functions

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- increment_visitor_stats function
CREATE OR REPLACE FUNCTION public.increment_visitor_stats()
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.visitor_stats (id, total_visits, unique_visitors, last_updated)
  VALUES (gen_random_uuid(), 1, 1, now())
  ON CONFLICT (id) DO UPDATE
  SET total_visits = visitor_stats.total_visits + 1,
      last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable Row Level Security on all tables
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_space_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_space_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_stats ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies (allow public read, authenticated write)

-- Public read policies for content tables
CREATE POLICY "Allow public read" ON public.business_info FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.event_spaces FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.event_space_features FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.event_space_images FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.feature_panels FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.feature_toggles FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.forum_topics FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.forum_likes FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.gallery_images FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.hero_content FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.menus FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.review_likes FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.review_replies FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.room_images FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.visitor_stats FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.chat_logs FOR SELECT USING (true);

-- Authenticated user write policies
CREATE POLICY "Allow authenticated insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = id::text);
CREATE POLICY "Allow authenticated update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid()::text = id::text);

CREATE POLICY "Allow authenticated insert" ON public.forum_topics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON public.forum_topics FOR UPDATE TO authenticated USING (auth.uid()::text = user_id);

CREATE POLICY "Allow authenticated insert" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON public.forum_likes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON public.forum_likes FOR DELETE TO authenticated USING (auth.uid()::text = user_id);

CREATE POLICY "Allow authenticated insert" ON public.reviews FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON public.review_likes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON public.review_likes FOR DELETE TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Allow authenticated insert" ON public.review_replies FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON public.chat_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow anon insert" ON public.chat_logs FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON public.visitor_stats FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON public.visitor_stats FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow anon insert" ON public.visitor_stats FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.visitor_stats FOR UPDATE TO anon USING (true);

-- Chat policies
CREATE POLICY "Allow authenticated all" ON public.chat_conversations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all" ON public.chat_messages FOR ALL TO authenticated USING (true);

-- Admin write policies for content tables (using has_role function)
CREATE POLICY "Allow admin all" ON public.business_info FOR ALL TO authenticated USING (public.has_role('admin', auth.uid()::text));
CREATE POLICY "Allow admin all" ON public.hero_content FOR ALL TO authenticated USING (public.has_role('admin', auth.uid()::text));
CREATE POLICY "Allow admin all" ON public.rooms FOR ALL TO authenticated USING (public.has_role('admin', auth.uid()::text));
CREATE POLICY "Allow admin all" ON public.room_images FOR ALL TO authenticated USING (public.has_role('admin', auth.uid()::text));
CREATE POLICY "Allow admin all" ON public.menus FOR ALL TO authenticated USING (public.has_role('admin', auth.uid()::text));
CREATE POLICY "Allow admin all" ON public.menu_categories FOR ALL TO authenticated USING (public.has_role('admin', auth.uid()::text));
CREATE POLICY "Allow admin all" ON public.gallery_images FOR ALL TO authenticated USING (public.has_role('admin', auth.uid()::text));
CREATE POLICY "Allow admin all" ON public.feature_toggles FOR ALL TO authenticated USING (public.has_role('admin', auth.uid()::text));
CREATE POLICY "Allow admin all" ON public.feature_panels FOR ALL TO authenticated USING (public.has_role('admin', auth.uid()::text));
CREATE POLICY "Allow admin all" ON public.event_spaces FOR ALL TO authenticated USING (public.has_role('admin', auth.uid()::text));
CREATE POLICY "Allow admin all" ON public.event_space_features FOR ALL TO authenticated USING (public.has_role('admin', auth.uid()::text));
CREATE POLICY "Allow admin all" ON public.event_space_images FOR ALL TO authenticated USING (public.has_role('admin', auth.uid()::text));
CREATE POLICY "Allow admin all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role('admin', auth.uid()::text));
CREATE POLICY "Allow admin read" ON public.activity_logs FOR SELECT TO authenticated USING (public.has_role('admin', auth.uid()::text));

-- ==========================================
-- DONE! After running this, restart your dev server.
-- ==========================================
