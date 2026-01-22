-- Re-enable RLS with working policies
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Ensure no restrictive policies exist
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'game_rooms') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON game_rooms';
    END LOOP;
END $$;

-- Create PERMISSIVE INSERT policy (explicitly stated)
CREATE POLICY "game_rooms_insert"
ON game_rooms
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (true);

-- Create SELECT policy using security definer function
CREATE POLICY "game_rooms_select"
ON game_rooms
AS PERMISSIVE
FOR SELECT
TO public
USING (is_user_in_room(id, auth.uid()));

-- Create UPDATE policy
CREATE POLICY "game_rooms_update"
ON game_rooms
AS PERMISSIVE
FOR UPDATE
TO public
USING (is_user_in_room(id, auth.uid()))
WITH CHECK (is_user_in_room(id, auth.uid()));