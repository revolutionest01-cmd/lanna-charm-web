-- Update all existing admins with random avatars
-- This migration assigns random avatar emojis to all existing admin users

-- Update admins with random avatars from the emoji array
WITH admin_users AS (
  SELECT DISTINCT ur.user_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
),
avatars AS (
  SELECT ARRAY['😊', '😄', '😎', '🤩', '😍', 
                '🥳', '😇', '🤓', '😌', '😏',
                '👨', '👩', '👴', '👵', '👦',
                '👧', '🧔', '👱', '🤵', '💼'] AS emoji_list
),
random_assignments AS (
  SELECT 
    au.user_id,
    (avatars.emoji_list)[1 + (random() * 19)::int] AS random_avatar
  FROM admin_users au
  CROSS JOIN avatars
)
UPDATE public.profiles p
SET avatar_url = ra.random_avatar
FROM random_assignments ra
WHERE p.id = ra.user_id;

-- Verify the update
-- SELECT p.display_name, p.avatar_url, ur.role
-- FROM public.profiles p
-- JOIN public.user_roles ur ON p.id = ur.user_id
-- WHERE ur.role = 'admin'
-- ORDER BY p.display_name;
