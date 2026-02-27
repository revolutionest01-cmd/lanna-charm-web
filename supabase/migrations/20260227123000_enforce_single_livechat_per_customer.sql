-- Enforce single live chat room per customer and merge existing duplicates

WITH ranked AS (
  SELECT
    id,
    customer_id,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id
      ORDER BY
        CASE WHEN status = 'open' THEN 0 ELSE 1 END,
        COALESCE(last_message_at, created_at) DESC,
        created_at DESC
    ) AS rn
  FROM public.chat_conversations
),
primary_conv AS (
  SELECT customer_id, id AS primary_id
  FROM ranked
  WHERE rn = 1
),
duplicate_conv AS (
  SELECT r.customer_id, r.id AS duplicate_id, p.primary_id
  FROM ranked r
  JOIN primary_conv p ON p.customer_id = r.customer_id
  WHERE r.rn > 1
)
UPDATE public.chat_messages m
SET conversation_id = d.primary_id
FROM duplicate_conv d
WHERE m.conversation_id = d.duplicate_id;

DELETE FROM public.chat_conversations c
USING (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY customer_id
        ORDER BY
          CASE WHEN status = 'open' THEN 0 ELSE 1 END,
          COALESCE(last_message_at, created_at) DESC,
          created_at DESC
      ) AS rn
    FROM public.chat_conversations
  ) t
  WHERE t.rn > 1
) x
WHERE c.id = x.id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_conversations_customer_id
  ON public.chat_conversations(customer_id);
