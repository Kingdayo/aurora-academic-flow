import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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

serve(async (req) => {
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 })
  }

  try {
    // Initialize the Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // The function now accepts an array of userIds or a single userId
    const { userIds, userId, title, body, tag, data } = await req.json()

    let targetUserIds = [];
    if (userIds && Array.isArray(userIds)) {
      targetUserIds = userIds;
    } else if (userId) {
      targetUserIds.push(userId);
    }

    if (targetUserIds.length === 0 || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userIds (or userId), title, body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get users' push subscriptions
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .in('user_id', targetUserIds)

    if (subsError) {
      throw new Error(`Failed to fetch push subscriptions: ${subsError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No push subscriptions found for the given users.' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const notificationPayload: NotificationPayload = {
      title,
      body,
      tag,
      data
    }

    const sendPromises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };
      return sendWebPush(pushSubscription, notificationPayload).catch(error => {
        console.error(`Failed to send push to user ${sub.user_id}:`, error.body || error.message);
        // Return a failed status for this specific push
        return { status: 'failed', userId: sub.user_id, error: error.message };
      });
    });

    const results = await Promise.allSettled(sendPromises);
    console.log('Push notification results:', results);

    return new Response(
      JSON.stringify({ success: true, message: 'Push notifications processed.' }),
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