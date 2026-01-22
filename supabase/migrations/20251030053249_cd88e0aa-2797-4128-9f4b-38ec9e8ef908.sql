-- Force complete policy reset
ALTER TABLE game_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Drop ALL policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'game_rooms') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON game_rooms';
    END LOOP;
END $$;

-- Create the most permissive INSERT policy possible
CREATE POLICY "game_rooms_allow_insert"
ON game_rooms
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (true);

-- Add SELECT policy
CREATE POLICY "game_rooms_allow_select"
ON game_rooms
AS PERMISSIVE
FOR SELECT
TO public
USING (is_user_in_room(id, auth.uid()));

-- Add UPDATE policy
CREATE POLICY "game_rooms_allow_update"
ON game_rooms
AS PERMISSIVE
FOR UPDATE
TO public
USING (is_user_in_room(id, auth.uid()));

-- Force a schema cache refresh
NOTIFY pgrst, 'reload schema';