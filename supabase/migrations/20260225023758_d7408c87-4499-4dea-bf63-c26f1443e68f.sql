
-- Update Siwait's role to developer
UPDATE public.user_roles SET role = 'developer' WHERE user_id = '1b74b1f1-20bd-4772-9fd8-5dda97ec7488';

-- Developer RLS policies for user_roles
CREATE POLICY "Developer can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can update user roles" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'developer'::app_role)) WITH CHECK (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can insert user roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can delete user roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'developer'::app_role));

-- Developer access to all content tables
CREATE POLICY "Developer can modify business info" ON public.business_info FOR ALL USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can modify event spaces" ON public.event_spaces FOR ALL USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can modify hero content" ON public.hero_content FOR ALL USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can modify rooms" ON public.rooms FOR ALL USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can modify room images" ON public.room_images FOR ALL USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can modify menus" ON public.menus FOR ALL USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can modify menu categories" ON public.menu_categories FOR ALL USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can modify gallery images" ON public.gallery_images FOR ALL USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can modify reviews" ON public.reviews FOR ALL USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can view chat logs" ON public.chat_logs FOR SELECT USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can delete chat logs" ON public.chat_logs FOR DELETE USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer can view activity logs" ON public.activity_logs FOR SELECT USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer view all conversations" ON public.chat_conversations FOR SELECT USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer update any conversation" ON public.chat_conversations FOR UPDATE USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer view all messages" ON public.chat_messages FOR SELECT USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer send messages" ON public.chat_messages FOR INSERT WITH CHECK ((auth.uid() = sender_id) AND (sender_role = 'admin') AND has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Developer update messages" ON public.chat_messages FOR UPDATE USING (has_role(auth.uid(), 'developer'::app_role));

-- Create feature_toggles table for Dev God Mode
CREATE TABLE public.feature_toggles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text NOT NULL UNIQUE,
  feature_name_th text NOT NULL,
  feature_name_en text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  description_th text,
  description_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_toggles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developer can manage feature toggles" ON public.feature_toggles FOR ALL USING (has_role(auth.uid(), 'developer'::app_role));
CREATE POLICY "Anyone can view feature toggles" ON public.feature_toggles FOR SELECT USING (true);

INSERT INTO public.feature_toggles (feature_key, feature_name_th, feature_name_en, description_th, description_en, is_enabled) VALUES
  ('live_chat', 'Live Chat', 'Live Chat', 'ระบบแชทสดกับลูกค้า', 'Live chat with customers', true),
  ('ai_chatbot', 'AI Chatbot', 'AI Chatbot', 'ระบบแชทบอท AI อัตโนมัติ', 'Automated AI chatbot', true),
  ('forum', 'เว็บบอร์ด', 'Forum', 'ระบบกระทู้สนทนา', 'Discussion forum', true),
  ('reviews', 'รีวิว', 'Reviews', 'ระบบรีวิวจากลูกค้า', 'Customer reviews system', true),
  ('booking', 'ระบบจอง', 'Booking', 'ระบบจองห้องพัก', 'Room booking system', true),
  ('gallery', 'แกลเลอรี่', 'Gallery', 'แกลเลอรี่รูปภาพ', 'Photo gallery', true),
  ('events', 'อีเว้นท์', 'Events', 'พื้นที่จัดงาน', 'Event spaces', true),
  ('analytics', 'Analytics', 'Analytics', 'รายงานวิเคราะห์ข้อมูล', 'Data analytics dashboard', true);

CREATE TRIGGER update_feature_toggles_updated_at
BEFORE UPDATE ON public.feature_toggles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
