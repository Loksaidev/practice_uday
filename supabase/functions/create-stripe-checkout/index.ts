import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapping of store item names to Stripe Live Mode price IDs
const STRIPE_PRICE_MAP: Record<string, string> = {
  "Knowsy Game": "price_1SqEUj1AEIJnHVpA2I8u270i",
  "Couples Expansion Pack": "price_1SqEUh1AEIJnHVpAIbWozyRS",
  "Christmas Expansion Pack": "price_1SqEUd1AEIJnHVpAkqEClhW4",
};

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
}

interface CheckoutRequest {
  items: CartItem[];
  shippingAddress: {
    fullName: string;
    email: string;
    phone?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  subtotal: number;
  shipping: number;
  total: number;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-STRIPE-CHECKOUT] ${step}${detailsStr}`);
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
    logStep("Stripe key verified");

    const { items, shippingAddress, subtotal, shipping, total }: CheckoutRequest = await req.json();
    logStep("Request parsed", { itemCount: items.length, total });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Build line items from cart
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      const priceId = STRIPE_PRICE_MAP[item.name];
      if (priceId) {
        // Use existing Stripe price
        lineItems.push({
          price: priceId,
          quantity: item.quantity,
        });
        logStep(`Added item with existing price`, { name: item.name, priceId, quantity: item.quantity });
      } else {
        // Create price_data for items not in the mapping
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              description: item.description,
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        });
        logStep(`Added item with price_data`, { name: item.name, price: item.price, quantity: item.quantity });
      }
    }

    // Add shipping as a line item if not free
    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Shipping",
            description: shippingAddress.country === "US" ? "Standard US Shipping" : "International Shipping",
          },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      });
      logStep("Added shipping line item", { shipping });
    }

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Check if user is authenticated and has email
    let customerEmail = shippingAddress.email;
    let customerId: string | undefined;

    // Try to find existing Stripe customer
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      }
    }

    // Create Stripe Checkout session with prefilled shipping and automatic tax
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=true`,
      automatic_tax: {
        enabled: true,
      },
      customer_update: {
        shipping: 'auto',
      },
      phone_number_collection: {
        enabled: true,
      },
      shipping_address_collection: {
        allowed_countries: ["US", "GB"],
      },
      metadata: {
        items: JSON.stringify(items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price, image: i.image, description: i.description }))),
        shippingAddress: JSON.stringify(shippingAddress),
        subtotal: subtotal.toString(),
        shipping: shipping.toString(),
        total: total.toString(),
      },
    };

    // If we have an existing customer, update their shipping info; otherwise use prefilled defaults
    if (customerId) {
      // Update the customer's shipping address in Stripe
      await stripe.customers.update(customerId, {
        name: shippingAddress.fullName,
        phone: shippingAddress.phone || undefined,
        address: {
          line1: shippingAddress.addressLine1,
          line2: shippingAddress.addressLine2 || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
        shipping: {
          name: shippingAddress.fullName,
          phone: shippingAddress.phone || undefined,
          address: {
            line1: shippingAddress.addressLine1,
            line2: shippingAddress.addressLine2 || undefined,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.postalCode,
            country: shippingAddress.country,
          },
        },
      });
      logStep("Updated customer shipping address", { customerId });
    } else {
      // Create a new customer with shipping info to prefill checkout
      const newCustomer = await stripe.customers.create({
        email: customerEmail,
        name: shippingAddress.fullName,
        phone: shippingAddress.phone || undefined,
        address: {
          line1: shippingAddress.addressLine1,
          line2: shippingAddress.addressLine2 || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
        shipping: {
          name: shippingAddress.fullName,
          phone: shippingAddress.phone || undefined,
          address: {
            line1: shippingAddress.addressLine1,
            line2: shippingAddress.addressLine2 || undefined,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.postalCode,
            country: shippingAddress.country,
          },
        },
      });
      sessionParams.customer = newCustomer.id;
      sessionParams.customer_email = undefined;
      logStep("Created new customer with shipping", { customerId: newCustomer.id });
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
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
