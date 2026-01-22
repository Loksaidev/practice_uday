-- Phase 1: Clean up ALL foreign key references before deleting players with NULL user_id

-- Clear current_vip_id in game_rooms that references players with NULL user_id
UPDATE game_rooms
SET current_vip_id = NULL
WHERE current_vip_id IN (SELECT id FROM players WHERE user_id IS NULL);

-- Delete player_guesses for players with NULL user_id
DELETE FROM player_guesses 
WHERE player_id IN (SELECT id FROM players WHERE user_id IS NULL)
   OR vip_player_id IN (SELECT id FROM players WHERE user_id IS NULL);

-- Delete player_selections for players with NULL user_id
DELETE FROM player_selections 
WHERE player_id IN (SELECT id FROM players WHERE user_id IS NULL);

-- Now delete players with NULL user_id
DELETE FROM players WHERE user_id IS NULL;

-- Add unique constraint to prevent duplicate sessions per room
ALTER TABLE players
ADD CONSTRAINT players_unique_user_per_room UNIQUE (room_id, user_id);

-- Add constraint: user_id required for human players, optional for AI
ALTER TABLE players
ADD CONSTRAINT players_user_id_required_for_humans
CHECK (is_ai = true OR user_id IS NOT NULL);

-- Phase 2: Update validate_join_code function

CREATE OR REPLACE FUNCTION public.validate_join_code(
  _join_code text,
  OUT room_exists boolean,
  OUT room_id uuid,
  OUT room_status text,
  OUT player_count integer,
  OUT organization_id uuid,
  OUT user_already_joined boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT 
    EXISTS(SELECT 1 FROM game_rooms WHERE LOWER(join_code) = LOWER(_join_code)),
    id,
    status,
    organization_id
  INTO room_exists, room_id, room_status, organization_id
  FROM game_rooms
  WHERE LOWER(join_code) = LOWER(_join_code);
  
  IF room_exists THEN
    SELECT COUNT(*)
    INTO player_count
    FROM players
    WHERE players.room_id = validate_join_code.room_id;
    
    SELECT EXISTS(
      SELECT 1 FROM players
      WHERE players.room_id = validate_join_code.room_id
        AND players.user_id = auth.uid()
    )
    INTO user_already_joined;
  ELSE
    player_count := 0;
    user_already_joined := false;
  END IF;
END;
$$;

-- Phase 3: Update RLS policies for game_rooms

DROP POLICY IF EXISTS "Anyone can view game rooms" ON game_rooms;
DROP POLICY IF EXISTS "Anyone can update game rooms" ON game_rooms;
DROP POLICY IF EXISTS "Anyone can create game rooms" ON game_rooms;

CREATE POLICY "Players can view their game room"
ON game_rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM players
    WHERE players.room_id = game_rooms.id
      AND players.user_id = auth.uid()
  )
);

CREATE POLICY "Players can update their game room"
ON game_rooms FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM players
    WHERE players.room_id = game_rooms.id
      AND players.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create game rooms"
ON game_rooms FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Phase 4: Update RLS policies for players

DROP POLICY IF EXISTS "Anyone can join as player" ON players;
DROP POLICY IF EXISTS "Anyone can view players" ON players;
DROP POLICY IF EXISTS "Anyone can update players" ON players;

CREATE POLICY "Authenticated users can join as player"
ON players FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id = auth.uid() OR is_ai = true)
);

CREATE POLICY "Users can view players in their rooms"
ON players FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM players AS p
    WHERE p.room_id = players.room_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own player"
ON players FOR UPDATE
USING (user_id = auth.uid());

-- Phase 5: Update RLS policies for player_selections

DROP POLICY IF EXISTS "Anyone can insert player selections" ON player_selections;
DROP POLICY IF EXISTS "Anyone can view player selections" ON player_selections;

CREATE POLICY "Users can insert their own selections"
ON player_selections FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM players
    WHERE players.id = player_selections.player_id
      AND players.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view selections in their rooms"
ON player_selections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM players AS p
    WHERE p.room_id = player_selections.room_id
      AND p.user_id = auth.uid()
  )
);

-- Phase 6: Update RLS policies for player_guesses

DROP POLICY IF EXISTS "Anyone can insert player guesses" ON player_guesses;
DROP POLICY IF EXISTS "Anyone can update player guesses" ON player_guesses;
DROP POLICY IF EXISTS "Anyone can view player guesses" ON player_guesses;

CREATE POLICY "Users can insert their own guesses"
ON player_guesses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM players
    WHERE players.id = player_guesses.player_id
      AND players.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own guesses"
ON player_guesses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM players
    WHERE players.id = player_guesses.player_id
      AND players.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view guesses in their rooms"
ON player_guesses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM players AS p
    WHERE p.room_id = player_guesses.room_id
      AND p.user_id = auth.uid()
  )
);