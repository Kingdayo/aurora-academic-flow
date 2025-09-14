-- Create a cron job to process scheduled notifications every minute
SELECT cron.schedule(
  'process-notifications',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url:=format('%s/functions/v1/process-scheduled-notifications', current_setting('app.settings.supabase_url')),
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', format('Bearer %s', current_setting('app.settings.service_role_key'))
      ),
      body:='{}'::jsonb
    ) as request_id;
  $$
);