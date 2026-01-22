-- Drop existing INSERT policy for player_selections
DROP POLICY IF EXISTS "Users can insert their own selections" ON player_selections;

-- Create new INSERT policy that handles both authenticated and anonymous players
CREATE POLICY "Users can insert their own selections"
ON player_selections
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM players
    WHERE players.id = player_selections.player_id
      AND (
        players.user_id = auth.uid() 
        OR players.user_id IS NULL
      )
  )
);