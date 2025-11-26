ALTER TABLE push_subscriptions DROP CONSTRAINT push_subscriptions_user_id_key;
ALTER TABLE push_subscriptions ADD PRIMARY KEY (endpoint);