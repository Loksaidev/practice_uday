-- Create function to kick inactive player and return remaining human player count
CREATE OR REPLACE FUNCTION public.kick_inactive_player(
  p_room_id UUID,
  p_player_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  remaining_count INTEGER;
  kicked_was_host BOOLEAN;
BEGIN
  -- Check if player was host
  SELECT is_host INTO kicked_was_host
  FROM players WHERE id = p_player_id;

  -- Clean up foreign key references before deleting the player
  -- Delete player guesses where this player is the guesser
  DELETE FROM player_guesses WHERE player_id = p_player_id;
  -- Delete player guesses where this player is the VIP (being guessed about)
  DELETE FROM player_guesses WHERE vip_player_id = p_player_id;
  -- Delete player selections where this player made selections
  DELETE FROM player_selections WHERE player_id = p_player_id;

  -- Delete the player
  DELETE FROM players WHERE id = p_player_id;

  -- If kicked player was host, reassign to another human player
  IF kicked_was_host THEN
    UPDATE players
    SET is_host = true
    WHERE id = (
      SELECT id FROM players
      WHERE room_id = p_room_id
        AND (is_ai = false OR is_ai IS NULL)
      ORDER BY joined_at ASC
      LIMIT 1
    );
  END IF;

  -- Count remaining human players
  SELECT COUNT(*) INTO remaining_count
  FROM players
  WHERE room_id = p_room_id AND (is_ai = false OR is_ai IS NULL);

  RETURN remaining_count;
END;
$$;

-- Create function to end game early when not enough players remain
CREATE OR REPLACE FUNCTION public.end_game_early(p_room_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE game_rooms
  SET 
    status = 'finished',
    game_phase = 'finished'
  WHERE id = p_room_id;
END;
$$;