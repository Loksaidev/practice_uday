import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, ShoppingBag } from "lucide-react";
import { formatCurrency, formatOrderStatus } from "@/lib/order-utils";

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  order_items: { quantity: number }[];
}

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }

        setUserEmail(user.email || "");

        // Fetch user's orders with order items count
        const { data: ordersData, error } = await supabase
          .from("orders")
          .select(`
            id,
            order_number,
            total_amount,
            payment_status,
            created_at,
            order_items (
              quantity
            )
          `)
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setOrders(ordersData || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  const getTotalItems = (order: Order) => {
    return order.order_items.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-background/80">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24">
          <Loader2 className="w-8 h-8 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-background/80">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="font-heading text-4xl md:text-5xl mb-2 bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] bg-clip-text text-transparent">
                My Orders
              </h1>
              {userEmail && (
                <p className="text-muted-foreground">Orders for {userEmail}</p>
              )}
            </div>

            {orders.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start shopping to see your orders here
                </p>
                <Link to="/store">
                  <Button size="lg">Browse Store</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusInfo = formatOrderStatus(order.payment_status);
                  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });

                  return (
                    <Card key={order.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg">
                              Order #{order.order_number}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Placed on {orderDate}
                            </p>
                          </div>
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Amount</p>
                              <p className="text-xl font-bold">
                                {formatCurrency(order.total_amount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Items</p>
                              <p className="text-xl font-bold flex items-center gap-1">
                                <Package className="w-5 h-5" />
                                {getTotalItems(order)}
                              </p>
                            </div>
                          </div>
                          <Link to={`/order-confirmation/${order.id}`}>
                            <Button variant="outline">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyOrders;
