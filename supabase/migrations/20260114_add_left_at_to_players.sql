-- Add left_at column to players table to track when players leave during a game
ALTER TABLE players ADD COLUMN left_at TIMESTAMPTZ;