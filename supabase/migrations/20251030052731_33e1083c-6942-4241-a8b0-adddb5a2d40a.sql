-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Authenticated users can create game rooms" ON game_rooms;
DROP POLICY IF EXISTS "Anonymous users can create game rooms" ON game_rooms;

-- Create a single policy for all users (authenticated, anonymous, and public)
CREATE POLICY "Allow all inserts to game_rooms"
ON game_rooms
FOR INSERT
TO public
WITH CHECK (true);