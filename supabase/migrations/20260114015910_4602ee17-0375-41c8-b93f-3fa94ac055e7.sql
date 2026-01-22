-- Add weight_kg column to store_items table
ALTER TABLE store_items 
ADD COLUMN weight_kg DECIMAL(6,3);

-- Update existing products with weight data
UPDATE store_items SET weight_kg = 0.075 WHERE name = 'Christmas Expansion Pack';
UPDATE store_items SET weight_kg = 0.11 WHERE name = 'Couples Expansion Pack';
UPDATE store_items SET weight_kg = 0.565 WHERE name = 'Knowsy Game';