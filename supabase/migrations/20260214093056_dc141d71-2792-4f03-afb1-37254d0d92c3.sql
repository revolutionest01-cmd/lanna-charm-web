
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;

-- Users can only see their own role
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all roles (for user management panel)
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'admin'));
