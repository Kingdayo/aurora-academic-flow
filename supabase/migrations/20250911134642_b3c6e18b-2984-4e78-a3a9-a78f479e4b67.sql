-- Enable pgcrypto for UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table to store Web Push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Users can view their own push subscriptions'
      AND tablename = 'push_subscriptions'
  ) THEN
    CREATE POLICY "Users can view their own push subscriptions"
    ON public.push_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Users can insert their own push subscriptions'
      AND tablename = 'push_subscriptions'
  ) THEN
    CREATE POLICY "Users can insert their own push subscriptions"
    ON public.push_subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Users can update their own push subscriptions'
      AND tablename = 'push_subscriptions'
  ) THEN
    CREATE POLICY "Users can update their own push subscriptions"
    ON public.push_subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Users can delete their own push subscriptions'
      AND tablename = 'push_subscriptions'
  ) THEN
    CREATE POLICY "Users can delete their own push subscriptions"
    ON public.push_subscriptions
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Table to queue scheduled notifications
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tag TEXT,
  data JSONB,
  send_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_due ON public.scheduled_notifications(send_at, sent_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user ON public.scheduled_notifications(user_id);

-- RLS for scheduled notifications (allow users to manage their own)
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Users can view their own scheduled notifications'
      AND tablename = 'scheduled_notifications'
  ) THEN
    CREATE POLICY "Users can view their own scheduled notifications"
    ON public.scheduled_notifications
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Users can insert their own scheduled notifications'
      AND tablename = 'scheduled_notifications'
  ) THEN
    CREATE POLICY "Users can insert their own scheduled notifications"
    ON public.scheduled_notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Users can update their own scheduled notifications'
      AND tablename = 'scheduled_notifications'
  ) THEN
    CREATE POLICY "Users can update their own scheduled notifications"
    ON public.scheduled_notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Users can delete their own scheduled notifications'
      AND tablename = 'scheduled_notifications'
  ) THEN
    CREATE POLICY "Users can delete their own scheduled notifications"
    ON public.scheduled_notifications
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_push_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER trg_push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_scheduled_notifications_updated_at'
  ) THEN
    CREATE TRIGGER trg_scheduled_notifications_updated_at
    BEFORE UPDATE ON public.scheduled_notifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;