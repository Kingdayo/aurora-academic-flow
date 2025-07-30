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

    const { type, taskData, userId } = await req.json()

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
      // Here you could integrate with push notification services
      // For now, we'll log and return success
      console.log('Sending notification:', { notificationTitle, notificationBody, userId })
      
      // You could add integration with:
      // - Firebase Cloud Messaging (FCM)
      // - Apple Push Notification Service (APNs)
      // - Web Push Protocol
      // - Email notifications
      // - SMS notifications
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Notification queued successfully',
          notification: {
            title: notificationTitle,
            body: notificationBody,
            userId
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
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