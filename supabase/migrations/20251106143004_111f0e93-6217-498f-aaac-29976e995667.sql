-- Drop the foreign key constraint on player_selections.topic_id
-- This allows the topic_id to reference either topics or custom_topics tables
ALTER TABLE public.player_selections 
DROP CONSTRAINT IF EXISTS player_selections_topic_id_fkey;