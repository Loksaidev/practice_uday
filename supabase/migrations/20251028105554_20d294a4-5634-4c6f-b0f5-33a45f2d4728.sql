-- Create game_history table for finished games
CREATE TABLE IF NOT EXISTS public.game_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_name text NOT NULL,
  join_code text NOT NULL,
  total_rounds integer NOT NULL DEFAULT 1,
  started_at timestamp with time zone NOT NULL,
  finished_at timestamp with time zone NOT NULL DEFAULT now(),
  winner_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on game_history
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

-- Create policies for game_history (read-only for everyone)
CREATE POLICY "Anyone can view game history"
ON public.game_history
FOR SELECT
USING (true);

-- Create temporary mapping table for room ID migration
CREATE TEMP TABLE room_id_mapping AS
SELECT 
  id as old_id,
  gen_random_uuid() as new_id,
  UPPER(SUBSTRING(MD5(id::text || RANDOM()::text) FROM 1 FOR 6)) as join_code
FROM public.game_rooms;

-- Drop existing foreign key constraint on players
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_room_id_fkey;

-- Create new game_rooms table with UUID
CREATE TABLE public.game_rooms_new (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  join_code text NOT NULL UNIQUE,
  host_name text NOT NULL,
  status text NOT NULL DEFAULT 'waiting'::text,
  current_round integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new game_rooms
ALTER TABLE public.game_rooms_new ENABLE ROW LEVEL SECURITY;

-- Create policies for new game_rooms
CREATE POLICY "Anyone can create game rooms"
ON public.game_rooms_new
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view game rooms"
ON public.game_rooms_new
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update game rooms"
ON public.game_rooms_new
FOR UPDATE
USING (true);

-- Migrate game_rooms data using the mapping
INSERT INTO public.game_rooms_new (id, join_code, host_name, status, current_round, created_at, updated_at)
SELECT 
  m.new_id,
  m.join_code,
  gr.host_name,
  gr.status,
  gr.current_round,
  gr.created_at,
  gr.updated_at
FROM public.game_rooms gr
JOIN room_id_mapping m ON gr.id = m.old_id;

-- Create new players table with UUID room_id
CREATE TABLE public.players_new (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  score integer DEFAULT 0,
  is_host boolean DEFAULT false,
  room_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new players
ALTER TABLE public.players_new ENABLE ROW LEVEL SECURITY;

-- Create policies for new players
CREATE POLICY "Anyone can join as player"
ON public.players_new
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view players"
ON public.players_new
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update players"
ON public.players_new
FOR UPDATE
USING (true);

-- Migrate players data using the mapping
INSERT INTO public.players_new (id, name, score, is_host, room_id, joined_at)
SELECT 
  p.id,
  p.name,
  p.score,
  p.is_host,
  m.new_id,
  p.joined_at
FROM public.players p
JOIN room_id_mapping m ON p.room_id = m.old_id;

-- Drop old tables
DROP TABLE public.players CASCADE;
DROP TABLE public.game_rooms CASCADE;

-- Rename new tables
ALTER TABLE public.game_rooms_new RENAME TO game_rooms;
ALTER TABLE public.players_new RENAME TO players;

-- Add foreign key constraint
ALTER TABLE public.players 
ADD CONSTRAINT players_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES public.game_rooms(id) ON DELETE CASCADE;

-- Add trigger for updating updated_at
CREATE TRIGGER update_game_rooms_updated_at
BEFORE UPDATE ON public.game_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate unique join codes
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text) FROM 1 FOR 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM game_rooms WHERE join_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Add default value for join_code using the function
ALTER TABLE public.game_rooms 
ALTER COLUMN join_code SET DEFAULT generate_join_code();