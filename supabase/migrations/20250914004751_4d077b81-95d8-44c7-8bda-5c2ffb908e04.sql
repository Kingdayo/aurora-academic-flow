-- Add unique constraint to user_id in push_subscriptions table
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_key UNIQUE (user_id);