
-- 1. forum_topics: Developer can delete/update any topic
CREATE POLICY "Developer can delete any topic"
ON public.forum_topics FOR DELETE
USING (has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Developer can update any topic"
ON public.forum_topics FOR UPDATE
USING (has_role(auth.uid(), 'developer'::app_role));

-- 2. forum_replies: Developer can delete/update any reply
CREATE POLICY "Developer can delete any reply"
ON public.forum_replies FOR DELETE
USING (has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Developer can update any reply"
ON public.forum_replies FOR UPDATE
USING (has_role(auth.uid(), 'developer'::app_role));

-- 3. review_replies: Developer can delete any reply
CREATE POLICY "Developer can delete review replies"
ON public.review_replies FOR DELETE
USING (has_role(auth.uid(), 'developer'::app_role));

-- 4. review_likes: Developer can manage all likes
CREATE POLICY "Developer can manage review likes"
ON public.review_likes FOR ALL
USING (has_role(auth.uid(), 'developer'::app_role));

-- 5. forum_likes: Developer can manage all likes
CREATE POLICY "Developer can manage forum likes"
ON public.forum_likes FOR ALL
USING (has_role(auth.uid(), 'developer'::app_role));

-- 6. profiles: Developer can update any profile
CREATE POLICY "Developer can update any profile"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'developer'::app_role));

-- 7. visitor_stats: Developer can manage
CREATE POLICY "Developer can manage visitor stats"
ON public.visitor_stats FOR ALL
USING (has_role(auth.uid(), 'developer'::app_role));

-- 8. activity_logs: Developer can delete logs
CREATE POLICY "Developer can delete activity logs"
ON public.activity_logs FOR DELETE
USING (has_role(auth.uid(), 'developer'::app_role));
