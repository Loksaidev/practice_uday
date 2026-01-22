-- Add is_ai column to players table
ALTER TABLE public.players
ADD COLUMN is_ai boolean DEFAULT false;

-- Update existing players to ensure they're not AI
UPDATE public.players
SET is_ai = false
WHERE is_ai IS NULL;