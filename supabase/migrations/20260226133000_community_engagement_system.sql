-- Daily Gacha + Stage + Mentorship (minimal-impact extension)

-- =========================
-- 1) DAILY GACHA / MYSTERY BOX
-- =========================

CREATE TABLE IF NOT EXISTS public.daily_gacha_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  claim_date date NOT NULL DEFAULT (timezone('Asia/Bangkok', now()))::date,
  reward_type text NOT NULL CHECK (reward_type IN ('rank_points', 'temporary_title', 'cooldown_bypass_ticket')),
  reward_value integer NOT NULL DEFAULT 0,
  reward_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, claim_date)
);

ALTER TABLE public.daily_gacha_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own gacha claims" ON public.daily_gacha_claims;
CREATE POLICY "Users can view own gacha claims"
ON public.daily_gacha_claims FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_gacha_claims_user_date
ON public.daily_gacha_claims(user_id, claim_date DESC);

CREATE TABLE IF NOT EXISTS public.user_reward_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_key text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_key)
);

ALTER TABLE public.user_reward_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own inventory" ON public.user_reward_inventory;
CREATE POLICY "Users can view own inventory"
ON public.user_reward_inventory FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own inventory" ON public.user_reward_inventory;
CREATE POLICY "Users can manage own inventory"
ON public.user_reward_inventory FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_reward_inventory_user
ON public.user_reward_inventory(user_id);

-- =========================
-- 2) STAGE: REPLY LIKE + SIGNATURE
-- =========================

CREATE TABLE IF NOT EXISTS public.forum_reply_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id uuid NOT NULL REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reply_id, user_id)
);

ALTER TABLE public.forum_reply_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reply likes viewable by everyone" ON public.forum_reply_likes;
CREATE POLICY "Reply likes viewable by everyone"
ON public.forum_reply_likes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can like replies" ON public.forum_reply_likes;
CREATE POLICY "Authenticated users can like replies"
ON public.forum_reply_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike own reply likes" ON public.forum_reply_likes;
CREATE POLICY "Users can unlike own reply likes"
ON public.forum_reply_likes FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_reply
ON public.forum_reply_likes(reply_id);

CREATE TABLE IF NOT EXISTS public.user_signature_settings (
  user_id uuid PRIMARY KEY,
  signature_text text,
  signature_image_url text,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_signature_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signature settings viewable by everyone" ON public.user_signature_settings;
CREATE POLICY "Signature settings viewable by everyone"
ON public.user_signature_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can manage own signature settings" ON public.user_signature_settings;
CREATE POLICY "Users can manage own signature settings"
ON public.user_signature_settings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =========================
-- 3) MENTORSHIP PROGRAM
-- =========================

CREATE TABLE IF NOT EXISTS public.mentor_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_user_id uuid NOT NULL,
  mentee_user_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  CONSTRAINT mentor_not_self CHECK (mentor_user_id <> mentee_user_id),
  CONSTRAINT unique_active_mentee UNIQUE(mentee_user_id)
);

ALTER TABLE public.mentor_endorsements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mentorship viewable by everyone" ON public.mentor_endorsements;
CREATE POLICY "Mentorship viewable by everyone"
ON public.mentor_endorsements FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Mentor can create endorsement" ON public.mentor_endorsements;
CREATE POLICY "Mentor can create endorsement"
ON public.mentor_endorsements FOR INSERT
WITH CHECK (auth.uid() = mentor_user_id);

DROP POLICY IF EXISTS "Mentor can update own endorsements" ON public.mentor_endorsements;
CREATE POLICY "Mentor can update own endorsements"
ON public.mentor_endorsements FOR UPDATE
USING (auth.uid() = mentor_user_id)
WITH CHECK (auth.uid() = mentor_user_id);

CREATE INDEX IF NOT EXISTS idx_mentor_endorsements_mentor
ON public.mentor_endorsements(mentor_user_id, is_active);

CREATE TABLE IF NOT EXISTS public.mentor_social_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_user_id uuid NOT NULL,
  mentee_user_id uuid NOT NULL,
  source text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_social_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mentor social credits owner view" ON public.mentor_social_credits;
