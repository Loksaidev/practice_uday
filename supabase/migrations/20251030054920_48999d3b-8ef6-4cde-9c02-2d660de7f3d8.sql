-- Drop existing players INSERT policy
DROP POLICY IF EXISTS "Authenticated users can join as player" ON players;

-- Create separate INSERT policies for authenticated and anon roles
CREATE POLICY "players_insert_authenticated"
ON players
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR is_ai = true);

CREATE POLICY "players_insert_anon"
ON players
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (user_id = auth.uid() OR is_ai = true);

-- Drop existing players SELECT policy  
DROP POLICY IF EXISTS "Users can view players in their rooms" ON players;

-- Create new SELECT policy for both roles
CREATE POLICY "players_select"
ON players
AS PERMISSIVE
FOR SELECT
TO authenticated, anon
USING (is_user_in_room(room_id, auth.uid()));