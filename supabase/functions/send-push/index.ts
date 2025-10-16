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

async function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function importPrivateKey(privateKeyString: string): Promise<CryptoKey> {
  // Try to parse as JWK first
  try {
    const jwk = JSON.parse(privateKeyString)
    if (jwk.kty && jwk.crv) {
      // It's a JWK format
      return await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      )
    }
  } catch {
    // Not JSON, treat as base64-encoded PKCS#8
  }
  
  // Import as PKCS#8
  const privateKeyBytes = await urlBase64ToUint8Array(privateKeyString)
  return await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )
}

async function createVapidAuthHeader(vapidKeys: { publicKey: string, privateKey: string, subject: string }, endpoint: string): Promise<{ authorization: string }> {
  const url = new URL(endpoint)
  const audience = `${url.protocol}//${url.host}`
  
  const header = { typ: 'JWT', alg: 'ES256' }
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60),
    sub: vapidKeys.subject
  }
  
  const encoder = new TextEncoder()
  const encodedHeader = base64UrlEncode(encoder.encode(JSON.stringify(header)))
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`
  
  const privateKey = await importPrivateKey(vapidKeys.privateKey)
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    encoder.encode(unsignedToken)
  )
  
  const encodedSignature = base64UrlEncode(new Uint8Array(signature))
  const jwt = `${unsignedToken}.${encodedSignature}`
  
  return {
    authorization: `vapid t=${jwt}, k=${vapidKeys.publicKey}`
  }
}

async function sendWebPush(subscription: any, payload: NotificationPayload) {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('VAPID public and private keys are not configured.')
  }

  const vapidKeys = {
    publicKey: vapidPublicKey,
    privateKey: vapidPrivateKey,
    subject: 'mailto:noreply@aurora.app'
  }

  const payloadString = JSON.stringify(payload)
  const jwt = await createVapidAuthHeader(vapidKeys, subscription.endpoint)
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    'TTL': '86400',
    'Authorization': jwt.authorization
  }

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers,
    body: payloadString
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Push failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return response
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
