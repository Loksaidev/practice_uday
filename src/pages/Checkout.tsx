import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, CreditCard, Package, Mail, AlertTriangle } from "lucide-react";
import {
  shippingAddressSchema,
  ShippingAddress,
  formatCurrency,
} from "@/lib/order-utils";
import {
  fetchShippingRates,
  fetchConversionRate,
  calculateShippingFromWeight,
  calculateTotalWeight,
  ShippingRate,
} from "@/lib/shipping-utils";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingStripeReturn, setProcessingStripeReturn] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [conversionRate, setConversionRate] = useState<number>(90.22);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  const subtotal = totalPrice;
  const totalWeight = calculateTotalWeight(items);
  const shippingResult = calculateShippingFromWeight(formData.country, totalWeight, shippingRates, conversionRate);
  const shipping = shippingResult.amount || 0;
  const total = subtotal + shipping;

  // Fetch shipping rates and conversion rate
  useEffect(() => {
    const loadShippingData = async () => {
      setShippingLoading(true);
      const [rates, rate] = await Promise.all([
        fetchShippingRates(),
        fetchConversionRate(),
      ]);
      setShippingRates(rates);
      setConversionRate(rate);
      setShippingLoading(false);
    };
    loadShippingData();
  }, []);

  // Redirect if cart is empty (but not if processing Stripe return)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isStripeReturn = urlParams.has("success") || urlParams.has("session_id");
    
    if (items.length === 0 && !isStripeReturn) {
      toast({
        title: "Cart is empty",
        description: "Add items to your cart before checkout",
        variant: "destructive",
      });
      navigate("/store");
    }
  }, [items, navigate, toast]);

  // Load user data if authenticated
  useEffect(() => {
    const loadUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setFormData((prev) => ({
          ...prev,
          email: user.email!,
        }));
      }
    };
    loadUserData();
  }, []);

  const handleStripePayment = async () => {
    // Check if shipping needs contact
    if (shippingResult.needsContact) {
      toast({
        title: "Contact Required",
        description: "Your order weight exceeds our standard shipping. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    const result = shippingAddressSchema.safeParse(formData);
    if (!result.success) {
      const firstError = result.error.errors[0];
      setFormErrors({ [firstError.path[0]]: firstError.message });
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(true);

    try {
      // Create Stripe checkout session via edge function
      const { data, error } = await supabase.functions.invoke("create-stripe-checkout", {
        body: {
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          shippingAddress: formData,
          subtotal,
          shipping,
          total,
        },
      });

      if (error || !data?.url) {
        throw new Error(error?.message || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Stripe payment error:", error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setProcessingPayment(false);
    }
  };

  // Ref to prevent double execution of Stripe verification
  const processingRef = useRef(false);

  // Handle return from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const sessionId = urlParams.get("session_id");
    const cancelled = urlParams.get("cancelled");

    // Handle cancelled payment
    if (cancelled) {
      window.history.replaceState({}, "", window.location.pathname);
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You can try again.",
        variant: "destructive",
      });
      return;
    }

    // Guard against double execution (React Strict Mode or re-renders)
    if (!success || !sessionId || processingRef.current) return;
    processingRef.current = true;
    setProcessingStripeReturn(true);

    // Clear URL params immediately to prevent re-execution on re-renders
    window.history.replaceState({}, "", window.location.pathname);

    const completeOrder = async () => {
      setLoading(true);
      try {
        // Verify payment and create order via edge function
        const { data, error } = await supabase.functions.invoke("verify-stripe-payment", {
          body: { sessionId },
        });

        if (error) {
          console.error("Verification network error:", error);
          throw new Error(`Payment verification failed: ${error.message}`);
        }

        if (data?.error) {
          console.error("Stripe error response:", data.error);
          throw new Error(`Stripe error: ${data.error}`);
        }

        if (!data?.success || !data?.orderId) {
          throw new Error("Failed to verify payment");
        }

        console.log("Order created:", data.orderId, data.orderNumber);

        // Clear cart and redirect
        clearCart();
        toast({
          title: "Order placed successfully!",
          description: `Order number: ${data.orderNumber}`,
        });
        navigate(`/order-confirmation/${data.orderId}`);
      } catch (error) {
        console.error("Error completing order:", error);
        toast({
          title: "Error",
          description: "Failed to complete order. Please contact support.",
          variant: "destructive",
        });
        setLoading(false);
        setProcessingStripeReturn(false);
        processingRef.current = false;
      }
    };

    completeOrder();
  }, [navigate, toast, clearCart]);

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateFormField = (field: keyof ShippingAddress) => {
    const result = shippingAddressSchema.safeParse(formData);
    if (!result.success) {
      const fieldError = result.error.errors.find((err) => err.path[0] === field);
      if (fieldError) {
        setFormErrors((prev) => ({ ...prev, [field]: fieldError.message }));
      }
    }
  };

  if (items.length === 0 && !processingStripeReturn) {
    return null;
  }

  // Show full-screen loader when processing Stripe return
  if (processingStripeReturn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-background/80">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <h2 className="font-heading text-2xl text-foreground">Processing your order...</h2>
          <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-background/80">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate("/cart")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>

          <h1 className="font-heading text-4xl md:text-5xl mb-8 bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] bg-clip-text text-transparent">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        onBlur={() => validateFormField("fullName")}
                        placeholder="John Doe"
                        className={formErrors.fullName ? "border-red-500" : ""}
                      />
                      {formErrors.fullName && <p className="text-sm text-red-500 mt-1">{formErrors.fullName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        onBlur={() => validateFormField("email")}
                        placeholder="john@example.com"
                        className={formErrors.email ? "border-red-500" : ""}
                      />
                      {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="addressLine1">Address Line 1 *</Label>
                      <Input
                        id="addressLine1"
                        value={formData.addressLine1}
                        onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                        onBlur={() => validateFormField("addressLine1")}
                        placeholder="123 Main Street"
                        className={formErrors.addressLine1 ? "border-red-500" : ""}
                      />
                      {formErrors.addressLine1 && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.addressLine1}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                      <Input
                        id="addressLine2"
                        value={formData.addressLine2}
                        onChange={(e) => handleInputChange("addressLine2", e.target.value)}
                        placeholder="Apt 4B"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        onBlur={() => validateFormField("city")}
                        placeholder="New York"
                        className={formErrors.city ? "border-red-500" : ""}
                      />
                      {formErrors.city && <p className="text-sm text-red-500 mt-1">{formErrors.city}</p>}
                    </div>

                    <div>
                      <Label htmlFor="state">State/Province *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        onBlur={() => validateFormField("state")}
                        placeholder="NY"
                        className={formErrors.state ? "border-red-500" : ""}
                      />
                      {formErrors.state && <p className="text-sm text-red-500 mt-1">{formErrors.state}</p>}
                    </div>

                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange("postalCode", e.target.value)}
                        onBlur={() => validateFormField("postalCode")}
                        placeholder="10001"
                        className={formErrors.postalCode ? "border-red-500" : ""}
                      />
                      {formErrors.postalCode && <p className="text-sm text-red-500 mt-1">{formErrors.postalCode}</p>}
                    </div>

                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-2">
                        For other countries, contact{" "}
                        <a href="mailto:support.knowsy@luverly.shop" className="text-primary hover:underline font-medium">
                          support.knowsy@luverly.shop
                        </a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Section */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleStripePayment}
                    disabled={processingPayment || loading || shippingResult.needsContact || shippingLoading}
                    className="w-full"
                    size="lg"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Redirecting to Checkout...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay with Card
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4 text-center">Secure payment powered by Stripe</p>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-sm">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      {shippingLoading ? (
                        <span className="text-muted-foreground">Calculating...</span>
                      ) : shippingResult.needsContact ? (
                        <span className="text-destructive font-medium">Contact Support</span>
                      ) : (
                        <span>{formatCurrency(shipping)}</span>
                      )}
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      {shippingResult.needsContact ? (
                        <span className="text-destructive">—</span>
                      ) : (
                        <span>{formatCurrency(total)}</span>
                      )}
                    </div>
                  </div>

                  {shippingResult.needsContact && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-destructive">Order Exceeds 5kg</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Please contact us for a custom shipping quote:{" "}
                            <a href="mailto:support.knowsy@luverly.shop" className="text-primary hover:underline font-medium">
                              support.knowsy@luverly.shop
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shipping & Contact Info */}
                  <div className="mt-4 p-3 rounded-lg border-2 border-primary/20 bg-primary/5 space-y-3">
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-xs">US & UK Shipping Only</p>
                        <p className="text-xs text-muted-foreground">
                          Other countries:{" "}
                          <a href="mailto:support.knowsy@luverly.shop" className="text-primary hover:underline">
                            support.knowsy@luverly.shop
                          </a>
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-xs">Bulk Orders & Customizations</p>
                        <p className="text-xs text-muted-foreground">
                          <a href="mailto:support.knowsy@luverly.shop" className="text-primary hover:underline">
                            support.knowsy@luverly.shop
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
