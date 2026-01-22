-- Allow users to delete their own player record
CREATE POLICY "Users can delete their own player"
ON public.players
FOR DELETE
USING (user_id = auth.uid());