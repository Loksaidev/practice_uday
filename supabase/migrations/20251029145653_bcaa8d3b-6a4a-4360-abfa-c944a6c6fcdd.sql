-- Delete all game-related data
-- First, clear foreign key references
UPDATE game_rooms SET current_vip_id = NULL;

-- Now delete in the correct order
DELETE FROM player_guesses;
DELETE FROM player_selections;
DELETE FROM players;
DELETE FROM game_rooms;
DELETE FROM game_history;