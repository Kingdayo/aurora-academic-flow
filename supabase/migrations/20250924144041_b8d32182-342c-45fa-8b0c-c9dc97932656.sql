-- Add join_code column to groups table
ALTER TABLE public.groups ADD COLUMN join_code TEXT UNIQUE;

-- Update existing groups with unique join codes
UPDATE public.groups SET join_code = UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8)) WHERE join_code IS NULL;

-- Make join_code not null after populating existing rows
ALTER TABLE public.groups ALTER COLUMN join_code SET NOT NULL;