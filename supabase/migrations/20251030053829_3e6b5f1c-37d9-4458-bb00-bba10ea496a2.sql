-- Drop existing INSERT policy
DROP POLICY IF EXISTS "game_rooms_insert" ON game_rooms;

-- Create separate INSERT policies for authenticated and anonymous users
CREATE POLICY "game_rooms_insert_authenticated"
ON game_rooms
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "game_rooms_insert_anon"
ON game_rooms
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);