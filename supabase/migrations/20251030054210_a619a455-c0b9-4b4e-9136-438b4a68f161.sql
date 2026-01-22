-- Drop existing SELECT policy
DROP POLICY IF EXISTS "game_rooms_select" ON game_rooms;

-- Create more permissive SELECT policy
-- Allow viewing rooms you're in OR any room (for join code validation and room creation)
-- Security is enforced through UPDATE/DELETE policies instead
CREATE POLICY "game_rooms_select_permissive"
ON game_rooms
AS PERMISSIVE
FOR SELECT
TO authenticated, anon
USING (true);