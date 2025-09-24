-- Add join_code column to groups table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'groups' AND column_name = 'join_code') THEN
        ALTER TABLE groups ADD COLUMN join_code TEXT UNIQUE;
        
        -- Generate join codes for existing groups
        UPDATE groups 
        SET join_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))
        WHERE join_code IS NULL;
        
        -- Make join_code NOT NULL after populating existing records
        ALTER TABLE groups ALTER COLUMN join_code SET NOT NULL;
    END IF;
END $$;