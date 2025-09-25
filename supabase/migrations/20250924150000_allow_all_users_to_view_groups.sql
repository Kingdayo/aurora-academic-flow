-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view groups they own or are members of" ON public.groups;

-- Create a new policy that allows any authenticated user to view all groups
CREATE POLICY "Allow all authenticated users to view groups"
ON public.groups FOR SELECT
USING (auth.role() = 'authenticated');