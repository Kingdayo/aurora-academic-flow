import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigins = [
  'https://aurora-task-flow.netlify.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080'
];

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && allowedOrigins.includes(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
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

  // Use Web Crypto API for VAPID signature (Deno native)
  const vapidKeys = {
    publicKey: vapidPublicKey,
    privateKey: vapidPrivateKey,
    subject: 'mailto:noreply@aurora.app'
  }

  const encoder = new TextEncoder()
  const payloadString = JSON.stringify(payload)
  
  // Create VAPID headers
  const jwt = await createVapidAuthHeader(vapidKeys, subscription.endpoint)
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Content-Encoding': 'aes128gcm',
    'TTL': '86400',
    'Authorization': jwt.authorization,
    'Crypto-Key': jwt.cryptoKey
  }

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers,
    body: payloadString
  })

  if (!response.ok) {
    throw new Error(`Push failed: ${response.status} ${response.statusText}`)
  }

  return response
}

async function createVapidAuthHeader(vapidKeys: any, endpoint: string) {
  const url = new URL(endpoint)
  const audience = `${url.protocol}//${url.host}`
  
  // Simple JWT creation for VAPID (HS256)
  const header = { typ: 'JWT', alg: 'ES256' }
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60), // 12 hours
    sub: vapidKeys.subject
  }
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  
  return {
    authorization: `vapid t=${encodedHeader}.${encodedPayload}.signature, k=${vapidKeys.publicKey}`,
    cryptoKey: `p256ecdsa=${vapidKeys.publicKey}`
  }
}

function base64UrlEncode(str: string): string {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  let base64 = btoa(String.fromCharCode(...data))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    // Initialize the Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // The function accepts an array of userIds or a single userId
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Failed to send push to user ${sub.user_id}:`, errorMessage);
        return { status: 'failed', userId: sub.user_id, error: errorMessage };
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error in send-push function:', errorMessage)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
