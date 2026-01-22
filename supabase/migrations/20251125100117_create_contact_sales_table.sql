-- Create contact_sales table to store contact form submissions
CREATE TABLE public.contact_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contact_sales table
ALTER TABLE public.contact_sales ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert contact sales submissions
CREATE POLICY "Anyone can insert contact sales"
ON public.contact_sales
FOR INSERT
WITH CHECK (true);

-- Super admins can view all contact sales submissions
CREATE POLICY "Super admins can view contact sales"
ON public.contact_sales
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create index on email for fast lookups
CREATE INDEX idx_contact_sales_email ON public.contact_sales(email);

-- Create index on created_at for sorting
CREATE INDEX idx_contact_sales_created_at ON public.contact_sales(created_at);