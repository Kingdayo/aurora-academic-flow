import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { event_type, new_task, old_task } = await req.json()

    let title = ''
    let body = ''
    let userId = ''

    if (event_type === 'INSERT') {
      title = 'New Task Created'
      body = `"${new_task.title}" has been added to your tasks`
      userId = new_task.user_id
    } else if (event_type === 'UPDATE') {
      if (!old_task.completed && new_task.completed) {
        title = 'Task Completed'
        body = `"${new_task.title}" has been marked as completed! 🎉`
        userId = new_task.user_id
      } else if (old_task.due_date !== new_task.due_date || old_task.due_time !== new_task.due_time) {
        title = 'Task Updated'
        body = `Due date for "${new_task.title}" has been updated`
        userId = new_task.user_id
      }
    }

    if (title && body && userId) {
      await supabase.functions.invoke('send-push', {
        body: {
          userId,
          title,
          body,
          data: {
            url: `/tasks/${new_task.id}`,
            taskId: new_task.id,
            notification_type: 'task_update',
          },
        },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
