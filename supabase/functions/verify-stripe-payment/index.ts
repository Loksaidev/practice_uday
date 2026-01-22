import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-STRIPE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("Session ID is required");
    }
    logStep("Verifying session", { sessionId });

    // Check if order already exists for this session
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("stripe_session_id", sessionId)
      .single();

    if (existingOrder) {
      logStep("Order already exists", { orderId: existingOrder.id });
      return new Response(JSON.stringify({ 
        success: true, 
        orderId: existingOrder.id,
        orderNumber: existingOrder.order_number,
        alreadyProcessed: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
    logStep("Session retrieved", { status: session.status, paymentStatus: session.payment_status });

    if (session.payment_status !== "paid") {
      throw new Error(`Payment not completed. Status: ${session.payment_status}`);
    }

    // Parse metadata
    const items = JSON.parse(session.metadata?.items || "[]");
    const shippingAddress = JSON.parse(session.metadata?.shippingAddress || "{}");
    
    // Extract pricing from Stripe session (amounts are in cents)
    const subtotal = (session.amount_subtotal || 0) / 100;
    const shippingAmount = (session.total_details?.amount_shipping || 0) / 100;
    const taxAmount = (session.total_details?.amount_tax || 0) / 100;
    const total = (session.amount_total || 0) / 100;

    logStep("Pricing extracted from Stripe", { subtotal, shippingAmount, taxAmount, total });

    // Get payment intent ID
    const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;
    const paymentIntentId = typeof session.payment_intent === "string" 
      ? session.payment_intent 
      : paymentIntent?.id;

    // Generate order number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `KNS-${timestamp}-${random}`;

    // Get user ID from auth header if available
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      userId = userData?.user?.id || null;
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        email: shippingAddress.email || session.customer_email || session.customer_details?.email,
        full_name: shippingAddress.fullName,
        phone: shippingAddress.phone,
        shipping_address: shippingAddress,
        order_number: orderNumber,
        subtotal: subtotal,
        shipping_amount: shippingAmount,
        tax_amount: taxAmount,
        total_amount: total,
        payment_status: "completed",
        stripe_session_id: sessionId,
        stripe_payment_intent_id: paymentIntentId,
      })
      .select()
      .single();

    if (orderError) {
      logStep("Order insert error", { error: orderError.message });
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    logStep("Order created", { orderId: order.id, orderNumber });

    // Create order items
    const orderItems = items.map((item: { id: string; name: string; description: string; image: string; quantity: number; price: number }) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      product_description: item.description,
      product_image: item.image,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      logStep("Order items insert error", { error: itemsError.message });
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    logStep("Order items created", { count: orderItems.length });

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      orderNumber: order.order_number,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
