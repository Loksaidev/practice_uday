-- Fix ambiguous organization_id reference in validate_join_code function
CREATE OR REPLACE FUNCTION public.validate_join_code(
  _join_code text,
  OUT room_exists boolean,
  OUT room_id uuid,
  OUT room_status text,
  OUT player_count integer,
  OUT organization_id uuid,
  OUT user_already_joined boolean
)
RETURNS record
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Get room information with properly qualified organization_id
  SELECT 
    EXISTS(SELECT 1 FROM game_rooms WHERE LOWER(join_code) = LOWER(_join_code)),
    gr.id,
    gr.status,
    gr.organization_id
  INTO room_exists, room_id, room_status, organization_id
  FROM game_rooms gr
  WHERE LOWER(gr.join_code) = LOWER(_join_code);
  
  IF room_exists THEN
    -- Count players in the room
    SELECT COUNT(*)
    INTO player_count
    FROM players
    WHERE players.room_id = validate_join_code.room_id;
    
    -- Check if current user is already in the room
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
$function$;