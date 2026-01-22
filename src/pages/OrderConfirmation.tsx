import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package, Truck, Loader2 } from "lucide-react";
import { formatCurrency, getEstimatedDelivery, formatOrderStatus } from "@/lib/order-utils";

interface Order {
  id: string;
  order_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  shipping_address: any;
  subtotal: number | null;
  shipping_amount: number | null;
  tax_amount: number | null;
  total_amount: number;
  payment_status: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_description: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        navigate("/store");
        return;
      }

      try {
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (orderError) throw orderError;

        // Fetch order items
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId);

        if (itemsError) throw itemsError;

        setOrder(orderData);
        setOrderItems(itemsData || []);
      } catch (error) {
        console.error("Error fetching order:", error);
        navigate("/store");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-background/80">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const shippingAddress = order.shipping_address;
  const estimatedDelivery = getEstimatedDelivery(shippingAddress.country);
  const statusInfo = formatOrderStatus(order.payment_status);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-background/80">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="font-heading text-4xl md:text-5xl mb-2">
                Order Confirmed!
              </h1>
              <p className="text-xl text-muted-foreground">
                Thank you for your purchase, {order.full_name}
              </p>
              <p className="text-muted-foreground mt-2">
                Order number: <span className="font-mono font-bold">{order.order_number}</span>
              </p>
            </div>

            {/* Order Status Timeline */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mb-2">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium">Confirmed</p>
                  </div>
                  
                  <div className="flex-1 h-1 bg-muted mx-4"></div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                      <Package className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">Processing</p>
                  </div>
                  
                  <div className="flex-1 h-1 bg-muted mx-4"></div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                      <Truck className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">Shipped</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Estimated Delivery:</span> {estimatedDelivery}
                  </p>
                  <p className="text-sm mt-1 text-muted-foreground">
                    You'll receive a shipping confirmation email with tracking information once your order ships.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{order.full_name}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {shippingAddress.addressLine1}
                    {shippingAddress.addressLine2 && (
                      <>
                        <br />
                        {shippingAddress.addressLine2}
                      </>
                    )}
                    <br />
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                    <br />
                    {shippingAddress.country}
                  </p>
                  {order.phone && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Phone: {order.phone}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payment Status</span>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </div>
                    <Separator className="my-3" />
                    {order.subtotal != null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Subtotal</span>
                        <span className="text-sm">{formatCurrency(order.subtotal)}</span>
                      </div>
                    )}
                    {order.shipping_amount != null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Shipping</span>
                        <span className="text-sm">{order.shipping_amount === 0 ? "Free" : formatCurrency(order.shipping_amount)}</span>
                      </div>
                    )}
                    {order.tax_amount != null && order.tax_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tax</span>
                        <span className="text-sm">{formatCurrency(order.tax_amount)}</span>
                      </div>
                    )}
                    <Separator className="my-3" />
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total</span>
                      <span className="text-sm font-bold">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    A confirmation email has been sent to {order.email}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Order Items */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.product_description}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.unit_price)} each
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/my-orders">
                <Button variant="outline" size="lg">
                  View All Orders
                </Button>
              </Link>
              <Link to="/store">
                <Button size="lg">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
