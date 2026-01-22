-- Ensure realtime is properly configured for game tables
-- Drop and recreate the realtime publication to refresh it after schema changes

-- First, ensure REPLICA IDENTITY is set correctly for all game tables
ALTER TABLE game_rooms REPLICA IDENTITY FULL;
ALTER TABLE players REPLICA IDENTITY FULL;
ALTER TABLE player_selections REPLICA IDENTITY FULL;
ALTER TABLE player_guesses REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication if not already present
DO $$
BEGIN
  -- Check and add game_rooms
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'game_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
  END IF;

  -- Check and add players
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
  END IF;

  -- Check and add player_selections
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'player_selections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE player_selections;
  END IF;

  -- Check and add player_guesses
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'player_guesses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE player_guesses;
  END IF;
END $$;