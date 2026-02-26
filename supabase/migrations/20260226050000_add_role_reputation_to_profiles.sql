-- Add role and reputation_points columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'developer', 'admin')),
ADD COLUMN IF NOT EXISTS reputation_points integer DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_reputation_points ON profiles(reputation_points DESC);