CREATE POLICY "Mentor social credits owner view"
ON public.mentor_social_credits FOR SELECT
USING (auth.uid() = mentor_user_id);

-- =========================
-- RPC: endorse newcomer
-- =========================

CREATE OR REPLACE FUNCTION public.endorse_newcomer(p_mentee_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mentor_id uuid;
  v_mentor_points integer;
  v_mentee_points integer;
  v_existing uuid;
BEGIN
  v_mentor_id := auth.uid();

  IF v_mentor_id IS NULL THEN
    RETURN jsonb_build_object('status', 'unauthenticated');
  END IF;

  IF v_mentor_id = p_mentee_user_id THEN
    RETURN jsonb_build_object('status', 'invalid_target');
  END IF;

  SELECT COALESCE(reputation_points, 0)
  INTO v_mentor_points
  FROM public.profiles
  WHERE id = v_mentor_id;

  IF COALESCE(v_mentor_points, 0) < 2001 THEN
    RETURN jsonb_build_object('status', 'mentor_rank_too_low');
  END IF;

  SELECT COALESCE(reputation_points, 0)
  INTO v_mentee_points
  FROM public.profiles
  WHERE id = p_mentee_user_id;

  IF v_mentee_points IS NULL THEN
    RETURN jsonb_build_object('status', 'mentee_not_found');
  END IF;

  IF v_mentee_points > 100 THEN
    RETURN jsonb_build_object('status', 'mentee_not_newcomer');
  END IF;

  SELECT id INTO v_existing
  FROM public.mentor_endorsements
  WHERE mentee_user_id = p_mentee_user_id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_endorsed');
  END IF;

  INSERT INTO public.mentor_endorsements (mentor_user_id, mentee_user_id, is_active)
  VALUES (v_mentor_id, p_mentee_user_id, true);

  RETURN jsonb_build_object('status', 'success');
END;
$$;

-- =========================
-- RPC: claim daily gacha
-- =========================

CREATE OR REPLACE FUNCTION public.claim_daily_gacha()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_today date;
  v_activity_count integer;
  v_existing_claim uuid;
  v_roll numeric;
  v_raw_points integer;
  v_final_points integer;
  v_reward_type text;
  v_title text;
  v_mentor_id uuid;
  v_is_newcomer boolean;
  v_mentor_bonus integer;
BEGIN
  v_user_id := auth.uid();
  v_today := (timezone('Asia/Bangkok', now()))::date;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'unauthenticated');
  END IF;

  SELECT id INTO v_existing_claim
  FROM public.daily_gacha_claims
  WHERE user_id = v_user_id
    AND claim_date = v_today
  LIMIT 1;

  IF v_existing_claim IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_claimed');
  END IF;

  SELECT
    (
      COALESCE((SELECT count(*) FROM public.forum_likes fl WHERE fl.user_id = v_user_id AND (timezone('Asia/Bangkok', fl.created_at))::date = v_today), 0)
      + COALESCE((SELECT count(*) FROM public.forum_replies fr WHERE fr.user_id = v_user_id AND (timezone('Asia/Bangkok', fr.created_at))::date = v_today), 0)
      + COALESCE((SELECT count(*) FROM public.review_likes rl WHERE rl.user_id = v_user_id AND (timezone('Asia/Bangkok', rl.created_at))::date = v_today), 0)
    )::integer
  INTO v_activity_count;

  IF COALESCE(v_activity_count, 0) < 1 THEN
    RETURN jsonb_build_object('status', 'not_eligible', 'reason', 'need_activity');
  END IF;

  v_roll := random();

  IF v_roll < 0.70 THEN
    v_reward_type := 'rank_points';
    v_raw_points := floor(10 + random() * 91)::integer; -- 10..100

    SELECT (COALESCE(reputation_points, 0) <= 100)
    INTO v_is_newcomer
    FROM public.profiles
    WHERE id = v_user_id;

    SELECT mentor_user_id
    INTO v_mentor_id
    FROM public.mentor_endorsements
    WHERE mentee_user_id = v_user_id
      AND is_active = true
    LIMIT 1;

    IF COALESCE(v_is_newcomer, false) AND v_mentor_id IS NOT NULL THEN
      v_final_points := CEIL(v_raw_points * 1.1);
      v_mentor_bonus := GREATEST(1, CEIL(v_raw_points * 0.1));

      INSERT INTO public.mentor_social_credits (mentor_user_id, mentee_user_id, source, points)
      VALUES (v_mentor_id, v_user_id, 'daily_gacha', v_mentor_bonus);
    ELSE
      v_final_points := v_raw_points;
      v_mentor_bonus := 0;
    END IF;

    UPDATE public.profiles
    SET reputation_points = COALESCE(reputation_points, 0) + v_final_points,
        updated_at = now()
    WHERE id = v_user_id;

    INSERT INTO public.daily_gacha_claims (user_id, claim_date, reward_type, reward_value, reward_meta)
    VALUES (
      v_user_id,
      v_today,
      v_reward_type,
      v_final_points,
      jsonb_build_object('raw_points', v_raw_points, 'mentor_bonus', v_mentor_bonus)
    );

    RETURN jsonb_build_object(
      'status', 'success',
      'reward_type', v_reward_type,
      'reward_value', v_final_points,
      'raw_points', v_raw_points,
      'mentor_bonus', v_mentor_bonus
    );

  ELSIF v_roll < 0.90 THEN
    v_reward_type := 'temporary_title';
    v_title := (
      ARRAY[
        'ผู้กล้าประจำวัน',
        'ดาวเด่นวันนี้',
        'นักล่าความรู้',
        'ปรมาจารย์แห่งโชค',
        'คนจริงสายบอร์ด'
      ]
    )[floor(random() * 5 + 1)::integer];

    INSERT INTO public.user_reward_inventory (user_id, reward_key, quantity, expires_at, metadata)
    VALUES (
      v_user_id,
      'temporary_title',
      1,
      now() + interval '24 hours',
      jsonb_build_object('title', v_title)
    )
    ON CONFLICT (user_id, reward_key)
    DO UPDATE SET
      quantity = public.user_reward_inventory.quantity + 1,
      expires_at = now() + interval '24 hours',
      metadata = EXCLUDED.metadata,
      updated_at = now();

    INSERT INTO public.daily_gacha_claims (user_id, claim_date, reward_type, reward_value, reward_meta)
    VALUES (
      v_user_id,
      v_today,
      v_reward_type,
      1,
      jsonb_build_object('title', v_title, 'expires_hours', 24)
    );

    RETURN jsonb_build_object(
      'status', 'success',
      'reward_type', v_reward_type,
      'reward_value', 1,
      'title', v_title
    );

  ELSE
    v_reward_type := 'cooldown_bypass_ticket';

    INSERT INTO public.user_reward_inventory (user_id, reward_key, quantity, metadata)
    VALUES (v_user_id, 'cooldown_bypass_ticket', 1, '{}'::jsonb)
    ON CONFLICT (user_id, reward_key)
    DO UPDATE SET
      quantity = public.user_reward_inventory.quantity + 1,
      updated_at = now();

    INSERT INTO public.daily_gacha_claims (user_id, claim_date, reward_type, reward_value, reward_meta)
    VALUES (
      v_user_id,
      v_today,
      v_reward_type,
      1,
      jsonb_build_object('note', 'Can be used to bypass edit cooldown')
    );

    RETURN jsonb_build_object(
      'status', 'success',
      'reward_type', v_reward_type,
      'reward_value', 1
    );
  END IF;
END;
$$;

COMMENT ON TABLE public.daily_gacha_claims IS 'One daily gacha claim per user with reward detail';
COMMENT ON TABLE public.user_reward_inventory IS 'Stores rewarded consumables/items from systems like gacha';
COMMENT ON TABLE public.forum_reply_likes IS 'Likes on forum replies for top-contributor stage feature';
COMMENT ON TABLE public.user_signature_settings IS 'Signature text/image for high-rank users';
COMMENT ON TABLE public.mentor_endorsements IS 'Mentor-newcomer endorsement relationships';
COMMENT ON TABLE public.mentor_social_credits IS 'Mentor social credit earned from mentee progress';
