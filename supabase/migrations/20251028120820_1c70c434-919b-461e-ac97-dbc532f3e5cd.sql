-- Add DELETE policy for players table
CREATE POLICY "Anyone can delete AI players"
ON public.players
FOR DELETE
USING (is_ai = true);