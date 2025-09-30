import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface NotificationPayload {
  title: string
  body: string
  tag?: string
  data?: any
}

async function sendWebPush(subscription: any, payload: NotificationPayload) {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('VAPID public and private keys are not configured.')
  }

  webpush.setVapidDetails(
    'mailto:your-email@example.com', // This should be configured via an environment variable
    vapidPublicKey,
    vapidPrivateKey
  )

  return webpush.sendNotification(
    subscription,
    JSON.stringify(payload)
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      // Use the service role key for backend operations
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { userId, title, body, tag, data } = await req.json()

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's push subscription
    const { data: subscriptionData, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)
      .single()

    if (subError || !subscriptionData) {
      // It's not an error if a user is not subscribed, so just log it.
      console.log(`No push subscription found for user: ${userId}`)
      return new Response(
        JSON.stringify({ success: true, message: 'No push subscription found for user' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const pushSubscription = {
      endpoint: subscriptionData.endpoint,
      keys: {
        p256dh: subscriptionData.p256dh,
        auth: subscriptionData.auth
      }
    }

    const notificationPayload: NotificationPayload = {
      title,
      body,
      tag,
      data
    }

    await sendWebPush(pushSubscription, notificationPayload)

    console.log(`Push notification sent to user: ${userId}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Push notification sent successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-push function:', error.message)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})