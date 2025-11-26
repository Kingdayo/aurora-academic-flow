-- Create the function to handle task changes
CREATE OR REPLACE FUNCTION handle_task_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  function_url TEXT;
BEGIN
  -- Construct the URL for the task-notifications function
  function_url := 'https://' || net.host() || '/functions/v1/task-notifications';

  -- Construct the payload
  payload := jsonb_build_object(
    'event_type', TG_OP,
    'new_task', row_to_json(NEW),
    'old_task', row_to_json(OLD)
  );

  -- Call the task-notifications function
  -- Note: We are not including the Authorization header here because this is a database trigger
  -- and we will use the service_role_key in the function itself.
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_task_change ON public.tasks;

-- Create the trigger to fire on task changes
CREATE TRIGGER on_task_change
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION handle_task_change();

-- Grant usage on the net schema to postgres role
GRANT USAGE ON SCHEMA net TO postgres;
