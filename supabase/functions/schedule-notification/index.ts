import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScheduleNotificationRequest {
  taskId: string;
  title: string;
  body: string;
  sendAt: string; // ISO timestamp
  tag?: string;
  data?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { taskId, title, body, sendAt, tag, data }: ScheduleNotificationRequest = await req.json()

    if (!taskId || !title || !body || !sendAt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: taskId, title, body, sendAt' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate sendAt is a future timestamp
    const sendAtDate = new Date(sendAt)
    if (sendAtDate <= new Date()) {
      return new Response(
        JSON.stringify({ error: 'sendAt must be a future timestamp' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Store the scheduled notification
    const { error: insertError } = await supabaseClient
      .from('scheduled_notifications')
      .insert({
        user_id: user.id,
        title,
        body,
        send_at: sendAt,
        tag: tag || `task-${taskId}`,
        data: { taskId, ...data }
      })

    if (insertError) {
      console.error('Error scheduling notification:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to schedule notification' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Notification scheduled for user ${user.id} at ${sendAt}`)

    return new Response(
      JSON.stringify({ success: true, scheduledAt: sendAt }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in schedule-notification:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})