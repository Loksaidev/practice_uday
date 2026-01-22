import { z } from "zod";

// Shipping address validation schema
export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100, "Full name must be less than 100 characters"),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().optional(),
  addressLine1: z.string().min(5, "Address is required").max(200, "Address must be less than 200 characters"),
  addressLine2: z.string().max(200, "Address must be less than 200 characters").optional(),
  city: z.string().min(2, "City is required").max(100, "City must be less than 100 characters"),
  state: z.string().min(2, "State/Province is required").max(100, "State/Province must be less than 100 characters"),
  postalCode: z.string().min(3, "Postal code is required").max(20, "Postal code must be less than 20 characters"),
  country: z.string().min(2, "Country is required").max(2, "Country code must be 2 characters"),
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

// Generate a unique order number
export const generateOrderNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `ORD-${date}-${random}`;
};

// Calculate shipping cost based on location and cart
export const calculateShipping = (country: string, subtotal: number): number => {
  // Free shipping for orders over $50
  if (subtotal >= 50) {
    return 0;
  }
  
  // US domestic shipping
  if (country === 'US') {
    return 5.99;
  }
  
  // International shipping
  return 15.99;
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Format order status for display
export const formatOrderStatus = (status: string): { label: string; color: string } => {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-yellow-500' },
    completed: { label: 'Completed', color: 'bg-green-500' },
    failed: { label: 'Failed', color: 'bg-red-500' },
    refunded: { label: 'Refunded', color: 'bg-gray-500' },
  };
  
  return statusMap[status] || { label: status, color: 'bg-gray-500' };
};

// Calculate estimated delivery date
export const getEstimatedDelivery = (country: string): string => {
  const today = new Date();
  let daysToAdd = country === 'US' ? 5 : 14; // 5 days US, 14 days international
  
  const deliveryDate = new Date(today);
  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
  
  return deliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
