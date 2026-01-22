-- Enable realtime for players table
ALTER TABLE public.players REPLICA IDENTITY FULL;

-- Add players table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;