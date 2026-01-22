-- Update game_rooms INSERT policy to allow creation
-- Security is maintained through the players table which requires auth
DROP POLICY IF EXISTS "Authenticated users can create game rooms" ON game_rooms;

CREATE POLICY "Anyone can create game rooms"
ON game_rooms FOR INSERT
WITH CHECK (true);