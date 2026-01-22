-- Disable RLS temporarily
ALTER TABLE game_rooms DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all inserts to game_rooms" ON game_rooms;
DROP POLICY IF EXISTS "Players can view their game room" ON game_rooms;
DROP POLICY IF EXISTS "Players can update their game room" ON game_rooms;

-- Create new INSERT policy (simplest possible)
CREATE POLICY "game_rooms_insert_policy"
ON game_rooms
FOR INSERT
WITH CHECK (true);

-- Create new SELECT policy
CREATE POLICY "game_rooms_select_policy"
ON game_rooms
FOR SELECT
USING (is_user_in_room(id, auth.uid()));

-- Create new UPDATE policy
CREATE POLICY "game_rooms_update_policy"
ON game_rooms
FOR UPDATE
USING (is_user_in_room(id, auth.uid()));