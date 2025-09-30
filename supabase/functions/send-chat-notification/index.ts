import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { chatId, message, senderId } = await req.json();

    if (!chatId || !message || !senderId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: chatUsers, error: usersError } = await supabase
      .from("chat_users")
      .select("user_id")
      .eq("chat_id", chatId)
      .neq("user_id", senderId);

    if (usersError) {
      console.error("Error fetching chat users:", usersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch chat users" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!chatUsers || chatUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users to notify in this chat" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const notificationPromises = chatUsers.map(async (user) => {
      const { data: subscription, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", user.user_id)
        .single();

      if (error || !subscription) {
        console.warn(`Push subscription not found for user: ${user.user_id}`);
        return;
      }

      await supabase.functions.invoke("send-push", {
        body: {
          userId: user.user_id,
          title: "New Chat Message",
          body: message,
        },
      });
    });

    await Promise.all(notificationPromises);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Chat notifications sent successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing chat notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});