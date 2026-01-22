-- Drop the existing INSERT policies for players
DROP POLICY IF EXISTS "players_insert_authenticated" ON players;
DROP POLICY IF EXISTS "players_insert_anon" ON players;

-- Create new INSERT policies that are more permissive for the join flow
-- Allow inserting if: user_id matches auth.uid(), OR is_ai is true, OR user_id is NULL (for anonymous)
CREATE POLICY "players_insert_authenticated"
ON players
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR 
  is_ai = true OR 
  user_id IS NULL
);

CREATE POLICY "players_insert_anon"
ON players
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (
  user_id = auth.uid() OR 
  is_ai = true OR 
  user_id IS NULL
);