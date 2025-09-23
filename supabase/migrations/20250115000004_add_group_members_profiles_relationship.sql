-- Add foreign key relationship between group_members.user_id and profiles.id
ALTER TABLE group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Also add missing email column to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
        
        -- Update existing profiles with email from auth.users
        UPDATE profiles 
        SET email = auth.users.email 
        FROM auth.users 
        WHERE profiles.id = auth.users.id;
        
        -- Make email unique
        ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
    END IF;
END $$;