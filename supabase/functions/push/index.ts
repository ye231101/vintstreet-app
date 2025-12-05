import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

interface Notification {
  id: string;
  user_id: string;
  type?: string;
  title?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Notification;
  schema: 'public';
  old_record: null | Notification;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');

    const payload: WebhookPayload = await req.json();
    const notification = payload.record;

    // Only process INSERT events
    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ message: 'Ignoring non-INSERT event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's push token
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('expo_push_token')
      .eq('user_id', notification.user_id)
      .single();

    if (profileError || !profileData?.expo_push_token) {
      return new Response(JSON.stringify({ message: 'User does not have a push token registered' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine notification title and body based on type
    let notificationTitle = notification.title || 'Notification';
    let notificationBody = notification.body;

    // Customize notification based on type
    switch (notification.type) {
      case 'message':
        notificationTitle = notification.title || 'New Message';
        break;
      case 'offer_created':
        notificationTitle = notification.title || 'New Offer';
        break;
      case 'offer_accepted':
        notificationTitle = notification.title || 'Offer Accepted';
        break;
      case 'offer_declined':
        notificationTitle = notification.title || 'Offer Declined';
        break;
    }

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('EXPO_PUBLIC_ACCESS_TOKEN')}`,
      },
      body: JSON.stringify({
        to: profileData.expo_push_token,
        sound: 'default',
        title: notificationTitle,
        body: notificationBody,
        data: {
          notification_id: notification.id,
          type: notification.type,
          metadata: notification.metadata || {},
        },
        priority: 'high',
        badge: 1,
      }),
    }).then((res) => res.json());

    return new Response(JSON.stringify(res), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[PUSH] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
