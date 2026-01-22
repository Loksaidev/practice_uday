-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "players_select" ON players;

-- Create a more permissive SELECT policy that allows viewing all players
-- This is appropriate for a game where seeing other players is part of the functionality
CREATE POLICY "players_select_public"
ON players
AS PERMISSIVE
FOR SELECT
TO authenticated, anon
USING (true);