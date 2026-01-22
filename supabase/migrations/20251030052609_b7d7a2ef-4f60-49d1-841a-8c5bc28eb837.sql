-- Drop and recreate INSERT policy with explicit role targeting
DROP POLICY IF EXISTS "Anyone can create game rooms" ON game_rooms;

-- Create policy that explicitly targets all authenticated users
CREATE POLICY "Authenticated users can create game rooms"
ON game_rooms
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also allow public (anonymous) users to create rooms
CREATE POLICY "Anonymous users can create game rooms"
ON game_rooms
FOR INSERT
TO anon
WITH CHECK (true);