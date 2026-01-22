-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;

-- Create new policy for orders using JWT email claim instead of auth.users
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT TO public
  USING (
    (auth.uid() = user_id) 
    OR (email = (auth.jwt() ->> 'email')::text)
  );

-- Create new policy for order_items using JWT email claim
CREATE POLICY "Users can view their order items" ON order_items
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (
          orders.user_id = auth.uid()
          OR orders.email = (auth.jwt() ->> 'email')::text
        )
    )
  );