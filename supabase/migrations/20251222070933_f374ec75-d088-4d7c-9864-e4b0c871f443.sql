-- Create function to reassign host when current host leaves
CREATE OR REPLACE FUNCTION public.reassign_host(p_room_id UUID, p_leaving_player_id UUID)
RETURNS TABLE(new_host_id UUID, new_host_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH new_host AS (
    UPDATE players
    SET is_host = true
    WHERE id = (
      SELECT id FROM players
      WHERE room_id = p_room_id
        AND id != p_leaving_player_id
        AND (is_ai = false OR is_ai IS NULL)
      ORDER BY random()
      LIMIT 1
    )
    RETURNING id, name
  )
  SELECT id, name FROM new_host;
END;
$$;