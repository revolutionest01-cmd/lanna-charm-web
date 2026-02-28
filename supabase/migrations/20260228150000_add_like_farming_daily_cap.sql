CREATE TABLE IF NOT EXISTS public.like_reputation_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table text NOT NULL CHECK (source_table IN ('forum_likes', 'review_likes', 'forum_reply_likes')),
  source_like_id uuid NOT NULL,
  liker_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  awarded_date date NOT NULL,
  awarded_points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_like_id)
);

CREATE INDEX IF NOT EXISTS idx_like_rep_awards_pair_date
ON public.like_reputation_awards(liker_id, receiver_id, awarded_date);

CREATE INDEX IF NOT EXISTS idx_like_rep_awards_receiver
ON public.like_reputation_awards(receiver_id);

ALTER TABLE public.like_reputation_awards ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.process_like_reputation_award()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receiver_id uuid;
  v_award_date date;
  v_awarded_count integer;
  v_points integer := 0;
  v_rows_inserted integer := 0;
BEGIN
  IF TG_TABLE_NAME = 'forum_likes' THEN
    SELECT ft.user_id INTO v_receiver_id
    FROM public.forum_topics ft
    WHERE ft.id = NEW.topic_id;
  ELSIF TG_TABLE_NAME = 'review_likes' THEN
    SELECT r.user_id INTO v_receiver_id
    FROM public.reviews r
    WHERE r.id = NEW.review_id;
  ELSIF TG_TABLE_NAME = 'forum_reply_likes' THEN
    SELECT fr.user_id INTO v_receiver_id
    FROM public.forum_replies fr
    WHERE fr.id = NEW.reply_id;
  END IF;

  IF v_receiver_id IS NULL OR v_receiver_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  v_award_date := (timezone('Asia/Bangkok', COALESCE(NEW.created_at, now())))::date;

  SELECT COUNT(*)::integer
  INTO v_awarded_count
  FROM public.like_reputation_awards a
  WHERE a.liker_id = NEW.user_id
    AND a.receiver_id = v_receiver_id
    AND a.awarded_date = v_award_date
    AND a.awarded_points > 0;

  IF COALESCE(v_awarded_count, 0) < 3 THEN
    v_points := 15;
  END IF;

  INSERT INTO public.like_reputation_awards (
    source_table,
    source_like_id,
    liker_id,
    receiver_id,
    awarded_date,
    awarded_points
  )
  VALUES (
    TG_TABLE_NAME,
    NEW.id,
    NEW.user_id,
    v_receiver_id,
    v_award_date,
    v_points
  )
  ON CONFLICT (source_table, source_like_id) DO NOTHING;

  GET DIAGNOSTICS v_rows_inserted = ROW_COUNT;

  IF v_rows_inserted > 0 AND v_points > 0 THEN
    UPDATE public.profiles p
    SET reputation_points = COALESCE(p.reputation_points, 0) + v_points,
        updated_at = now()
    WHERE p.id = v_receiver_id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.forum_likes') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_forum_likes_reputation_award ON public.forum_likes;
    CREATE TRIGGER trg_forum_likes_reputation_award
    AFTER INSERT ON public.forum_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.process_like_reputation_award();
  END IF;

  IF to_regclass('public.review_likes') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_review_likes_reputation_award ON public.review_likes;
    CREATE TRIGGER trg_review_likes_reputation_award
    AFTER INSERT ON public.review_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.process_like_reputation_award();
  END IF;

  IF to_regclass('public.forum_reply_likes') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_forum_reply_likes_reputation_award ON public.forum_reply_likes;
    CREATE TRIGGER trg_forum_reply_likes_reputation_award
    AFTER INSERT ON public.forum_reply_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.process_like_reputation_award();
  END IF;
END
$$;