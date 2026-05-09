/**
 * White-Label Store Configuration
 * 
 * This is the single source of truth for store theming and features.
 * All agents must respect this config when building components.
 */

export const storeConfig = {
  // Store Identity
  name: "Onsus Electronics",
  description: "Premium electronics and gadgets",
  
  // Brand Colors (CSS HSL values)
  colors: {
    primary: "222.2 47.4% 11.2%",
    accent: "210 40% 96.1%",
    background: "0 0% 100%",
    foreground: "222.2 84% 4.9%",
  },
  
  // Features (toggle capabilities)
  features: {
    wishlist: true,
    reviews: true,
    inventoryTracking: true,
    analytics: true,
    multiCurrency: false,
    payOnDelivery: true,
  },
  
  // Commerce Settings
  currency: {
    code: "AZN",
    symbol: "₼",
    name: "Azerbaijani Manat",
  },
  
  // UI Settings
  ui: {
    productsPerPage: 24,
    maxWishlistItems: 100,
    maxCartItems: 50,
    showOutOfStock: true,
    allowGuestCheckout: true,
  },
  
  // Payment Settings (Pay-on-Delivery)
  payment: {
    method: "cod", // cash on delivery
    requirePhone: true,
    requireAddress: true,
    orderRateLimit: 5, // orders per hour per IP
  }
} as const;

export type StoreConfig = typeof storeConfig;
