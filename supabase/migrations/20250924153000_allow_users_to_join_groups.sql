-- Create a new policy that allows any authenticated user to insert a record into group_members for themselves.
CREATE POLICY "Allow users to join groups"
ON public.group_members FOR INSERT
WITH CHECK (auth.uid() = user_id);