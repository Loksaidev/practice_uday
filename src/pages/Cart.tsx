import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Mail, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleClearCart = () => {
    clearCart();
    toast({
      title: t("cart.clearedTitle"),
      description: t("cart.clearedDescription"),
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-background/80">
        <Header />
        
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center py-16">
              <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-muted-foreground" />
              <h1 className="font-heading text-4xl md:text-5xl mb-4">{t("cart.emptyTitle")}</h1>
              <p className="font-body text-xl text-muted-foreground mb-8">
                {t("cart.emptyDescription")}
              </p>
              <Link to="/store">
                <Button variant="default" size="lg" className="gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  {t("cart.continueShopping")}
                </Button>
              </Link>
            </div>
          </div>
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
            <div className="flex items-center justify-between mb-8">
              <h1 className="font-heading text-4xl md:text-5xl bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] bg-clip-text text-transparent">
                {t("cart.title")}
              </h1>
              <Button variant="ghost" onClick={handleClearCart} className="gap-2">
                <Trash2 className="w-4 h-4" />
                {t("cart.clearCart")}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-heading text-xl">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-12 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">${item.price.toFixed(2)} {t("cart.each")}</div>
                              <div className="font-heading text-xl text-primary">
                                ${(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="font-heading text-2xl">{t("cart.orderSummary")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("cart.items")} ({totalItems})</span>
                      <span className="font-medium">${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Weight</span>
                      <span className="font-medium">
                        {items.reduce((sum, item) => sum + (item.weight_kg || 0) * item.quantity, 0).toFixed(2)} kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("cart.shipping")}</span>
                      <span className="font-medium text-muted-foreground">Calculated at checkout</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg">
                      <span className="font-heading">Subtotal</span>
                      <span className="font-heading text-primary">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleCheckout}
                    >
                      {t("cart.proceedToCheckout")}
                    </Button>
                    <Link to="/store" className="w-full">
                      <Button variant="outline" className="w-full gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        {t("cart.continueShopping")}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>

                {/* Shipping & Contact Info */}
                <Card className="mt-4 border-2 border-primary/20 bg-primary/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Shipping to US & UK only</p>
                        <p className="text-sm text-muted-foreground">
                          For other countries, contact us at{" "}
                          <a href="mailto:support.knowsy@luverly.shop" className="text-primary hover:underline font-medium">
                            support.knowsy@luverly.shop
                          </a>
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Bulk Orders & Customizations</p>
                        <p className="text-sm text-muted-foreground">
                          Contact us at{" "}
                          <a href="mailto:support.knowsy@luverly.shop" className="text-primary hover:underline font-medium">
                            support.knowsy@luverly.shop
                          </a>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
