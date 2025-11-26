-- Drop the unique constraint on user_id to allow multiple subscriptions per user
ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_key;
