-- Add price breakdown columns to orders table
ALTER TABLE public.orders
ADD COLUMN subtotal numeric,
ADD COLUMN shipping_amount numeric,
ADD COLUMN tax_amount numeric;