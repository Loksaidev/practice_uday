-- Drop the CHECK constraint that's preventing player inserts
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_user_id_required_for_humans;