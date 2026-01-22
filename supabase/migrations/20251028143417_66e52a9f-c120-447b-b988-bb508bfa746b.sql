-- Enable realtime for game_rooms table
ALTER TABLE public.game_rooms REPLICA IDENTITY FULL;

-- Ensure the table is part of the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;