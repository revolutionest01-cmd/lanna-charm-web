
-- ═══════════════════════════════════════════
-- Daily Gacha System: table + RPC function
-- ═══════════════════════════════════════════

-- 1) Claims table
CREATE TABLE public.daily_gacha_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  claim_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Bangkok')::date,
  reward_type TEXT NOT NULL,          -- 'rank_points' | 'custom_title'
  reward_value INTEGER NOT NULL DEFAULT 0,
  reward_meta JSONB,                  -- e.g. {"title":"นักผจญภัย","expires_at":"..."}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, claim_date)
);

ALTER TABLE public.daily_gacha_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gacha claims"
  ON public.daily_gacha_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts gacha claims"
  ON public.daily_gacha_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Developer can manage gacha claims"
  ON public.daily_gacha_claims FOR ALL
  USING (public.has_role(auth.uid(), 'developer'));

-- 2) RPC: claim_daily_gacha
--    Requirements: user must have at least 1 forum topic, reply, or review
--    Rewards: common 5-15 pts (70%), uncommon 20-40 pts (25%), rare 50-100 pts (5%)
CREATE OR REPLACE FUNCTION public.claim_daily_gacha()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_today DATE;
  v_has_activity BOOLEAN;
  v_roll FLOAT;
  v_reward_type TEXT;
  v_reward_value INT;
  v_reward_meta JSONB;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  v_today := (now() AT TIME ZONE 'Asia/Bangkok')::date;

  -- Check if already claimed today
  IF EXISTS (
    SELECT 1 FROM daily_gacha_claims
    WHERE user_id = v_user_id AND claim_date = v_today
  ) THEN
    RETURN jsonb_build_object('status', 'already_claimed');
  END IF;

  -- Check quest requirement: at least 1 community activity
  SELECT (
    EXISTS (SELECT 1 FROM forum_topics WHERE user_id = v_user_id LIMIT 1)
    OR EXISTS (SELECT 1 FROM forum_replies WHERE user_id = v_user_id LIMIT 1)
    OR EXISTS (SELECT 1 FROM reviews WHERE user_id = v_user_id LIMIT 1)
  ) INTO v_has_activity;

  IF NOT v_has_activity THEN
    RETURN jsonb_build_object(
      'status', 'quest_incomplete',
      'message', 'ต้องมีกิจกรรมอย่างน้อย 1 อย่าง (โพสต์กระทู้, ตอบกระทู้, หรือเขียนรีวิว)'
    );
  END IF;

  -- Roll reward
  v_roll := random();
  v_reward_meta := NULL;

  IF v_roll < 0.05 THEN
    -- Rare: 50-100 points
    v_reward_type := 'rank_points';
    v_reward_value := 50 + floor(random() * 51)::int;
  ELSIF v_roll < 0.30 THEN
    -- Uncommon: 20-40 points
    v_reward_type := 'rank_points';
    v_reward_value := 20 + floor(random() * 21)::int;
  ELSE
    -- Common: 5-15 points
    v_reward_type := 'rank_points';
    v_reward_value := 5 + floor(random() * 11)::int;
  END IF;

  -- Insert claim
  INSERT INTO daily_gacha_claims (user_id, claim_date, reward_type, reward_value, reward_meta)
  VALUES (v_user_id, v_today, v_reward_type, v_reward_value, v_reward_meta);

  -- Award points to profile
  UPDATE profiles
  SET reputation_points = reputation_points + v_reward_value
  WHERE id = v_user_id;

  v_result := jsonb_build_object(
    'status', 'success',
    'reward_type', v_reward_type,
    'reward_value', v_reward_value,
    'reward_meta', v_reward_meta
  );

  RETURN v_result;
END;
$$;
