-- Create security definer function to check if user is in a room
CREATE OR REPLACE FUNCTION public.is_user_in_room(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.players
    WHERE room_id = _room_id
      AND user_id = _user_id
  )
$$;

-- Update RLS policies to use the function

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view players in their rooms" ON players;
DROP POLICY IF EXISTS "Players can view their game room" ON game_rooms;
DROP POLICY IF EXISTS "Players can update their game room" ON game_rooms;
DROP POLICY IF EXISTS "Users can view selections in their rooms" ON player_selections;
DROP POLICY IF EXISTS "Users can view guesses in their rooms" ON player_guesses;

-- Recreate policies using the security definer function

-- Players table
CREATE POLICY "Users can view players in their rooms"
ON players FOR SELECT
USING (is_user_in_room(room_id, auth.uid()));

-- Game rooms table
CREATE POLICY "Players can view their game room"
ON game_rooms FOR SELECT
USING (is_user_in_room(id, auth.uid()));

CREATE POLICY "Players can update their game room"
ON game_rooms FOR UPDATE
USING (is_user_in_room(id, auth.uid()));

-- Player selections table
CREATE POLICY "Users can view selections in their rooms"
ON player_selections FOR SELECT
USING (is_user_in_room(room_id, auth.uid()));

-- Player guesses table
CREATE POLICY "Users can view guesses in their rooms"
ON player_guesses FOR SELECT
USING (is_user_in_room(room_id, auth.uid()));