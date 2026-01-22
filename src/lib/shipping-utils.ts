import { supabase } from "@/integrations/supabase/client";

export interface ShippingRate {
  id: string;
  country_code: string;
  min_weight_kg: number;
  max_weight_kg: number;
  cost_inr: number;
}

export interface ShippingResult {
  amount: number | null;
  needsContact: boolean;
}

// Fetch all shipping rates from database
export const fetchShippingRates = async (): Promise<ShippingRate[]> => {
  const { data, error } = await supabase
    .from("shipping_rates")
    .select("*")
    .order("country_code")
    .order("min_weight_kg");

  if (error) {
    console.error("Error fetching shipping rates:", error);
    return [];
  }

  return data || [];
};

// Fetch USD to INR conversion rate from app_settings
export const fetchConversionRate = async (): Promise<number> => {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "usd_to_inr")
    .single();

  if (error || !data) {
    console.error("Error fetching conversion rate:", error);
    return 90.22; // Fallback default
  }

  return parseFloat(data.value);
};

// Calculate shipping cost based on weight and country
export const calculateShippingFromWeight = (
  countryCode: string,
  weightKg: number,
  rates: ShippingRate[],
  conversionRate: number
): ShippingResult => {
  // If weight is below minimum (0.11), use the lowest slab
  if (weightKg < 0.11) {
    weightKg = 0.11;
  }

  // If weight >= 5kg, customer needs to contact support
  if (weightKg >= 5) {
    return { amount: null, needsContact: true };
  }

  // Find matching rate for country and weight
  const matchingRate = rates.find(
    (rate) =>
      rate.country_code === countryCode &&
      weightKg >= rate.min_weight_kg &&
      weightKg <= rate.max_weight_kg
  );

  if (!matchingRate) {
    // No matching rate found - customer needs to contact support
    return { amount: null, needsContact: true };
  }

  // Convert INR to USD
  const usdAmount = matchingRate.cost_inr / conversionRate;
  
  // Round to 2 decimal places
  return { amount: Math.round(usdAmount * 100) / 100, needsContact: false };
};

// Calculate total weight from cart items
export const calculateTotalWeight = (
  items: Array<{ weight_kg?: number; quantity: number }>
): number => {
  return items.reduce((sum, item) => sum + (item.weight_kg || 0) * item.quantity, 0);
};
