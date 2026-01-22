-- Create store_items table
CREATE TABLE public.store_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  rating NUMERIC(2, 1) DEFAULT 4.5,
  stock INTEGER DEFAULT 100,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view store items" 
ON public.store_items 
FOR SELECT 
USING (true);

CREATE POLICY "Super admins can insert store items" 
ON public.store_items 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update store items" 
ON public.store_items 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete store items" 
ON public.store_items 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_store_items_updated_at
BEFORE UPDATE ON public.store_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample store items (will update with real images after generation)
INSERT INTO public.store_items (name, description, price, image_url, category, rating, stock, featured) VALUES
('Knowsy Board Game', 'The official Knowsy board game - bring the fun to your table! Complete with game board, cards, and all accessories needed for hours of entertainment.', 39.99, '/placeholder.svg', 'Games', 4.8, 50, true),
('Knowsy T-Shirt', 'Premium cotton t-shirt with Knowsy logo. Comfortable, stylish, and perfect for game nights. Available in multiple sizes.', 24.99, '/placeholder.svg', 'Apparel', 4.5, 100, false),
('Knowsy Card Deck', 'Exclusive topic cards for endless gameplay. Contains 200+ unique topic cards across various categories to keep the game fresh and exciting.', 14.99, '/placeholder.svg', 'Games', 4.9, 75, true),
('Knowsy Mug', 'Ceramic mug perfect for game night beverages. Features the Knowsy logo and holds 12oz of your favorite drink. Microwave and dishwasher safe.', 12.99, '/placeholder.svg', 'Accessories', 4.6, 120, false);