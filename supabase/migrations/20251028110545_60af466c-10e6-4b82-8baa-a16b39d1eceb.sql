-- Update generate_join_code function to use WordNumWordNum format
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
  words text[] := ARRAY[
    'Happy', 'Lucky', 'Swift', 'Brave', 'Clever', 'Funny', 'Mighty', 'Noble',
    'Quick', 'Smart', 'Wise', 'Bold', 'Calm', 'Cool', 'Eager', 'Fair',
    'Grand', 'Kind', 'Light', 'Merry', 'Proud', 'Royal', 'Sharp', 'Strong',
    'Tiger', 'Eagle', 'Dragon', 'Phoenix', 'Wolf', 'Bear', 'Lion', 'Falcon',
    'Ocean', 'River', 'Storm', 'Thunder', 'Fire', 'Wind', 'Star', 'Moon',
    'Winner', 'Hero', 'Champion', 'Master', 'Legend', 'Scope', 'Quest', 'Game',
    'Victory', 'Power', 'Magic', 'Dream', 'Flash', 'Blast', 'Crown', 'Force'
  ];
  word1 text;
  word2 text;
  digit1 int;
  digit2 int;
BEGIN
  LOOP
    -- Generate WordNumWordNum format
    word1 := words[floor(random() * array_length(words, 1) + 1)];
    digit1 := floor(random() * 10);
    word2 := words[floor(random() * array_length(words, 1) + 1)];
    digit2 := floor(random() * 10);
    
    new_code := word1 || digit1 || word2 || digit2;
    
    -- Check if code already exists (case-insensitive)
    SELECT EXISTS(
      SELECT 1 FROM game_rooms WHERE LOWER(join_code) = LOWER(new_code)
    ) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;