CREATE OR REPLACE FUNCTION send_push_notification(subscription json, title text, body text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM http_post(
    'https://fcm.googleapis.com/fcm/send',
    json_build_object(
      'to', subscription->>'endpoint',
      'notification', json_build_object(
        'title', title,
        'body', body
      )
    )::text,
    'application/json',
    json_build_object(
      'Authorization', 'key=' || 'BL1PObJwaS_mnIc6iNJdybuonb_u9dCEt3kZwt3pZaG_Pc_B4-ErmPVu6gdzgwL-JY0xpCOEq0vjol7DVeOTLxk' -- Replace with your FCM server key
    )::text[]
  );
END;
$$;
