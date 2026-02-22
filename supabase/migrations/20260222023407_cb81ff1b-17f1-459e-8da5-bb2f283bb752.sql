
-- Create forum_topics table
CREATE TABLE public.forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  image_url text,
  views integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create forum_replies table
CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create forum_likes table
CREATE TABLE public.forum_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(topic_id, user_id)
);

-- Enable RLS
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;

-- forum_topics policies
CREATE POLICY "Forum topics viewable by everyone" ON public.forum_topics FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create topics" ON public.forum_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topics, admins can update any" ON public.forum_topics FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own topics, admins can delete any" ON public.forum_topics FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- forum_replies policies
CREATE POLICY "Forum replies viewable by everyone" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create replies" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own replies, admins can update any" ON public.forum_replies FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own replies, admins can delete any" ON public.forum_replies FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- forum_likes policies
CREATE POLICY "Forum likes viewable by everyone" ON public.forum_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON public.forum_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON public.forum_likes FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_forum_topics_user_id ON public.forum_topics(user_id);
CREATE INDEX idx_forum_topics_category ON public.forum_topics(category);
CREATE INDEX idx_forum_replies_topic_id ON public.forum_replies(topic_id);
CREATE INDEX idx_forum_likes_topic_id ON public.forum_likes(topic_id);

-- Update trigger for forum_topics
CREATE TRIGGER update_forum_topics_updated_at
  BEFORE UPDATE ON public.forum_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for forum_replies
CREATE TRIGGER update_forum_replies_updated_at
  BEFORE UPDATE ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create forum storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('forum', 'forum', true)
ON CONFLICT (id) DO NOTHING;

-- Forum storage policies
CREATE POLICY "Forum images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'forum');
CREATE POLICY "Authenticated users can upload forum images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'forum' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own forum images" ON storage.objects FOR DELETE USING (bucket_id = 'forum' AND auth.role() = 'authenticated');
