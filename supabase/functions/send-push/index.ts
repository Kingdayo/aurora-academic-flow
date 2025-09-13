import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  tag?: string;
}

// Helper function to send push notification using Web Push protocol
async function sendWebPush(
  subscription: any,
  payload: NotificationPayload,
  vapidPublicKey: string
) {
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  
  if (!vapidPrivateKey) {
    throw new Error('VAPID private key not configured')
  }

  // Import the web-push library
  const webpush = await import('https://esm.sh/web-push@3.6.7')
  
  webpush.setVapidDetails(
    'mailto:notifications@yourapp.com', // Replace with your email
    vapidPublicKey,
    vapidPrivateKey
  )

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    console.log('Push notification sent successfully')
    return true
  } catch (error) {
    console.error('Error sending push notification:', error)
    return false
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role for server operations
    )

    const { userId, title, body, data, tag } = await req.json()

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    
    if (!vapidPublicKey) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's push subscription
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (subscriptionError || !subscription) {
      console.log(`No push subscription found for user: ${userId}`)
      return new Response(
        JSON.stringify({ error: 'No push subscription found for user' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Construct the subscription object for web-push
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    }

    const payload: NotificationPayload = {
      title,
      body,
      data,
      tag
    }

    // Send the push notification
    const success = await sendWebPush(pushSubscription, payload, vapidPublicKey)

    if (success) {
      console.log(`Push notification sent successfully to user: ${userId}`)
      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Failed to send push notification' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error in send-push:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})