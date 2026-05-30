// Stripe configuration
// Replace with your real keys from https://dashboard.stripe.com
export const STRIPE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string) ||
  "pk_test_YOUR_KEY_HERE";

// Check if Stripe is properly configured
export const isStripeConfigured = (): boolean => {
  return (
    STRIPE_PUBLISHABLE_KEY.startsWith("pk_test_") ||
    STRIPE_PUBLISHABLE_KEY.startsWith("pk_live_")
  ) && STRIPE_PUBLISHABLE_KEY.length > 20;
};

// Price IDs - Create these in Stripe Dashboard → Products → Add product
// Each product needs a Price with recurring or one-time billing
export const STRIPE_PRICES = {
  private: "price_private_placeholder", // 500 kr one-time
  felles: "price_felles_placeholder", // 179 kr one-time
} as const;

// Your domain for redirects
export const STRIPE_SUCCESS_URL = window.location.origin + "/#/booking-confirmed";
export const STRIPE_CANCEL_URL = window.location.origin + "/#/booking-cancelled";

// Payment lock timeout in minutes
export const PAYMENT_LOCK_MINUTES = 15;

/**
 * To set up real Stripe payments:
 *
 * 1. Create a Stripe account at https://dashboard.stripe.com
 * 2. Get your Publishable Key (pk_test_...) from Developers → API keys
 * 3. Replace STRIPE_PUBLISHABLE_KEY above
 *
 * FOR FULL CHECKOUT (requires backend):
 * 4. Create Products in Stripe Dashboard with your prices
 * 5. Copy the Price IDs (price_xxx) to STRIPE_PRICES above
 * 6. Set up a backend endpoint that creates Checkout Sessions
 *    POST /create-checkout-session
 *    Body: { priceId, bookingId }
 *    Returns: { sessionId }
 *
 * 7. In handleStripeCheckout(), call your backend:
 *    const { sessionId } = await fetch('/create-checkout-session', ...)
 *    const result = await stripe.redirectToCheckout({ sessionId })
 *
 * FOR CLIENT-ONLY CHECKOUT (no backend, limited):
 * 4. Use Stripe Payment Links instead:
 *    - Create products in Stripe Dashboard
 *    - Go to Payment Links and create links for each product
 *    - Use those URLs directly: window.location.href = "https://buy.stripe.com/..."
 *
 * PAYMENT STATUS FLOW:
 * 1. User clicks "Bekreft og betal"
 * 2. Booking saved with status "awaiting_payment" + 15min lock
 * 3. User redirected to Stripe Checkout (or simulated)
 * 4a. Success → Stripe redirects to /booking-confirmed?session_id=xxx
 * 4b. Cancel → Stripe redirects to /booking-cancelled
 * 5. On success page: booking updated to "confirmed" + "paid"
 * 6. If not paid within 15 min: booking auto-deleted, slot freed
 */