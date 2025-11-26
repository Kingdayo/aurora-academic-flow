import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Processing scheduled notifications...')

    // Get all notifications that should be sent now
    const { data: notifications, error: fetchError } = await supabaseClient
      .from('scheduled_notifications')
      .select('*')
      .is('sent_at', null)
      .lte('send_at', new Date().toISOString())
      .limit(100)

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notifications' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!notifications || notifications.length === 0) {
      console.log('No notifications to process')
      return new Response(
        JSON.stringify({ processed: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let processedCount = 0
    let failedCount = 0

    // Process each notification
    for (const notification of notifications) {
      try {
        // Call the send-push function
        const { error: sendError } = await supabaseClient.functions.invoke('send-push', {
          body: {
            userId: notification.user_id,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            tag: notification.tag
          }
        })

        if (sendError) {
          console.error(`Failed to send notification ${notification.id}:`, sendError)
          failedCount++
          continue
        }

        // Mark as sent
        const { error: updateError } = await supabaseClient
          .from('scheduled_notifications')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', notification.id)

        if (updateError) {
          console.error(`Failed to mark notification ${notification.id} as sent:`, updateError)
          failedCount++
        } else {
          processedCount++
          console.log(`Successfully processed notification ${notification.id}`)
        }

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error)
        failedCount++
      }
    }

    console.log(`Processed ${processedCount} notifications, failed ${failedCount}`)

    return new Response(
      JSON.stringify({ 
        processed: processedCount, 
        failed: failedCount,
        total: notifications.length 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in process-scheduled-notifications:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})