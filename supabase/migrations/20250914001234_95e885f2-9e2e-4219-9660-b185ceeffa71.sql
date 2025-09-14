-- Create a cron job to process scheduled notifications every minute
SELECT cron.schedule(
  'process-notifications',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url:='https://ptglxbqaucefcjdewsrd.supabase.co/functions/v1/process-scheduled-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Z2x4YnFhdWNlZmNqZGV3c3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODk0NzgsImV4cCI6MjA2Njk2NTQ3OH0.4bZPcxklqAkXQHjfM7LQjr7mMad7nbKhPixDbtNAYWM"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);