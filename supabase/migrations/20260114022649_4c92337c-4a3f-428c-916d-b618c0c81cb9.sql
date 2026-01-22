-- Create shipping_rates table
CREATE TABLE public.shipping_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  min_weight_kg DECIMAL(6,3) NOT NULL,
  max_weight_kg DECIMAL(6,3) NOT NULL,
  cost_inr DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app_settings table for conversion rates
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for shipping_rates
CREATE POLICY "Anyone can view shipping rates"
ON public.shipping_rates FOR SELECT
USING (true);

-- Public read access for app_settings
CREATE POLICY "Anyone can view app settings"
ON public.app_settings FOR SELECT
USING (true);

-- Insert USD to INR conversion rate
INSERT INTO public.app_settings (key, value, description)
VALUES ('usd_to_inr', '90.22', 'USD to INR conversion rate (1 USD = X INR)');

-- Insert USA shipping rates
INSERT INTO public.shipping_rates (country_code, min_weight_kg, max_weight_kg, cost_inr) VALUES
('US', 0.11, 0.20, 575),
('US', 0.20, 0.49, 911),
('US', 0.50, 0.59, 1203),
('US', 0.60, 0.69, 1250),
('US', 0.70, 0.79, 1350),
('US', 0.80, 0.89, 1440),
('US', 0.90, 0.99, 1550),
('US', 1.00, 1.49, 1950),
('US', 1.50, 1.99, 2540),
('US', 2.00, 2.49, 3100),
('US', 2.50, 2.99, 3670),
('US', 3.00, 3.49, 4200),
('US', 3.50, 3.99, 4750),
('US', 4.00, 4.49, 5300),
('US', 4.50, 4.99, 5875);

-- Insert UK shipping rates
INSERT INTO public.shipping_rates (country_code, min_weight_kg, max_weight_kg, cost_inr) VALUES
('GB', 0.11, 0.19, 360),
('GB', 0.20, 0.49, 440),
('GB', 0.50, 0.59, 525),
('GB', 0.60, 0.69, 570),
('GB', 0.70, 0.79, 615),
('GB', 0.80, 0.89, 661),
('GB', 0.90, 0.99, 705),
('GB', 1.00, 1.49, 838),
('GB', 1.50, 1.99, 1058),
('GB', 2.00, 2.49, 1280),
('GB', 2.50, 2.99, 1650),
('GB', 3.00, 3.49, 1995),
('GB', 3.50, 3.99, 2510),
('GB', 4.00, 4.49, 2775),
('GB', 4.50, 4.99, 3035);