-- Create topics table with categories
CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create topic items table
CREATE TABLE public.topic_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create player selections table (stores each player's topic choice and ordered like list)
CREATE TABLE public.player_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES public.game_rooms(id) ON DELETE CASCADE NOT NULL,
  round integer NOT NULL DEFAULT 1,
  topic_id uuid REFERENCES public.topics(id) NOT NULL,
  ordered_items jsonb NOT NULL, -- Array of item IDs in player's preferred order (5 items)
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(player_id, room_id, round)
);

-- Create player guesses table (stores other players' guesses of VIP's order)
CREATE TABLE public.player_guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES public.game_rooms(id) ON DELETE CASCADE NOT NULL,
  round integer NOT NULL DEFAULT 1,
  vip_player_id uuid REFERENCES public.players(id) NOT NULL,
  guessed_order jsonb NOT NULL, -- Array of item IDs in guessed order
  score integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(player_id, room_id, round, vip_player_id)
);

-- Add columns to game_rooms for VIP tracking and game phase
ALTER TABLE public.game_rooms 
ADD COLUMN current_vip_id uuid REFERENCES public.players(id),
ADD COLUMN game_phase text DEFAULT 'waiting', -- waiting, topic_selection, guessing, scoring, finished
ADD COLUMN total_rounds integer DEFAULT 3,
ADD COLUMN vips_completed integer DEFAULT 0;

-- Enable RLS
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_guesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Anyone can view topic items" ON public.topic_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert player selections" ON public.player_selections FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view player selections" ON public.player_selections FOR SELECT USING (true);
CREATE POLICY "Anyone can insert player guesses" ON public.player_guesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view player guesses" ON public.player_guesses FOR SELECT USING (true);
CREATE POLICY "Anyone can update player guesses" ON public.player_guesses FOR UPDATE USING (true);

-- Insert sample topics and items
INSERT INTO public.topics (name, category) VALUES
  ('Favorite Pizza Toppings', 'Food'),
  ('Best Vacation Destinations', 'Travel'),
  ('Top Movie Genres', 'Entertainment'),
  ('Preferred Coffee Drinks', 'Food'),
  ('Dream Cars', 'Lifestyle'),
  ('Favorite Sports', 'Sports'),
  ('Best Ice Cream Flavors', 'Food'),
  ('Social Media Platforms', 'Technology'),
  ('Favorite Seasons', 'Lifestyle'),
  ('Best TV Show Types', 'Entertainment');

-- Insert items for each topic
INSERT INTO public.topic_items (topic_id, name)
SELECT id, unnest(ARRAY['Pepperoni', 'Mushrooms', 'Sausage', 'Onions', 'Extra Cheese', 'Black Olives', 'Green Peppers', 'Pineapple', 'Bacon', 'Spinach'])
FROM public.topics WHERE name = 'Favorite Pizza Toppings';

INSERT INTO public.topic_items (topic_id, name)
SELECT id, unnest(ARRAY['Beach Paradise', 'Mountain Retreat', 'European Cities', 'Safari Adventure', 'Tropical Islands', 'Asian Culture Tour', 'American Road Trip', 'Arctic Expedition', 'Historical Landmarks', 'Wine Country'])
FROM public.topics WHERE name = 'Best Vacation Destinations';

INSERT INTO public.topic_items (topic_id, name)
SELECT id, unnest(ARRAY['Action', 'Comedy', 'Drama', 'Horror', 'Science Fiction', 'Romance', 'Thriller', 'Documentary', 'Animation', 'Mystery'])
FROM public.topics WHERE name = 'Top Movie Genres';

INSERT INTO public.topic_items (topic_id, name)
SELECT id, unnest(ARRAY['Espresso', 'Latte', 'Cappuccino', 'Americano', 'Mocha', 'Macchiato', 'Cold Brew', 'Flat White', 'Frappuccino', 'Irish Coffee'])
FROM public.topics WHERE name = 'Preferred Coffee Drinks';

INSERT INTO public.topic_items (topic_id, name)
SELECT id, unnest(ARRAY['Tesla Model S', 'Porsche 911', 'Ferrari F8', 'Lamborghini Aventador', 'Mercedes G-Wagon', 'Range Rover', 'BMW M5', 'Audi R8', 'McLaren 720S', 'Rolls Royce Phantom'])
FROM public.topics WHERE name = 'Dream Cars';

INSERT INTO public.topic_items (topic_id, name)
SELECT id, unnest(ARRAY['Soccer', 'Basketball', 'Tennis', 'Baseball', 'Football', 'Swimming', 'Golf', 'Hockey', 'Volleyball', 'Boxing'])
FROM public.topics WHERE name = 'Favorite Sports';

INSERT INTO public.topic_items (topic_id, name)
SELECT id, unnest(ARRAY['Vanilla', 'Chocolate', 'Strawberry', 'Mint Chocolate Chip', 'Cookie Dough', 'Rocky Road', 'Pistachio', 'Salted Caramel', 'Coffee', 'Mango'])
FROM public.topics WHERE name = 'Best Ice Cream Flavors';

INSERT INTO public.topic_items (topic_id, name)
SELECT id, unnest(ARRAY['Instagram', 'Twitter/X', 'Facebook', 'TikTok', 'LinkedIn', 'YouTube', 'Snapchat', 'Pinterest', 'Reddit', 'Discord'])
FROM public.topics WHERE name = 'Social Media Platforms';

INSERT INTO public.topic_items (topic_id, name)
SELECT id, unnest(ARRAY['Spring', 'Summer', 'Fall', 'Winter', 'Early Spring', 'Late Summer', 'Autumn Colors', 'Snowy Winter', 'Rainy Season', 'Mild Weather'])
FROM public.topics WHERE name = 'Favorite Seasons';

INSERT INTO public.topic_items (topic_id, name)
SELECT id, unnest(ARRAY['Sitcoms', 'Dramas', 'Reality TV', 'Crime Shows', 'Sci-Fi Series', 'Documentaries', 'Game Shows', 'Cooking Shows', 'Talk Shows', 'Animated Series'])
FROM public.topics WHERE name = 'Best TV Show Types';