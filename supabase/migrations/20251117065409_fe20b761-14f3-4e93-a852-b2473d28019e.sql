-- Create orders table to track all customer orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  shipping_address JSONB NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  paypal_order_id TEXT,
  paypal_transaction_id TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table to store individual items in each order
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.store_items(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_description TEXT NOT NULL,
  product_image TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders (by user_id or email)
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Authenticated users can insert orders
CREATE POLICY "Authenticated users can insert orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Super admins can view all orders
CREATE POLICY "Super admins can view all orders"
ON public.orders
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can update orders
CREATE POLICY "Super admins can update orders"
ON public.orders
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Org admins can view their organization's orders
CREATE POLICY "Org admins can view their organization orders"
ON public.orders
FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND is_org_admin(auth.uid(), organization_id)
);

-- Users can view order items for their orders
CREATE POLICY "Users can view their order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (
      orders.user_id = auth.uid()
      OR orders.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- Super admins can view all order items
CREATE POLICY "Super admins can view all order items"
ON public.order_items
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Anyone can insert order items during checkout
CREATE POLICY "Users can insert order items"
ON public.order_items
FOR INSERT
WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on order_number for fast lookups
CREATE INDEX idx_orders_order_number ON public.orders(order_number);

-- Create index on user_id for fast user order queries
CREATE INDEX idx_orders_user_id ON public.orders(user_id);

-- Create index on email for guest order queries
CREATE INDEX idx_orders_email ON public.orders(email);

-- Create index on payment_status for admin filtering
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);

-- Create index on order_id for order items
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);