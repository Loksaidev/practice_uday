-- Fix player_guesses policies to handle anonymous players

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own guesses" ON player_guesses;

-- Create new INSERT policy that handles both authenticated and anonymous players
CREATE POLICY "Users can insert their own guesses"
ON player_guesses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM players
    WHERE players.id = player_guesses.player_id
      AND (
        players.user_id = auth.uid() 
        OR players.user_id IS NULL
      )
  )
);

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update their own guesses" ON player_guesses;

-- Create new UPDATE policy that handles both authenticated and anonymous players
CREATE POLICY "Users can update their own guesses"
ON player_guesses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM players
    WHERE players.id = player_guesses.player_id
      AND (
        players.user_id = auth.uid() 
        OR players.user_id IS NULL
      )
  )
);