import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, taskData, userId, notificationTime } = await req.json()

    console.log('Notification request received:', { type, taskData, userId })

    // Validate request
    if (!type || !taskData || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let notificationTitle = ''
    let notificationBody = ''
    let shouldSend = false

    // Determine notification content based on type
    switch (type) {
      case 'task_due_soon':
        notificationTitle = '⏰ Task Due Soon'
        notificationBody = `"${taskData.title}" is due ${taskData.dueTime}`
        shouldSend = true
        break
        
      case 'task_overdue':
        notificationTitle = '🚨 Task Overdue'
        notificationBody = `"${taskData.title}" is overdue!`
        shouldSend = true
        break
        
      case 'daily_reminder':
        notificationTitle = '📝 Daily Task Reminder'
        notificationBody = `You have ${taskData.count} pending tasks for today`
        shouldSend = true
        break
        
      case 'high_priority_alert':
        notificationTitle = '🔥 High Priority Task'
        notificationBody = `"${taskData.title}" requires immediate attention`
        shouldSend = true
        break
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid notification type' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

    if (shouldSend) {
      const { data: subscription, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !subscription) {
        return new Response(
          JSON.stringify({ error: 'Push subscription not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const schedule = new Date(notificationTime).toISOString();
      const cronExpression = `${new Date(schedule).getUTCMinutes()} ${new Date(schedule).getUTCHours()} ${new Date(schedule).getUTCDate()} ${new Date(schedule).getUTCMonth() + 1} *`;

      const { error: cronError } = await supabase.rpc('cron.schedule', {
        schedule: cronExpression,
        command: `SELECT send_push_notification('${JSON.stringify(subscription)}', '${notificationTitle}', '${notificationBody}')`,
      });

      if (cronError) {
        console.error('Error scheduling notification:', cronError);
        return new Response(
          JSON.stringify({ error: 'Failed to schedule notification' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Notification scheduled successfully',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'No notification required' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error processing notification request:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})