-- Allow anyone to insert game history records
CREATE POLICY "Anyone can insert game history"
ON game_history
FOR INSERT
TO public
WITH CHECK (true);